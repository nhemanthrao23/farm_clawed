/**
 * IFTTT Webhooks Connector Types
 *
 * Generic types for the IFTTT Webhooks integration.
 * Works with any IFTTT "Then That" action - SmartLife, relays, email, SMS, etc.
 */

import { z } from "zod";

/**
 * Standard IFTTT webhook payload
 * IFTTT supports value1, value2, value3 - that's the limit
 */
export const IftttPayloadSchema = z.object({
  value1: z.string().optional().describe("Primary data (e.g., zone name)"),
  value2: z.string().optional().describe("Secondary data (e.g., duration)"),
  value3: z.string().optional().describe("JSON metadata or additional info"),
});

export type IftttPayload = z.infer<typeof IftttPayloadSchema>;

/**
 * IFTTT connector configuration
 */
export const IftttConfigSchema = z.object({
  /** IFTTT Webhooks key (from maker_webhooks documentation page) */
  webhookKey: z.string().min(20).describe("IFTTT Maker Webhooks key"),

  /** Base URL for IFTTT webhooks (default: maker.ifttt.com) */
  baseUrl: z.string().url().default("https://maker.ifttt.com/trigger"),

  /** Event name prefix (e.g., "farm_clawed_") */
  eventPrefix: z.string().default("farm_clawed_"),

  /** Request timeout in milliseconds */
  timeout: z.number().positive().default(10000),

  /** Number of retries on failure */
  retries: z.number().int().min(0).max(5).default(3),

  /** Enable simulation mode (no actual HTTP calls) */
  simulationMode: z.boolean().default(false),

  /** Rate limit: minimum ms between requests */
  rateLimitMs: z.number().int().min(0).default(1000),
});

export type IftttConfig = z.infer<typeof IftttConfigSchema>;

/**
 * Proposed action - created when automation wants to trigger something
 */
export const ProposedActionSchema = z.object({
  /** Unique ID for this proposal */
  id: z.string().uuid(),

  /** IFTTT event name (without prefix) */
  event: z.string(),

  /** Full event name (with prefix) */
  fullEventName: z.string(),

  /** Payload to send */
  payload: IftttPayloadSchema.optional(),

  /** Metadata about why this action is proposed */
  metadata: z.object({
    reason: z.string(),
    source: z.string().describe("What triggered this - automation ID, AI, manual"),
    target: z.string().optional().describe("Target device/zone/area"),
    confidence: z.number().min(0).max(100).optional(),
    estimatedImpact: z.string().optional(),
  }),

  /** When the action was proposed */
  proposedAt: z.string().datetime(),

  /** When the proposal expires */
  expiresAt: z.string().datetime(),

  /** Current status */
  status: z.enum(["pending", "approved", "rejected", "expired", "executed", "failed"]),

  /** Approval info (if approved/rejected) */
  approval: z
    .object({
      decidedAt: z.string().datetime(),
      decidedBy: z.enum(["user", "auto", "timeout"]),
      approvalId: z.string().optional(),
    })
    .optional(),

  /** Execution result (if executed) */
  execution: z
    .object({
      executedAt: z.string().datetime(),
      success: z.boolean(),
      responseStatus: z.number().optional(),
      error: z.string().optional(),
      simulated: z.boolean(),
    })
    .optional(),

  /** Idempotency key to prevent duplicate executions */
  idempotencyKey: z.string(),
});

export type ProposedAction = z.infer<typeof ProposedActionSchema>;

/**
 * Webhook execution result
 */
export const WebhookResultSchema = z.object({
  success: z.boolean(),
  eventName: z.string(),
  timestamp: z.string().datetime(),
  responseStatus: z.number().optional(),
  error: z.string().optional(),
  retryCount: z.number().int().default(0),
  simulated: z.boolean().default(false),
  idempotencyKey: z.string(),
});

export type WebhookResult = z.infer<typeof WebhookResultSchema>;

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  lastRequestTime: number;
  requestCount: number;
}

/**
 * Action filter for querying proposed actions
 */
export interface ActionFilter {
  status?: ProposedAction["status"] | ProposedAction["status"][];
  source?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}
