/**
 * IFTTT Webhook Client
 *
 * Sends webhook requests to IFTTT to trigger SmartLife scenes.
 */

import { z } from "zod";

// IFTTT configuration
export const IftttConfigSchema = z.object({
  webhookKey: z.string(),
  baseUrl: z.string().default("https://maker.ifttt.com/trigger"),
  timeout: z.number().default(10000),
  retries: z.number().default(3),
});

export type IftttConfig = z.infer<typeof IftttConfigSchema>;

// Webhook result
export interface WebhookResult {
  success: boolean;
  eventName: string;
  timestamp: string;
  responseStatus?: number;
  error?: string;
  retryCount?: number;
}

/**
 * Build IFTTT webhook URL
 */
export function buildWebhookUrl(config: IftttConfig, eventName: string): string {
  return `${config.baseUrl}/${eventName}/with/key/${config.webhookKey}`;
}

/**
 * Send IFTTT webhook
 */
export async function sendWebhook(
  config: IftttConfig,
  eventName: string,
  values?: { value1?: string; value2?: string; value3?: string },
): Promise<WebhookResult> {
  const url = buildWebhookUrl(config, eventName);
  const timestamp = new Date().toISOString();

  let lastError: string | undefined;
  let retryCount = 0;

  while (retryCount <= config.retries) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: values ? JSON.stringify(values) : undefined,
        signal: AbortSignal.timeout(config.timeout),
      });

      return {
        success: response.ok,
        eventName,
        timestamp,
        responseStatus: response.status,
        retryCount,
      };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      retryCount++;

      if (retryCount <= config.retries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }

  return {
    success: false,
    eventName,
    timestamp,
    error: lastError || "Max retries exceeded",
    retryCount,
  };
}

/**
 * Test IFTTT connection
 */
export async function testIftttConnection(config: IftttConfig): Promise<{ connected: boolean; message: string }> {
  // IFTTT doesn't have a ping endpoint, so we just validate the config
  if (!config.webhookKey) {
    return { connected: false, message: "No webhook key configured" };
  }

  if (config.webhookKey.length < 20) {
    return { connected: false, message: "Webhook key appears invalid (too short)" };
  }

  // Optionally send a test event
  // This would trigger a real IFTTT event, so we skip it by default

  return { connected: true, message: "Configuration appears valid" };
}

/**
 * Format webhook result for logging
 */
export function formatWebhookResult(result: WebhookResult): string {
  if (result.success) {
    return `[${result.timestamp}] Webhook ${result.eventName} succeeded (status: ${result.responseStatus})`;
  }
  return `[${result.timestamp}] Webhook ${result.eventName} failed: ${result.error} (retries: ${result.retryCount})`;
}

