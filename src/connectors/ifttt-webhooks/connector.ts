/**
 * IFTTT Webhooks Connector
 *
 * High-level API for proposing, approving, and executing IFTTT webhook actions.
 * Integrates with the farm_clawed approval and audit systems.
 */

import { randomUUID } from "crypto";
import type {
  IftttConfig,
  IftttPayload,
  ProposedAction,
  WebhookResult,
  ActionFilter,
} from "./types.js";
import { IftttConfigSchema } from "./types.js";
import {
  sendWebhook,
  generateIdempotencyKey,
  testConnection,
  formatWebhookResult,
} from "./webhook.js";

/**
 * Default proposal expiration (45 minutes)
 */
const DEFAULT_EXPIRATION_MS = 45 * 60 * 1000;

/**
 * IFTTT Webhooks Connector
 */
export class IftttConnector {
  private config: IftttConfig;
  private listeners: Map<string, Set<(action: ProposedAction) => void>> = new Map();
  /** Per-instance store for proposed actions (in production, would be persisted to SQLite) */
  private proposedActions = new Map<string, ProposedAction>();

  constructor(config: Partial<IftttConfig> & { webhookKey: string }) {
    this.config = IftttConfigSchema.parse(config);
  }

  /**
   * Get current configuration (without exposing the key)
   */
  getConfigSummary(): Omit<IftttConfig, "webhookKey"> & { hasKey: boolean } {
    const { webhookKey, ...rest } = this.config;
    return {
      ...rest,
      hasKey: !!webhookKey && webhookKey.length > 0,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<IftttConfig>): void {
    this.config = IftttConfigSchema.parse({ ...this.config, ...updates });
  }

  /**
   * Test the IFTTT connection
   */
  async testConnection(): Promise<{ valid: boolean; message: string }> {
    return testConnection(this.config);
  }

  /**
   * Propose an action (creates approval entry, does NOT execute)
   */
  proposeAction(params: {
    event: string;
    payload?: IftttPayload;
    metadata: {
      reason: string;
      source: string;
      target?: string;
      confidence?: number;
      estimatedImpact?: string;
    };
    expiresInMs?: number;
  }): ProposedAction {
    const id = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (params.expiresInMs || DEFAULT_EXPIRATION_MS));
    const fullEventName = params.event.startsWith(this.config.eventPrefix)
      ? params.event
      : `${this.config.eventPrefix}${params.event}`;

    const action: ProposedAction = {
      id,
      event: params.event,
      fullEventName,
      payload: params.payload,
      metadata: params.metadata,
      proposedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "pending",
      idempotencyKey: generateIdempotencyKey(fullEventName, params.payload),
    };

    this.proposedActions.set(id, action);
    this.emit("proposed", action);

    return action;
  }

  /**
   * Approve an action (marks it approved but does NOT execute yet)
   */
  approveAction(actionId: string, approvalId?: string): ProposedAction | null {
    const action = this.proposedActions.get(actionId);
    if (!action) {
      return null;
    }

    if (action.status !== "pending") {
      throw new Error(`Cannot approve action in status: ${action.status}`);
    }

    // Check expiration
    if (new Date(action.expiresAt) < new Date()) {
      action.status = "expired";
      this.proposedActions.set(actionId, action);
      return action;
    }

    action.status = "approved";
    action.approval = {
      decidedAt: new Date().toISOString(),
      decidedBy: "user",
      approvalId,
    };

    this.proposedActions.set(actionId, action);
    this.emit("approved", action);

    return action;
  }

  /**
   * Reject an action
   */
  rejectAction(actionId: string, reason?: string): ProposedAction | null {
    const action = this.proposedActions.get(actionId);
    if (!action) {
      return null;
    }

    if (action.status !== "pending") {
      throw new Error(`Cannot reject action in status: ${action.status}`);
    }

    action.status = "rejected";
    action.approval = {
      decidedAt: new Date().toISOString(),
      decidedBy: "user",
    };
    if (reason) {
      action.metadata.reason = `${action.metadata.reason} [Rejected: ${reason}]`;
    }

    this.proposedActions.set(actionId, action);
    this.emit("rejected", action);

    return action;
  }

  /**
   * Execute an approved action (fires the webhook)
   */
  async executeAction(actionId: string): Promise<WebhookResult> {
    const action = this.proposedActions.get(actionId);
    if (!action) {
      throw new Error(`Action not found: ${actionId}`);
    }

    if (action.status !== "approved") {
      throw new Error(`Cannot execute action in status: ${action.status}. Must be approved first.`);
    }

    // Execute the webhook
    const result = await sendWebhook(
      this.config,
      action.fullEventName,
      action.payload,
      action.idempotencyKey,
    );

    // Update action status
    action.status = result.success ? "executed" : "failed";
    action.execution = {
      executedAt: result.timestamp,
      success: result.success,
      responseStatus: result.responseStatus,
      error: result.error,
      simulated: result.simulated,
    };

    this.proposedActions.set(actionId, action);
    this.emit(result.success ? "executed" : "failed", action);

    return result;
  }

  /**
   * Simulate an action (for testing automations without side effects)
   * This creates a proposal, auto-approves it, and executes in simulation mode
   */
  async simulateAction(params: {
    event: string;
    payload?: IftttPayload;
    metadata: {
      reason: string;
      source: string;
      target?: string;
    };
  }): Promise<{ action: ProposedAction; result: WebhookResult }> {
    // Create a temporary config with simulation mode
    const simConfig = { ...this.config, simulationMode: true };

    // Create the action
    const action = this.proposeAction({
      ...params,
      metadata: { ...params.metadata, confidence: 100 },
    });

    // Auto-approve for simulation
    action.status = "approved";
    action.approval = {
      decidedAt: new Date().toISOString(),
      decidedBy: "auto",
      approvalId: "simulation",
    };
    this.proposedActions.set(action.id, action);

    // Execute with simulation config
    const result = await sendWebhook(
      simConfig,
      action.fullEventName,
      action.payload,
      action.idempotencyKey,
    );

    // Update action
    action.status = result.success ? "executed" : "failed";
    action.execution = {
      executedAt: result.timestamp,
      success: result.success,
      responseStatus: result.responseStatus,
      error: result.error,
      simulated: true,
    };
    this.proposedActions.set(action.id, action);

    return { action, result };
  }

  /**
   * Get a proposed action by ID
   */
  getAction(actionId: string): ProposedAction | undefined {
    return this.proposedActions.get(actionId);
  }

  /**
   * List proposed actions with optional filtering
   */
  listActions(filter?: ActionFilter): ProposedAction[] {
    let actions = Array.from(this.proposedActions.values());

    if (filter?.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      actions = actions.filter((a) => statuses.includes(a.status));
    }

    if (filter?.source) {
      actions = actions.filter((a) => a.metadata.source === filter.source);
    }

    if (filter?.since) {
      actions = actions.filter((a) => new Date(a.proposedAt) >= filter.since!);
    }

    if (filter?.until) {
      actions = actions.filter((a) => new Date(a.proposedAt) <= filter.until!);
    }

    // Sort by proposed time (newest first)
    actions.sort((a, b) => new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime());

    if (filter?.limit) {
      actions = actions.slice(0, filter.limit);
    }

    return actions;
  }

  /**
   * Get pending actions that need approval
   */
  getPendingActions(): ProposedAction[] {
    return this.listActions({ status: "pending" });
  }

  /**
   * Expire old pending actions
   */
  expirePendingActions(): ProposedAction[] {
    const now = new Date();
    const expired: ProposedAction[] = [];

    for (const [id, action] of this.proposedActions) {
      if (action.status === "pending" && new Date(action.expiresAt) < now) {
        action.status = "expired";
        action.approval = {
          decidedAt: now.toISOString(),
          decidedBy: "timeout",
        };
        this.proposedActions.set(id, action);
        expired.push(action);
        this.emit("expired", action);
      }
    }

    return expired;
  }

  /**
   * Clear old actions (cleanup)
   */
  clearOldActions(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    let cleared = 0;

    for (const [id, action] of this.proposedActions) {
      if (new Date(action.proposedAt).getTime() < cutoff) {
        this.proposedActions.delete(id);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Subscribe to action events
   */
  on(
    event: "proposed" | "approved" | "rejected" | "executed" | "failed" | "expired",
    callback: (action: ProposedAction) => void,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(
    event: "proposed" | "approved" | "rejected" | "executed" | "failed" | "expired",
    action: ProposedAction,
  ): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        cb(action);
      } catch (err) {
        console.error(`Error in IFTTT listener for ${event}:`, err);
      }
    });
  }

  /**
   * Format a webhook result for display/logging
   */
  formatResult(result: WebhookResult): string {
    return formatWebhookResult(result);
  }
}

/**
 * Create an IFTTT connector from environment variables
 */
export function createIftttConnectorFromEnv(): IftttConnector | null {
  const webhookKey = process.env.IFTTT_WEBHOOK_KEY;
  if (!webhookKey || webhookKey.includes("YOUR_") || webhookKey.includes("_HERE")) {
    return null;
  }

  return new IftttConnector({
    webhookKey,
    eventPrefix: process.env.IFTTT_EVENT_PREFIX || "farm_clawed_",
    simulationMode: process.env.IFTTT_SIMULATION_MODE === "true",
  });
}

/**
 * Singleton instance (lazy initialized)
 */
let defaultConnector: IftttConnector | null = null;

export function getDefaultConnector(): IftttConnector | null {
  if (!defaultConnector) {
    defaultConnector = createIftttConnectorFromEnv();
  }
  return defaultConnector;
}
