/**
 * OAuth2 Base Module for FMIS Connectors
 *
 * Shared OAuth2 utilities for John Deere and Climate FieldView integrations.
 * Tokens are stored locally (SQLite) - NEVER in the codebase.
 */

import { z } from "zod";

/**
 * OAuth2 configuration schema
 */
export const OAuth2ConfigSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  authorizationEndpoint: z.string().url(),
  tokenEndpoint: z.string().url(),
  scopes: z.array(z.string()),
});

export type OAuth2Config = z.infer<typeof OAuth2ConfigSchema>;

/**
 * OAuth2 tokens schema
 */
export const OAuth2TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  tokenType: z.string().default("Bearer"),
  expiresAt: z.number().describe("Unix timestamp in ms"),
  scope: z.string().optional(),
});

export type OAuth2Tokens = z.infer<typeof OAuth2TokensSchema>;

/**
 * Generate OAuth2 authorization URL
 */
export function buildAuthorizationUrl(
  config: OAuth2Config,
  state: string,
  additionalParams?: Record<string, string>,
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
    ...additionalParams,
  });

  return `${config.authorizationEndpoint}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  config: OAuth2Config,
  code: string,
): Promise<OAuth2Tokens> {
  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return parseTokenResponse(data);
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(
  config: OAuth2Config,
  refreshToken: string,
): Promise<OAuth2Tokens> {
  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return parseTokenResponse(data);
}

/**
 * Parse token response from OAuth server
 */
function parseTokenResponse(data: Record<string, unknown>): OAuth2Tokens {
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  const expiresAt = Date.now() + expiresIn * 1000;

  return {
    accessToken: typeof data.access_token === "string" ? data.access_token : "",
    refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    tokenType: typeof data.token_type === "string" ? data.token_type : "Bearer",
    expiresAt,
    scope: typeof data.scope === "string" ? data.scope : undefined,
  };
}

/**
 * Check if tokens are expired (with 5 minute buffer)
 */
export function isTokenExpired(tokens: OAuth2Tokens): boolean {
  const bufferMs = 5 * 60 * 1000;
  return Date.now() >= tokens.expiresAt - bufferMs;
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch(
  url: string,
  tokens: OAuth2Tokens,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `${tokens.tokenType} ${tokens.accessToken}`);

  return fetch(url, {
    ...options,
    headers,
  });
}
