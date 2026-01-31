/**
 * Approval Policy - Human-in-Loop Gates
 *
 * Manages approval requests for actuator actions at lower automation levels.
 */

import { z } from "zod";
import type { GuardrailCheck } from "./guardrails.js";

// Action types that can require approval
export const ActionTypeSchema = z.union([
  z.literal("water"),
  z.literal("fertilize"),
  z.literal("adjust_valve"),
  z.literal("turn_on"),
  z.literal("turn_off"),
  z.literal("schedule_change"),
  z.literal("config_change"),
  z.literal("safety_override"),
]);

export type ActionType = z.infer<typeof ActionTypeSchema>;

// Approval request status
export const ApprovalStatusSchema = z.union([
  z.literal("pending"),
  z.literal("approved"),
  z.literal("rejected"),
  z.literal("expired"),
  z.literal("cancelled"),
]);

export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

// Approval request
export const ApprovalRequestSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  status: ApprovalStatusSchema,
  actionType: ActionTypeSchema,
  targetId: z.string().optional().describe("Device or zone ID"),
  targetName: z.string().optional(),
  proposedAction: z.string(),
  reason: z.string(),
  aiConfidence: z.number().min(0).max(1).optional(),
  guardrailChecks: z.array(z.any()).optional(),
  sourcesUsed: z.array(z.string()).optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectedBy: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  executedAt: z.string().optional(),
  executionResult: z.string().optional(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

// Approval policy by automation level
export interface ApprovalPolicy {
  requiresApproval: boolean;
  expirationMinutes: number;
  autoApproveIfAllGuardrailsPass: boolean;
  notifyOnExpiration: boolean;
}

export const APPROVAL_POLICIES: Record<number, ApprovalPolicy> = {
  // Level 0: Observe only - no actions allowed
  0: {
    requiresApproval: true,
    expirationMinutes: 0, // Immediately expired (actions not allowed)
    autoApproveIfAllGuardrailsPass: false,
    notifyOnExpiration: false,
  },
  // Level 1: Assist - no actions allowed
  1: {
    requiresApproval: true,
    expirationMinutes: 0,
    autoApproveIfAllGuardrailsPass: false,
    notifyOnExpiration: false,
  },
  // Level 2: Propose + Approvals
  2: {
    requiresApproval: true,
    expirationMinutes: 60, // 1 hour to approve
    autoApproveIfAllGuardrailsPass: false,
    notifyOnExpiration: true,
  },
  // Level 3: Auto within guardrails
  3: {
    requiresApproval: false, // Auto-approve if guardrails pass
    expirationMinutes: 30,
    autoApproveIfAllGuardrailsPass: true,
    notifyOnExpiration: true,
  },
  // Level 4: Full Ops
  4: {
    requiresApproval: false,
    expirationMinutes: 15,
    autoApproveIfAllGuardrailsPass: true,
    notifyOnExpiration: true,
  },
};

/**
 * Get approval policy for an automation level
 */
export function getApprovalPolicy(automationLevel: number): ApprovalPolicy {
  const level = Math.min(4, Math.max(0, automationLevel));
  return APPROVAL_POLICIES[level] || APPROVAL_POLICIES[0];
}

/**
 * Check if an action requires approval
 */
export function requiresApproval(automationLevel: number, guardrailsPassed: boolean): boolean {
  const policy = getApprovalPolicy(automationLevel);

  if (!policy.requiresApproval && policy.autoApproveIfAllGuardrailsPass && guardrailsPassed) {
    return false;
  }

  return policy.requiresApproval;
}

/**
 * Create an approval request
 */
export function createApprovalRequest(params: {
  actionType: ActionType;
  proposedAction: string;
  reason: string;
  automationLevel: number;
  targetId?: string;
  targetName?: string;
  aiConfidence?: number;
  guardrailChecks?: GuardrailCheck[];
  sourcesUsed?: string[];
}): ApprovalRequest {
  const policy = getApprovalPolicy(params.automationLevel);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + policy.expirationMinutes * 60 * 1000);

  return {
    id: `approval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: "pending",
    actionType: params.actionType,
    targetId: params.targetId,
    targetName: params.targetName,
    proposedAction: params.proposedAction,
    reason: params.reason,
    aiConfidence: params.aiConfidence,
    guardrailChecks: params.guardrailChecks,
    sourcesUsed: params.sourcesUsed,
  };
}

/**
 * Approve a request
 */
export function approveRequest(request: ApprovalRequest, approvedBy: string): ApprovalRequest {
  return {
    ...request,
    status: "approved",
    approvedBy,
    approvedAt: new Date().toISOString(),
  };
}

/**
 * Reject a request
 */
export function rejectRequest(
  request: ApprovalRequest,
  rejectedBy: string,
  reason: string,
): ApprovalRequest {
  return {
    ...request,
    status: "rejected",
    rejectedBy,
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
  };
}

/**
 * Check if a request is expired
 */
export function isRequestExpired(request: ApprovalRequest): boolean {
  if (request.status !== "pending") return false;
  return new Date() > new Date(request.expiresAt);
}

/**
 * Mark request as executed
 */
export function markRequestExecuted(request: ApprovalRequest, result: string): ApprovalRequest {
  return {
    ...request,
    executedAt: new Date().toISOString(),
    executionResult: result,
  };
}

/**
 * Format approval request for display
 */
export function formatApprovalRequest(request: ApprovalRequest): string {
  const lines: string[] = [];

  lines.push(`APPROVAL REQUEST: ${request.id}`);
  lines.push(`Status: ${request.status.toUpperCase()}`);
  lines.push(`Action: ${request.actionType} - ${request.proposedAction}`);
  if (request.targetName) {
    lines.push(`Target: ${request.targetName}`);
  }
  lines.push(`Reason: ${request.reason}`);
  if (request.aiConfidence !== undefined) {
    lines.push(`AI Confidence: ${(request.aiConfidence * 100).toFixed(0)}%`);
  }
  lines.push(`Created: ${request.createdAt}`);
  lines.push(`Expires: ${request.expiresAt}`);

  if (request.sourcesUsed && request.sourcesUsed.length > 0) {
    lines.push(`Sources: ${request.sourcesUsed.join(", ")}`);
  }

  return lines.join("\n");
}
