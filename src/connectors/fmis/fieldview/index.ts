/**
 * Climate FieldView Connector
 *
 * OAuth2 skeleton for integrating with Climate FieldView APIs.
 * See: https://developer.climate.com
 *
 * SETUP REQUIRED:
 * 1. Register an application at developer.climate.com
 * 2. Configure OAuth2 credentials in your .env file
 * 3. Set up redirect URI for your farm_clawed instance
 *
 * This is a skeleton implementation - actual API calls depend on your
 * FieldView developer account permissions.
 */

import { z } from "zod";
import {
  OAuth2Config,
  OAuth2Tokens,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  isTokenExpired,
  generateState,
  authenticatedFetch,
} from "../oauth-base.js";
import { GeoJSON } from "../csv-import/index.js";

/**
 * FieldView-specific configuration
 */
export const FieldViewConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  // FieldView API base URL
  apiBaseUrl: z.string().url().default("https://platform.climate.com"),
  // FieldView OAuth endpoints
  authorizationEndpoint: z
    .string()
    .url()
    .default("https://climate.com/static/app-login/index.html"),
  tokenEndpoint: z.string().url().default("https://api.climate.com/api/oauth/token"),
});

export type FieldViewConfig = z.infer<typeof FieldViewConfigSchema>;

/**
 * FieldView field
 */
export interface FieldViewField {
  id: string;
  name: string;
  farmId: string;
  farmName: string;
  acres: number;
  boundary?: GeoJSON.Geometry;
  cropType?: string;
  plantingDate?: string;
}

/**
 * FieldView farm
 */
export interface FieldViewFarm {
  id: string;
  name: string;
  state?: string;
  country?: string;
  fieldCount?: number;
  totalAcres?: number;
}

/**
 * FieldView prescription (variable rate application)
 */
export interface FieldViewPrescription {
  id: string;
  name: string;
  fieldId: string;
  fieldName: string;
  type: "seeding" | "fertilizer" | "pesticide" | "other";
  productName?: string;
  targetRate?: number;
  rateUnit?: string;
  createdAt: string;
  status: "draft" | "approved" | "applied";
}

/**
 * FieldView activity/operation
 */
export interface FieldViewActivity {
  id: string;
  fieldId: string;
  fieldName: string;
  type: string; // planting, application, tillage, harvest, etc.
  date: string;
  productName?: string;
  rate?: number;
  rateUnit?: string;
  operator?: string;
  notes?: string;
}

/**
 * FieldView imagery/scouting layer
 */
export interface FieldViewImagery {
  id: string;
  fieldId: string;
  type: "satellite" | "scouting" | "aerial";
  captureDate: string;
  layerType?: string; // NDVI, true color, etc.
  cloudCover?: number;
  url?: string;
}

/**
 * Sync status for tracking data freshness
 */
export interface FieldViewSyncStatus {
  lastSync: string;
  farms: number;
  fields: number;
  prescriptions: number;
  activities: number;
  errors: string[];
}

/**
 * Climate FieldView Connector
 */
export class FieldViewConnector {
  private config: FieldViewConfig;
  private tokens: OAuth2Tokens | null = null;
  private pendingState: string | null = null;

  constructor(config: Partial<FieldViewConfig> & { clientId: string; clientSecret: string }) {
    this.config = FieldViewConfigSchema.parse({
      redirectUri: "http://localhost:18789/oauth/fieldview/callback",
      ...config,
    });
  }

  /**
   * Get OAuth2 configuration
   */
  private getOAuthConfig(): OAuth2Config {
    return {
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      redirectUri: this.config.redirectUri,
      authorizationEndpoint: this.config.authorizationEndpoint,
      tokenEndpoint: this.config.tokenEndpoint,
      scopes: ["openid", "profile", "fields:read"],
    };
  }

  /**
   * Start OAuth2 authorization flow
   * Returns the URL to redirect the user to
   */
  startAuthorization(): { url: string; state: string } {
    this.pendingState = generateState();
    const url = buildAuthorizationUrl(this.getOAuthConfig(), this.pendingState);
    return { url, state: this.pendingState };
  }

  /**
   * Complete OAuth2 authorization with the callback code
   */
  async completeAuthorization(code: string, state: string): Promise<boolean> {
    if (state !== this.pendingState) {
      throw new Error("Invalid state parameter - possible CSRF attack");
    }

    this.tokens = await exchangeCodeForTokens(this.getOAuthConfig(), code);
    this.pendingState = null;
    return true;
  }

  /**
   * Ensure we have valid tokens, refreshing if needed
   */
  private async ensureValidTokens(): Promise<OAuth2Tokens> {
    if (!this.tokens) {
      throw new Error("Not authenticated - call startAuthorization first");
    }

    if (isTokenExpired(this.tokens) && this.tokens.refreshToken) {
      this.tokens = await refreshAccessToken(this.getOAuthConfig(), this.tokens.refreshToken);
    }

    return this.tokens;
  }

  /**
   * Check if connected and authenticated
   */
  isConnected(): boolean {
    return this.tokens !== null && !isTokenExpired(this.tokens);
  }

  /**
   * Set tokens directly (e.g., loaded from storage)
   */
  setTokens(tokens: OAuth2Tokens): void {
    this.tokens = tokens;
  }

  /**
   * Get current tokens (for storage)
   * WARNING: Handle securely - do not log or expose
   */
  getTokens(): OAuth2Tokens | null {
    return this.tokens;
  }

  /**
   * List farms the user has access to
   */
  async listFarms(): Promise<FieldViewFarm[]> {
    const tokens = await this.ensureValidTokens();
    const response = await authenticatedFetch(`${this.config.apiBaseUrl}/v4/farms`, tokens, {
      headers: {
        Accept: "application/json",
        "X-Api-Key": this.config.clientId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list farms: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map((farm: Record<string, unknown>) => ({
      id: typeof farm.id === "string" ? farm.id : "",
      name: typeof farm.name === "string" ? farm.name : "",
      state: typeof farm.state === "string" ? farm.state : undefined,
      country: typeof farm.country === "string" ? farm.country : undefined,
    }));
  }

  /**
   * List fields for a farm
   */
  async listFields(farmId: string): Promise<FieldViewField[]> {
    const tokens = await this.ensureValidTokens();
    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/v4/fields?farmId=${farmId}`,
      tokens,
      {
        headers: {
          Accept: "application/json",
          "X-Api-Key": this.config.clientId,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to list fields: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map((field: Record<string, unknown>) => ({
      id: typeof field.id === "string" ? field.id : "",
      name: typeof field.name === "string" ? field.name : "",
      farmId,
      farmName: typeof field.farmName === "string" ? field.farmName : "",
      acres: typeof field.acres === "number" ? field.acres : 0,
      boundary: field.boundary,
      cropType: typeof field.cropType === "string" ? field.cropType : undefined,
      plantingDate: typeof field.plantingDate === "string" ? field.plantingDate : undefined,
    }));
  }

  /**
   * List prescriptions for a field
   */
  async listPrescriptions(fieldId: string): Promise<FieldViewPrescription[]> {
    const tokens = await this.ensureValidTokens();
    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/v4/fields/${fieldId}/prescriptions`,
      tokens,
      {
        headers: {
          Accept: "application/json",
          "X-Api-Key": this.config.clientId,
        },
      },
    );

    if (!response.ok) {
      // Prescriptions API may not be enabled
      if (response.status === 403 || response.status === 404) {
        return [];
      }
      throw new Error(`Failed to list prescriptions: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map((rx: Record<string, unknown>) => ({
      id: typeof rx.id === "string" ? rx.id : "",
      name: typeof rx.name === "string" ? rx.name : "Unnamed Prescription",
      fieldId,
      fieldName: typeof rx.fieldName === "string" ? rx.fieldName : "",
      type: this.parsePrescriptionType(rx.type),
      productName: typeof rx.productName === "string" ? rx.productName : undefined,
      targetRate: typeof rx.targetRate === "number" ? rx.targetRate : undefined,
      rateUnit: typeof rx.rateUnit === "string" ? rx.rateUnit : undefined,
      createdAt: typeof rx.createdAt === "string" ? rx.createdAt : new Date().toISOString(),
      status:
        rx.status === "APPROVED"
          ? ("approved" as const)
          : rx.status === "APPLIED"
            ? ("applied" as const)
            : ("draft" as const),
    }));
  }

  private parsePrescriptionType(type: unknown): "seeding" | "fertilizer" | "pesticide" | "other" {
    if (typeof type !== "string") return "other";
    const lowerType = type.toLowerCase();
    if (lowerType.includes("seed") || lowerType.includes("plant")) return "seeding";
    if (lowerType.includes("fertil") || lowerType.includes("nutrient")) return "fertilizer";
    if (lowerType.includes("pest") || lowerType.includes("herb") || lowerType.includes("fungi"))
      return "pesticide";
    return "other";
  }

  /**
   * List activities for a field
   */
  async listActivities(fieldId: string, year?: number): Promise<FieldViewActivity[]> {
    const tokens = await this.ensureValidTokens();
    const yearParam = year ? `&year=${year}` : "";
    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/v4/fields/${fieldId}/activities?${yearParam}`,
      tokens,
      {
        headers: {
          Accept: "application/json",
          "X-Api-Key": this.config.clientId,
        },
      },
    );

    if (!response.ok) {
      // Activities API may not be enabled
      if (response.status === 403 || response.status === 404) {
        return [];
      }
      throw new Error(`Failed to list activities: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map((act: Record<string, unknown>) => ({
      id: typeof act.id === "string" ? act.id : "",
      fieldId,
      fieldName: typeof act.fieldName === "string" ? act.fieldName : "",
      type: typeof act.type === "string" ? act.type : "unknown",
      date: typeof act.date === "string" ? act.date : "",
      productName: typeof act.productName === "string" ? act.productName : undefined,
      rate: typeof act.rate === "number" ? act.rate : undefined,
      rateUnit: typeof act.rateUnit === "string" ? act.rateUnit : undefined,
      operator: typeof act.operator === "string" ? act.operator : undefined,
      notes: typeof act.notes === "string" ? act.notes : undefined,
    }));
  }

  /**
   * List imagery layers for a field
   */
  async listImagery(
    fieldId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<FieldViewImagery[]> {
    const tokens = await this.ensureValidTokens();
    let queryParams = "";
    if (startDate) queryParams += `&startDate=${startDate}`;
    if (endDate) queryParams += `&endDate=${endDate}`;

    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/v4/fields/${fieldId}/imagery?${queryParams}`,
      tokens,
      {
        headers: {
          Accept: "application/json",
          "X-Api-Key": this.config.clientId,
        },
      },
    );

    if (!response.ok) {
      // Imagery API may not be enabled
      if (response.status === 403 || response.status === 404) {
        return [];
      }
      throw new Error(`Failed to list imagery: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map((img: Record<string, unknown>) => ({
      id: typeof img.id === "string" ? img.id : "",
      fieldId,
      type:
        img.type === "SATELLITE"
          ? ("satellite" as const)
          : img.type === "SCOUTING"
            ? ("scouting" as const)
            : ("aerial" as const),
      captureDate: typeof img.captureDate === "string" ? img.captureDate : "",
      layerType: typeof img.layerType === "string" ? img.layerType : undefined,
      cloudCover: typeof img.cloudCover === "number" ? img.cloudCover : undefined,
      url: typeof img.url === "string" ? img.url : undefined,
    }));
  }

  /**
   * Full sync - fetch all data for a farm
   */
  async fullSync(
    farmId: string,
    year?: number,
  ): Promise<{
    farm: FieldViewFarm | null;
    fields: FieldViewField[];
    prescriptions: FieldViewPrescription[];
    activities: FieldViewActivity[];
    syncStatus: FieldViewSyncStatus;
  }> {
    const errors: string[] = [];
    let farm: FieldViewFarm | null = null;
    let fields: FieldViewField[] = [];
    const allPrescriptions: FieldViewPrescription[] = [];
    const allActivities: FieldViewActivity[] = [];

    // Fetch farm details
    try {
      const farms = await this.listFarms();
      farm = farms.find((f) => f.id === farmId) || null;
    } catch (e) {
      errors.push(`Farm: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Fetch fields
    try {
      fields = await this.listFields(farmId);
    } catch (e) {
      errors.push(`Fields: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Fetch prescriptions and activities for each field
    for (const field of fields) {
      try {
        const prescriptions = await this.listPrescriptions(field.id);
        allPrescriptions.push(...prescriptions);
      } catch (e) {
        errors.push(
          `Prescriptions for ${field.name}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      try {
        const activities = await this.listActivities(field.id, year);
        allActivities.push(...activities);
      } catch (e) {
        errors.push(`Activities for ${field.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const syncStatus: FieldViewSyncStatus = {
      lastSync: new Date().toISOString(),
      farms: farm ? 1 : 0,
      fields: fields.length,
      prescriptions: allPrescriptions.length,
      activities: allActivities.length,
      errors,
    };

    return { farm, fields, prescriptions: allPrescriptions, activities: allActivities, syncStatus };
  }

  /**
   * Disconnect and clear tokens
   */
  disconnect(): void {
    this.tokens = null;
    this.pendingState = null;
  }
}

/**
 * Create connector from environment variables
 */
export function createFieldViewConnectorFromEnv(): FieldViewConnector | null {
  const clientId = process.env.FIELDVIEW_CLIENT_ID;
  const clientSecret = process.env.FIELDVIEW_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (clientId.includes("YOUR_") || clientSecret.includes("YOUR_")) {
    return null;
  }

  return new FieldViewConnector({
    clientId,
    clientSecret,
    redirectUri:
      process.env.FIELDVIEW_REDIRECT_URI || "http://localhost:18789/oauth/fieldview/callback",
  });
}
