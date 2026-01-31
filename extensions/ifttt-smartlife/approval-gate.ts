/**
 * Approval Gate - Human-in-Loop for IFTTT Actions
 *
 * Ensures actuator actions go through the approval system at appropriate automation levels.
 */

import type { SceneConfig } from "./scenes.js";
import type { IftttConfig, WebhookResult } from "./webhook.js";
import { sendWebhook } from "./webhook.js";

// Approval requirement check result
export interface ApprovalCheckResult {
  requiresApproval: boolean;
  reason: string;
  automationLevel: number;
  sceneSafetyLevel: string;
}

// Gated execution result
export interface GatedExecutionResult {
  executed: boolean;
  approvalRequired: boolean;
  approvalId?: string;
  webhookResult?: WebhookResult;
  message: string;
}

// Approval callback type
export type ApprovalCallback = (params: {
  scene: SceneConfig;
  reason: string;
}) => Promise<{ approved: boolean; approvalId: string }>;

/**
 * Check if a scene requires approval
 */
export function checkApprovalRequirement(
  scene: SceneConfig,
  automationLevel: number,
): ApprovalCheckResult {
  // Level 0-1: Everything requires approval (or rather, no automation)
  if (automationLevel <= 1) {
    return {
      requiresApproval: true,
      reason: "Automation level 0-1 does not allow actuator control",
      automationLevel,
      sceneSafetyLevel: scene.safetyLevel,
    };
  }

  // Level 2: Always requires approval
  if (automationLevel === 2) {
    return {
      requiresApproval: true,
      reason: "Automation level 2 requires approval for all actions",
      automationLevel,
      sceneSafetyLevel: scene.safetyLevel,
    };
  }

  // Level 3-4: Check scene safety level
  if (scene.safetyLevel === "requires_approval") {
    return {
      requiresApproval: true,
      reason: "Scene marked as requiring approval regardless of automation level",
      automationLevel,
      sceneSafetyLevel: scene.safetyLevel,
    };
  }

  if (automationLevel === 3 && scene.safetyLevel === "moderate") {
    return {
      requiresApproval: true,
      reason: "Automation level 3 requires approval for moderate-risk actions",
      automationLevel,
      sceneSafetyLevel: scene.safetyLevel,
    };
  }

  // Level 4 with safe/moderate scenes, or Level 3 with safe scenes
  return {
    requiresApproval: false,
    reason: "Action can be executed automatically",
    automationLevel,
    sceneSafetyLevel: scene.safetyLevel,
  };
}

/**
 * Execute scene with approval gate
 */
export async function executeWithApprovalGate(params: {
  config: IftttConfig;
  scene: SceneConfig;
  automationLevel: number;
  values?: { value1?: string; value2?: string; value3?: string };
  approvalCallback?: ApprovalCallback;
}): Promise<GatedExecutionResult> {
  const { config, scene, automationLevel, values, approvalCallback } = params;

  // Check if approval is required
  const approvalCheck = checkApprovalRequirement(scene, automationLevel);

  if (approvalCheck.requiresApproval) {
    // If no approval callback, return that approval is needed
    if (!approvalCallback) {
      return {
        executed: false,
        approvalRequired: true,
        message: `Approval required: ${approvalCheck.reason}`,
      };
    }

    // Request approval
    const approval = await approvalCallback({
      scene,
      reason: approvalCheck.reason,
    });

    if (!approval.approved) {
      return {
        executed: false,
        approvalRequired: true,
        approvalId: approval.approvalId,
        message: "Action was not approved",
      };
    }

    // Approved - execute
    const webhookResult = await sendWebhook(config, scene.iftttEvent, values);

    return {
      executed: webhookResult.success,
      approvalRequired: true,
      approvalId: approval.approvalId,
      webhookResult,
      message: webhookResult.success
        ? `Action approved and executed: ${scene.name}`
        : `Action approved but failed: ${webhookResult.error}`,
    };
  }

  // No approval required - execute directly
  const webhookResult = await sendWebhook(config, scene.iftttEvent, values);

  return {
    executed: webhookResult.success,
    approvalRequired: false,
    webhookResult,
    message: webhookResult.success
      ? `Action executed automatically: ${scene.name}`
      : `Action failed: ${webhookResult.error}`,
  };
}

/**
 * Execute emergency stop (bypasses approval)
 */
export async function executeEmergencyStop(
  config: IftttConfig,
  scene: SceneConfig,
): Promise<WebhookResult> {
  // Emergency stops always execute immediately
  return sendWebhook(config, scene.iftttEvent);
}

/**
 * Batch execute scenes (for complex operations)
 */
export async function batchExecute(params: {
  config: IftttConfig;
  scenes: SceneConfig[];
  automationLevel: number;
  approvalCallback?: ApprovalCallback;
  delayBetweenMs?: number;
}): Promise<GatedExecutionResult[]> {
  const { config, scenes, automationLevel, approvalCallback, delayBetweenMs = 1000 } = params;
  const results: GatedExecutionResult[] = [];

  for (const scene of scenes) {
    const result = await executeWithApprovalGate({
      config,
      scene,
      automationLevel,
      approvalCallback,
    });

    results.push(result);

    // If any approval was denied, stop batch
    if (result.approvalRequired && !result.executed) {
      break;
    }

    // Delay between actions
    if (delayBetweenMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  return results;
}

/**
 * Format gated execution result for display
 */
export function formatGatedResult(result: GatedExecutionResult): string {
  const lines: string[] = [];

  if (result.executed) {
    lines.push(`✓ ${result.message}`);
  } else {
    lines.push(`✗ ${result.message}`);
  }

  if (result.approvalRequired) {
    lines.push(`  Approval required: Yes`);
    if (result.approvalId) {
      lines.push(`  Approval ID: ${result.approvalId}`);
    }
  }

  if (result.webhookResult) {
    lines.push(`  Webhook status: ${result.webhookResult.success ? "Success" : "Failed"}`);
    if (result.webhookResult.retryCount) {
      lines.push(`  Retries: ${result.webhookResult.retryCount}`);
    }
  }

  return lines.join("\n");
}

