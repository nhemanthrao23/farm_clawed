/**
 * John Deere Operations Center Connector
 *
 * OAuth2 skeleton for integrating with John Deere's Field Operations APIs.
 * See: https://developer.deere.com
 *
 * SETUP REQUIRED:
 * 1. Register an application at developer.deere.com
 * 2. Configure OAuth2 credentials in your .env file
 * 3. Set up redirect URI for your farm_clawed instance
 *
 * This is a skeleton implementation - actual API calls depend on your
 * Deere developer account permissions and enabled APIs.
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
 * Deere-specific configuration
 */
export const DeereConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  // Deere API base URL (production or sandbox)
  apiBaseUrl: z.string().url().default("https://sandboxapi.deere.com"),
  // Deere OAuth endpoints
  authorizationEndpoint: z
    .string()
    .url()
    .default("https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize"),
  tokenEndpoint: z
    .string()
    .url()
    .default("https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token"),
});

export type DeereConfig = z.infer<typeof DeereConfigSchema>;

/**
 * Deere organization (farm/operation)
 */
export interface DeereOrganization {
  id: string;
  name: string;
  type: string;
  links: Array<{ rel: string; uri: string }>;
}

/**
 * Deere field
 */
export interface DeereField {
  id: string;
  name: string;
  area: {
    value: number;
    unit: string;
  };
  organizationId: string;
  boundaries?: GeoJSON.Geometry;
  cropType?: string;
  lastOperationDate?: string;
}

/**
 * Deere equipment/machine
 */
export interface DeereEquipment {
  id: string;
  name: string;
  type: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  status: "active" | "inactive" | "maintenance";
  lastSeen?: string;
  organizationId: string;
}

/**
 * Deere field operation
 */
export interface DeereOperation {
  id: string;
  type: string; // planting, harvesting, spraying, tillage, etc.
  fieldId: string;
  fieldName: string;
  startTime: string;
  endTime?: string;
  status: "planned" | "in_progress" | "completed";
  equipment?: string;
  operator?: string;
  notes?: string;
}

/**
 * Deere work plan
 */
export interface DeereWorkPlan {
  id: string;
  name: string;
  organizationId: string;
  status: "draft" | "scheduled" | "in_progress" | "completed";
  operations: DeereOperation[];
  startDate: string;
  endDate?: string;
}

/**
 * Sync status for tracking data freshness
 */
export interface DeereSyncStatus {
  lastSync: string;
  organizations: number;
  fields: number;
  equipment: number;
  operations: number;
  errors: string[];
}

/**
 * John Deere Operations Center Connector
 */
export class DeereConnector {
  private config: DeereConfig;
  private tokens: OAuth2Tokens | null = null;
  private pendingState: string | null = null;

  constructor(config: Partial<DeereConfig> & { clientId: string; clientSecret: string }) {
    this.config = DeereConfigSchema.parse({
      redirectUri: "http://localhost:18789/oauth/deere/callback",
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
      scopes: ["openid", "profile", "offline_access", "ag1", "ag2", "ag3"],
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
   * List organizations the user has access to
   */
  async listOrganizations(): Promise<DeereOrganization[]> {
    const tokens = await this.ensureValidTokens();
    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/platform/organizations`,
      tokens,
      {
        headers: {
          Accept: "application/vnd.deere.axiom.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to list organizations: ${response.status}`);
    }

    const data = await response.json();
    return (data.values || []).map((org: Record<string, unknown>) => ({
      id: typeof org["@id"] === "string" ? org["@id"] : typeof org.id === "string" ? org.id : "",
      name: typeof org.name === "string" ? org.name : "",
      type:
        typeof org["@type"] === "string"
          ? org["@type"]
          : typeof org.type === "string"
            ? org.type
            : "Organization",
      links: Array.isArray(org.links) ? org.links : [],
    }));
  }

  /**
   * List fields for an organization
   */
  async listFields(organizationId: string): Promise<DeereField[]> {
    const tokens = await this.ensureValidTokens();
    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/platform/organizations/${organizationId}/fields`,
      tokens,
      {
        headers: {
          Accept: "application/vnd.deere.axiom.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to list fields: ${response.status}`);
    }

    const data = await response.json();
    return (data.values || []).map((field: Record<string, unknown>) => ({
      id: String(field["@id"] || field.id),
      name: String(field.name),
      area: field.area || { value: 0, unit: "ac" },
      organizationId,
      boundaries: field.boundaries,
      cropType: typeof field.cropType === "string" ? field.cropType : undefined,
      lastOperationDate:
        typeof field.lastOperationDate === "string" ? field.lastOperationDate : undefined,
    }));
  }

  /**
   * List equipment for an organization
   */
  async listEquipment(organizationId: string): Promise<DeereEquipment[]> {
    const tokens = await this.ensureValidTokens();
    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/platform/organizations/${organizationId}/machines`,
      tokens,
      {
        headers: {
          Accept: "application/vnd.deere.axiom.v3+json",
        },
      },
    );

    if (!response.ok) {
      // Equipment API may not be enabled - return empty array instead of throwing
      if (response.status === 403 || response.status === 404) {
        return [];
      }
      throw new Error(`Failed to list equipment: ${response.status}`);
    }

    const data = await response.json();
    return (data.values || []).map((machine: Record<string, unknown>) => ({
      id: String(machine["@id"] || machine.id),
      name: String(machine.name || machine.displayName || "Unknown"),
      type: String(machine.machineType || machine.type || "Equipment"),
      make: typeof machine.make === "string" ? machine.make : undefined,
      model: typeof machine.model === "string" ? machine.model : undefined,
      serialNumber: typeof machine.serialNumber === "string" ? machine.serialNumber : undefined,
      status: machine.status === "INACTIVE" ? ("inactive" as const) : ("active" as const),
      lastSeen:
        typeof machine.lastCommunicationTime === "string"
          ? machine.lastCommunicationTime
          : undefined,
      organizationId,
    }));
  }

  /**
   * List operations for a field
   */
  async listOperations(organizationId: string, fieldId: string): Promise<DeereOperation[]> {
    const tokens = await this.ensureValidTokens();
    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/platform/organizations/${organizationId}/fields/${fieldId}/fieldOperations`,
      tokens,
      {
        headers: {
          Accept: "application/vnd.deere.axiom.v3+json",
        },
      },
    );

    if (!response.ok) {
      // Operations API may not be enabled - return empty array instead of throwing
      if (response.status === 403 || response.status === 404) {
        return [];
      }
      throw new Error(`Failed to list operations: ${response.status}`);
    }

    const data = await response.json();
    return (data.values || []).map((op: Record<string, unknown>) => ({
      id: String(op["@id"] || op.id),
      type: String(op.operationType || op.type || "unknown"),
      fieldId,
      fieldName: String(op.fieldName || ""),
      startTime: String(op.startTime || op.startDate || ""),
      endTime:
        typeof op.endTime === "string"
          ? op.endTime
          : typeof op.endDate === "string"
            ? op.endDate
            : undefined,
      status:
        op.status === "COMPLETED"
          ? ("completed" as const)
          : op.status === "IN_PROGRESS"
            ? ("in_progress" as const)
            : ("planned" as const),
      equipment: typeof op.machineName === "string" ? op.machineName : undefined,
      operator: typeof op.operatorName === "string" ? op.operatorName : undefined,
      notes: typeof op.notes === "string" ? op.notes : undefined,
    }));
  }

  /**
   * List work plans for an organization
   */
  async listWorkPlans(organizationId: string): Promise<DeereWorkPlan[]> {
    const tokens = await this.ensureValidTokens();
    const response = await authenticatedFetch(
      `${this.config.apiBaseUrl}/platform/organizations/${organizationId}/workPlans`,
      tokens,
      {
        headers: {
          Accept: "application/vnd.deere.axiom.v3+json",
        },
      },
    );

    if (!response.ok) {
      // Work plans API may not be enabled - return empty array instead of throwing
      if (response.status === 403 || response.status === 404) {
        return [];
      }
      throw new Error(`Failed to list work plans: ${response.status}`);
    }

    const data = await response.json();
    return (data.values || []).map((plan: Record<string, unknown>) => ({
      id: String(plan["@id"] || plan.id),
      name: String(plan.name || "Unnamed Plan"),
      organizationId,
      status:
        plan.status === "COMPLETED"
          ? ("completed" as const)
          : plan.status === "IN_PROGRESS"
            ? ("in_progress" as const)
            : plan.status === "SCHEDULED"
              ? ("scheduled" as const)
              : ("draft" as const),
      operations: [], // Would need nested API call to populate
      startDate: String(plan.startDate || ""),
      endDate: typeof plan.endDate === "string" ? plan.endDate : undefined,
    }));
  }

  /**
   * Full sync - fetch all data for an organization
   */
  async fullSync(organizationId: string): Promise<{
    fields: DeereField[];
    equipment: DeereEquipment[];
    workPlans: DeereWorkPlan[];
    syncStatus: DeereSyncStatus;
  }> {
    const errors: string[] = [];
    let fields: DeereField[] = [];
    let equipment: DeereEquipment[] = [];
    let workPlans: DeereWorkPlan[] = [];

    // Fetch fields
    try {
      fields = await this.listFields(organizationId);
    } catch (e) {
      errors.push(`Fields: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Fetch equipment
    try {
      equipment = await this.listEquipment(organizationId);
    } catch (e) {
      errors.push(`Equipment: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Fetch work plans
    try {
      workPlans = await this.listWorkPlans(organizationId);
    } catch (e) {
      errors.push(`Work Plans: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Count total operations across all work plans
    const operationsCount = workPlans.reduce((sum, wp) => sum + wp.operations.length, 0);

    const syncStatus: DeereSyncStatus = {
      lastSync: new Date().toISOString(),
      organizations: 1,
      fields: fields.length,
      equipment: equipment.length,
      operations: operationsCount,
      errors,
    };

    return { fields, equipment, workPlans, syncStatus };
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
export function createDeereConnectorFromEnv(): DeereConnector | null {
  const clientId = process.env.DEERE_CLIENT_ID;
  const clientSecret = process.env.DEERE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (clientId.includes("YOUR_") || clientSecret.includes("YOUR_")) {
    return null;
  }

  return new DeereConnector({
    clientId,
    clientSecret,
    redirectUri: process.env.DEERE_REDIRECT_URI || "http://localhost:18789/oauth/deere/callback",
  });
}
