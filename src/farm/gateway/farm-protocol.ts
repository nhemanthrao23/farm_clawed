/**
 * Farm Protocol - WebSocket Method Types
 *
 * Defines the farm-specific WebSocket protocol extensions.
 */

import { z } from "zod";

// Farm method names
export type FarmMethodName =
  | "farm.context.get"
  | "farm.context.update"
  | "farm.schedule.run"
  | "farm.schedule.list"
  | "farm.approval.list"
  | "farm.approval.submit"
  | "farm.approval.reject"
  | "farm.audit.list"
  | "farm.audit.verify"
  | "farm.experiment.status"
  | "farm.experiment.data"
  | "farm.action.execute"
  | "farm.action.stop"
  | "farm.sensor.read"
  | "farm.sensor.history";

// Request/Response types

// farm.context.get
export const FarmContextGetRequestSchema = z.object({
  method: z.literal("farm.context.get"),
});

export const FarmContextGetResponseSchema = z.object({
  permacultureDepth: z.number(),
  automationLevel: z.number(),
  profile: z.record(z.string(), z.unknown()).optional(),
  sensorCount: z.number(),
  actuatorCount: z.number(),
  pendingApprovals: z.number(),
  lastScheduleRun: z.string().optional(),
  experimentsActive: z.number(),
});

// farm.schedule.run
export const FarmScheduleRunRequestSchema = z.object({
  method: z.literal("farm.schedule.run"),
  params: z
    .object({
      type: z
        .union([
          z.literal("full"),
          z.literal("quick"),
          z.literal("water"),
          z.literal("fertility"),
          z.literal("climate"),
        ])
        .optional(),
      targetId: z.string().optional(),
    })
    .optional(),
});

export const FarmScheduleRunResponseSchema = z.object({
  runId: z.string(),
  timestamp: z.string(),
  analysis: z.string(),
  recommendations: z.array(
    z.object({
      action: z.string(),
      priority: z.union([z.literal("low"), z.literal("medium"), z.literal("high")]),
      requiresApproval: z.boolean(),
      approvalId: z.string().optional(),
    }),
  ),
  sourcesUsed: z.array(z.string()),
  fallbackUsed: z.boolean(),
});

// farm.approval.list
export const FarmApprovalListRequestSchema = z.object({
  method: z.literal("farm.approval.list"),
  params: z
    .object({
      status: z
        .union([
          z.literal("pending"),
          z.literal("approved"),
          z.literal("rejected"),
          z.literal("all"),
        ])
        .optional(),
      limit: z.number().optional(),
    })
    .optional(),
});

export const FarmApprovalListResponseSchema = z.object({
  approvals: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      actionType: z.string(),
      proposedAction: z.string(),
      createdAt: z.string(),
      expiresAt: z.string(),
    }),
  ),
  totalPending: z.number(),
});

// farm.approval.submit
export const FarmApprovalSubmitRequestSchema = z.object({
  method: z.literal("farm.approval.submit"),
  params: z.object({
    approvalId: z.string(),
    decision: z.union([z.literal("approve"), z.literal("reject")]),
    reason: z.string().optional(),
  }),
});

export const FarmApprovalSubmitResponseSchema = z.object({
  success: z.boolean(),
  approvalId: z.string(),
  newStatus: z.string(),
  executionResult: z.string().optional(),
});

// farm.audit.list
export const FarmAuditListRequestSchema = z.object({
  method: z.literal("farm.audit.list"),
  params: z
    .object({
      limit: z.number().optional(),
      types: z.array(z.string()).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
});

export const FarmAuditListResponseSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      entryType: z.string(),
      actor: z.string(),
      action: z.string(),
      hash: z.string(),
    }),
  ),
  chainValid: z.boolean(),
  totalEntries: z.number(),
});

// farm.experiment.status
export const FarmExperimentStatusRequestSchema = z.object({
  method: z.literal("farm.experiment.status"),
  params: z
    .object({
      experimentId: z.string().optional(),
    })
    .optional(),
});

export const FarmExperimentStatusResponseSchema = z.object({
  experiments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      enabled: z.boolean(),
      lastUpdate: z.string().optional(),
      metrics: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
});

// farm.sensor.read
export const FarmSensorReadRequestSchema = z.object({
  method: z.literal("farm.sensor.read"),
  params: z
    .object({
      sensorId: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
});

export const FarmSensorReadResponseSchema = z.object({
  readings: z.array(
    z.object({
      sensorId: z.string(),
      type: z.string(),
      value: z.number(),
      unit: z.string(),
      timestamp: z.string(),
      battery: z.number().optional(),
    }),
  ),
});

// farm.action.execute
export const FarmActionExecuteRequestSchema = z.object({
  method: z.literal("farm.action.execute"),
  params: z.object({
    actionType: z.string(),
    targetId: z.string(),
    parameters: z.record(z.string(), z.unknown()).optional(),
    bypassApproval: z.boolean().optional(),
  }),
});

export const FarmActionExecuteResponseSchema = z.object({
  success: z.boolean(),
  actionId: z.string(),
  requiresApproval: z.boolean(),
  approvalId: z.string().optional(),
  result: z.string().optional(),
  error: z.string().optional(),
});

// Export all request/response types
export type FarmContextGetRequest = z.infer<typeof FarmContextGetRequestSchema>;
export type FarmContextGetResponse = z.infer<typeof FarmContextGetResponseSchema>;
export type FarmScheduleRunRequest = z.infer<typeof FarmScheduleRunRequestSchema>;
export type FarmScheduleRunResponse = z.infer<typeof FarmScheduleRunResponseSchema>;
export type FarmApprovalListRequest = z.infer<typeof FarmApprovalListRequestSchema>;
export type FarmApprovalListResponse = z.infer<typeof FarmApprovalListResponseSchema>;
export type FarmApprovalSubmitRequest = z.infer<typeof FarmApprovalSubmitRequestSchema>;
export type FarmApprovalSubmitResponse = z.infer<typeof FarmApprovalSubmitResponseSchema>;
export type FarmAuditListRequest = z.infer<typeof FarmAuditListRequestSchema>;
export type FarmAuditListResponse = z.infer<typeof FarmAuditListResponseSchema>;
export type FarmExperimentStatusRequest = z.infer<typeof FarmExperimentStatusRequestSchema>;
export type FarmExperimentStatusResponse = z.infer<typeof FarmExperimentStatusResponseSchema>;
export type FarmSensorReadRequest = z.infer<typeof FarmSensorReadRequestSchema>;
export type FarmSensorReadResponse = z.infer<typeof FarmSensorReadResponseSchema>;
export type FarmActionExecuteRequest = z.infer<typeof FarmActionExecuteRequestSchema>;
export type FarmActionExecuteResponse = z.infer<typeof FarmActionExecuteResponseSchema>;
