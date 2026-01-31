/**
 * Rollback - Undo Plan Generation
 *
 * Generates rollback plans for actions in case of issues.
 */

import { z } from "zod";
import type { ApprovalRequest } from "./approval-policy.js";
import type { AuditEntry } from "./audit-chain.js";

// Rollback action
export const RollbackActionSchema = z.object({
  step: z.number(),
  action: z.string(),
  command: z.string().optional(),
  manual: z.boolean().default(false),
  estimatedDurationMinutes: z.number().optional(),
  notes: z.string().optional(),
});

export type RollbackAction = z.infer<typeof RollbackActionSchema>;

// Rollback plan
export const RollbackPlanSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  originalActionId: z.string(),
  originalAction: z.string(),
  triggerConditions: z.array(z.string()),
  steps: z.array(RollbackActionSchema),
  estimatedTotalMinutes: z.number(),
  priority: z.union([
    z.literal("low"),
    z.literal("medium"),
    z.literal("high"),
    z.literal("critical"),
  ]),
  executed: z.boolean().default(false),
  executedAt: z.string().optional(),
});

export type RollbackPlan = z.infer<typeof RollbackPlanSchema>;

/**
 * Generate a rollback plan for a watering action
 */
export function generateWateringRollbackPlan(params: {
  actionId: string;
  targetId: string;
  targetName: string;
  waterAmount: number;
}): RollbackPlan {
  const steps: RollbackAction[] = [
    {
      step: 1,
      action: "Verify current soil moisture",
      command: `farm_clawed farm sensors read --id ${params.targetId}`,
      manual: false,
      estimatedDurationMinutes: 1,
    },
    {
      step: 2,
      action: "If moisture > 80%, check for drainage issues",
      manual: true,
      estimatedDurationMinutes: 5,
      notes: "Inspect container drainage holes, check for standing water",
    },
    {
      step: 3,
      action: "If overwatered, stop all scheduled irrigation",
      command: `farm_clawed farm water stop --zone ${params.targetId}`,
      manual: false,
      estimatedDurationMinutes: 1,
    },
    {
      step: 4,
      action: "Allow soil to dry naturally",
      manual: true,
      estimatedDurationMinutes: 1440, // 24 hours
      notes: "Do not water until moisture drops below 50%",
    },
    {
      step: 5,
      action: "Resume normal schedule when moisture stabilizes",
      manual: true,
      estimatedDurationMinutes: 5,
    },
  ];

  return {
    id: `rollback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    originalActionId: params.actionId,
    originalAction: `Water ${params.targetName} with ${params.waterAmount} gallons`,
    triggerConditions: [
      "Moisture exceeds 85% within 2 hours",
      "Standing water observed",
      "Plant shows signs of overwatering (yellowing, wilting)",
    ],
    steps,
    estimatedTotalMinutes: steps.reduce((sum, s) => sum + (s.estimatedDurationMinutes || 0), 0),
    priority: "medium",
    executed: false,
  };
}

/**
 * Generate a rollback plan for a fertilization action
 */
export function generateFertilizationRollbackPlan(params: {
  actionId: string;
  targetId: string;
  targetName: string;
  product: string;
}): RollbackPlan {
  const steps: RollbackAction[] = [
    {
      step: 1,
      action: "Check EC levels immediately",
      command: `farm_clawed farm sensors read --id ${params.targetId} --type ec`,
      manual: false,
      estimatedDurationMinutes: 1,
    },
    {
      step: 2,
      action: "If EC > 3.0 mS/cm, flush soil with clean water",
      manual: true,
      estimatedDurationMinutes: 15,
      notes: "Use 2-3x the container volume in clean water",
    },
    {
      step: 3,
      action: "Allow to drain completely",
      manual: true,
      estimatedDurationMinutes: 30,
    },
    {
      step: 4,
      action: "Re-check EC after drainage",
      command: `farm_clawed farm sensors read --id ${params.targetId} --type ec`,
      manual: false,
      estimatedDurationMinutes: 1,
    },
    {
      step: 5,
      action: "If still high, repeat flush",
      manual: true,
      estimatedDurationMinutes: 45,
    },
  ];

  return {
    id: `rollback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    originalActionId: params.actionId,
    originalAction: `Apply ${params.product} to ${params.targetName}`,
    triggerConditions: [
      "EC spikes above 3.0 mS/cm",
      "Leaf tip burn observed",
      "Salt deposits visible on soil surface",
    ],
    steps,
    estimatedTotalMinutes: steps.reduce((sum, s) => sum + (s.estimatedDurationMinutes || 0), 0),
    priority: "high",
    executed: false,
  };
}

/**
 * Generate a generic rollback plan
 */
export function generateGenericRollbackPlan(params: {
  actionId: string;
  actionDescription: string;
}): RollbackPlan {
  const steps: RollbackAction[] = [
    {
      step: 1,
      action: "Document current state",
      manual: true,
      estimatedDurationMinutes: 5,
      notes: "Take photos, record observations",
    },
    {
      step: 2,
      action: "Identify what went wrong",
      manual: true,
      estimatedDurationMinutes: 10,
      notes: "Compare expected vs actual outcomes",
    },
    {
      step: 3,
      action: "Determine corrective action",
      manual: true,
      estimatedDurationMinutes: 10,
    },
    {
      step: 4,
      action: "Execute correction",
      manual: true,
      estimatedDurationMinutes: 30,
    },
    {
      step: 5,
      action: "Monitor for improvement",
      manual: true,
      estimatedDurationMinutes: 1440, // 24 hours
    },
  ];

  return {
    id: `rollback_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    originalActionId: params.actionId,
    originalAction: params.actionDescription,
    triggerConditions: [
      "Unexpected negative outcome",
      "Plant stress observed",
      "Sensor readings abnormal",
    ],
    steps,
    estimatedTotalMinutes: steps.reduce((sum, s) => sum + (s.estimatedDurationMinutes || 0), 0),
    priority: "medium",
    executed: false,
  };
}

/**
 * Generate rollback plan from approval request
 */
export function generateRollbackFromApproval(request: ApprovalRequest): RollbackPlan {
  switch (request.actionType) {
    case "water":
      return generateWateringRollbackPlan({
        actionId: request.id,
        targetId: request.targetId || "unknown",
        targetName: request.targetName || "Unknown target",
        waterAmount: 1, // Default
      });

    case "fertilize":
      return generateFertilizationRollbackPlan({
        actionId: request.id,
        targetId: request.targetId || "unknown",
        targetName: request.targetName || "Unknown target",
        product: "fertilizer",
      });

    default:
      return generateGenericRollbackPlan({
        actionId: request.id,
        actionDescription: request.proposedAction,
      });
  }
}

/**
 * Mark rollback plan as executed
 */
export function executeRollbackPlan(plan: RollbackPlan): RollbackPlan {
  return {
    ...plan,
    executed: true,
    executedAt: new Date().toISOString(),
  };
}

/**
 * Format rollback plan for display
 */
export function formatRollbackPlan(plan: RollbackPlan): string {
  const lines: string[] = [];

  lines.push(`ROLLBACK PLAN: ${plan.id}`);
  lines.push(`Priority: ${plan.priority.toUpperCase()}`);
  lines.push(`Original Action: ${plan.originalAction}`);
  lines.push(`Estimated Time: ${plan.estimatedTotalMinutes} minutes`);
  lines.push("");
  lines.push("TRIGGER CONDITIONS:");
  for (const condition of plan.triggerConditions) {
    lines.push(`  - ${condition}`);
  }
  lines.push("");
  lines.push("ROLLBACK STEPS:");
  for (const step of plan.steps) {
    lines.push(`  ${step.step}. ${step.action}`);
    if (step.command) {
      lines.push(`     Command: ${step.command}`);
    }
    if (step.notes) {
      lines.push(`     Note: ${step.notes}`);
    }
    lines.push(
      `     ${step.manual ? "[Manual]" : "[Automated]"} ~${step.estimatedDurationMinutes || 0} min`,
    );
  }

  return lines.join("\n");
}

/**
 * Generate rollback plans for recent audit entries
 */
export function generateRollbacksFromAudit(entries: AuditEntry[]): RollbackPlan[] {
  const actionEntries = entries.filter((e) => e.entryType === "action_executed");

  return actionEntries.map((entry) =>
    generateGenericRollbackPlan({
      actionId: entry.id,
      actionDescription: entry.action,
    }),
  );
}
