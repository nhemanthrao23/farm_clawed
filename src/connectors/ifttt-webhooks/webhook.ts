/**
 * IFTTT Webhook Client
 *
 * Sends webhook requests to IFTTT. Supports simulation mode for testing
 * without making actual HTTP calls.
 */

import type { IftttConfig, IftttPayload, WebhookResult, RateLimiterState } from "./types.js";

/**
 * Build full IFTTT webhook URL
 */
export function buildWebhookUrl(config: IftttConfig, eventName: string): string {
  // Ensure event name has prefix
  const fullEventName = eventName.startsWith(config.eventPrefix)
    ? eventName
    : `${config.eventPrefix}${eventName}`;

  return `${config.baseUrl}/${fullEventName}/with/key/${config.webhookKey}`;
}

/**
 * Rate limiter to prevent overwhelming IFTTT
 */
const rateLimiterState: RateLimiterState = {
  lastRequestTime: 0,
  requestCount: 0,
};

async function waitForRateLimit(config: IftttConfig): Promise<void> {
  const now = Date.now();
  const elapsed = now - rateLimiterState.lastRequestTime;

  if (elapsed < config.rateLimitMs) {
    const waitTime = config.rateLimitMs - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  rateLimiterState.lastRequestTime = Date.now();
  rateLimiterState.requestCount++;
}

/**
 * Generate an idempotency key
 */
export function generateIdempotencyKey(eventName: string, payload?: IftttPayload): string {
  const timestamp = Date.now();
  const payloadHash = payload ? JSON.stringify(payload) : "";
  const combined = `${eventName}-${payloadHash}-${timestamp}`;
  // Simple hash - in production, use crypto
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `idem_${Math.abs(hash).toString(36)}_${timestamp.toString(36)}`;
}

/**
 * Executed idempotency keys cache (prevent duplicate executions)
 */
const executedKeys = new Set<string>();
const MAX_CACHED_KEYS = 1000;

function checkIdempotency(key: string): boolean {
  if (executedKeys.has(key)) {
    return false; // Already executed
  }

  // Add key and clean up if too many
  executedKeys.add(key);
  if (executedKeys.size > MAX_CACHED_KEYS) {
    const keysToRemove = Array.from(executedKeys).slice(0, MAX_CACHED_KEYS / 2);
    keysToRemove.forEach((k) => executedKeys.delete(k));
  }

  return true; // OK to execute
}

/**
 * Clear idempotency cache (for testing only)
 */
export function clearIdempotencyCache(): void {
  executedKeys.clear();
}

/**
 * Send IFTTT webhook (with simulation support)
 */
export async function sendWebhook(
  config: IftttConfig,
  eventName: string,
  payload?: IftttPayload,
  idempotencyKey?: string,
): Promise<WebhookResult> {
  const key = idempotencyKey || generateIdempotencyKey(eventName, payload);
  const fullEventName = eventName.startsWith(config.eventPrefix)
    ? eventName
    : `${config.eventPrefix}${eventName}`;
  const timestamp = new Date().toISOString();

  // Check idempotency
  if (!checkIdempotency(key)) {
    return {
      success: false,
      eventName: fullEventName,
      timestamp,
      error: "Duplicate request (idempotency key already used)",
      retryCount: 0,
      simulated: config.simulationMode,
      idempotencyKey: key,
    };
  }

  // Simulation mode - don't make actual HTTP call
  if (config.simulationMode) {
    console.log(`[IFTTT SIM] Would trigger: ${fullEventName}`, payload);
    return {
      success: true,
      eventName: fullEventName,
      timestamp,
      responseStatus: 200,
      retryCount: 0,
      simulated: true,
      idempotencyKey: key,
    };
  }

  // Real execution
  const url = buildWebhookUrl(config, eventName);
  let lastError: string | undefined;
  let retryCount = 0;

  while (retryCount <= config.retries) {
    try {
      // Rate limiting
      await waitForRateLimit(config);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(config.timeout),
      });

      return {
        success: response.ok,
        eventName: fullEventName,
        timestamp,
        responseStatus: response.status,
        retryCount,
        simulated: false,
        idempotencyKey: key,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      retryCount++;

      if (retryCount <= config.retries) {
        // Exponential backoff
        const waitMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  return {
    success: false,
    eventName: fullEventName,
    timestamp,
    error: lastError || "Max retries exceeded",
    retryCount,
    simulated: false,
    idempotencyKey: key,
  };
}

/**
 * Test IFTTT connection (validates config without triggering a real event)
 */
export async function testConnection(config: IftttConfig): Promise<{
  valid: boolean;
  message: string;
}> {
  // Validate webhook key format
  if (!config.webhookKey) {
    return { valid: false, message: "No webhook key configured" };
  }

  if (config.webhookKey.length < 20) {
    return { valid: false, message: "Webhook key appears invalid (too short)" };
  }

  if (config.webhookKey.includes("YOUR_") || config.webhookKey.includes("_HERE")) {
    return { valid: false, message: "Webhook key is a placeholder - please use your real key" };
  }

  // In simulation mode, just validate the config
  if (config.simulationMode) {
    return { valid: true, message: "Configuration valid (simulation mode)" };
  }

  // We can't really test without triggering an event
  // IFTTT doesn't have a ping/health endpoint
  return { valid: true, message: "Configuration appears valid" };
}

/**
 * Format webhook result for logging (redacting sensitive info)
 */
export function formatWebhookResult(result: WebhookResult): string {
  const mode = result.simulated ? "[SIM]" : "[LIVE]";
  const status = result.success ? "OK" : "FAILED";
  const statusCode = result.responseStatus ? ` (${result.responseStatus})` : "";
  const error = result.error ? ` - ${result.error}` : "";
  const retries = result.retryCount > 0 ? ` [${result.retryCount} retries]` : "";

  return `${mode} ${result.eventName}: ${status}${statusCode}${error}${retries}`;
}
