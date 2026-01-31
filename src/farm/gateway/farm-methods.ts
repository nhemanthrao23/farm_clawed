/**
 * Farm Gateway Methods - Handler Implementations
 *
 * Implements the farm-specific WebSocket method handlers.
 */

import type {
  FarmContextGetResponse,
  FarmScheduleRunResponse,
  FarmApprovalListResponse,
  FarmAuditListResponse,
  FarmExperimentStatusResponse,
  FarmSensorReadResponse,
} from "./farm-protocol.js";
import { generateFallbackResponse, buildFallbackContext } from "../ai/fallback.js";
import { createAuditEntry, verifyAuditChain, type AuditEntry } from "../safety/audit-chain.js";
import {
  createApprovalRequest,
  type ApprovalRequest,
  getApprovalPolicy,
} from "../safety/approval-policy.js";
import { checkGuardrails, allGuardrailsPass } from "../safety/guardrails.js";
import type { SensorReading } from "../schemas/sensor-readings.js";

// In-memory storage (would be replaced with actual persistence)
let auditEntries: AuditEntry[] = [];
let approvalRequests: ApprovalRequest[] = [];
let sensorReadings: SensorReading[] = [];

/**
 * Handle farm.context.get
 */
export async function handleFarmContextGet(params: {
  permacultureDepth: number;
  automationLevel: number;
  profile?: Record<string, unknown>;
}): Promise<FarmContextGetResponse> {
  const pendingApprovals = approvalRequests.filter((a) => a.status === "pending").length;

  return {
    permacultureDepth: params.permacultureDepth,
    automationLevel: params.automationLevel,
    profile: params.profile,
    sensorCount: new Set(sensorReadings.map((r) => r.sensor_id)).size,
    actuatorCount: 0, // Would be populated from config
    pendingApprovals,
    experimentsActive: 1, // Lemon tree experiment
  };
}

/**
 * Handle farm.schedule.run
 */
export async function handleFarmScheduleRun(params: {
  type?: "full" | "quick" | "water" | "fertility" | "climate";
  permacultureDepth: number;
  automationLevel: number;
  readings: SensorReading[];
}): Promise<FarmScheduleRunResponse> {
  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Build context from readings
  const context = buildFallbackContext(params.readings, {
    permacultureDepth: params.permacultureDepth,
    automationLevel: params.automationLevel,
  });

  // Generate analysis (using fallback for now)
  const queryType =
    params.type === "water"
      ? "water"
      : params.type === "fertility"
        ? "fertilize"
        : params.type === "climate"
          ? "climate"
          : "general";

  // Import dynamically to avoid circular deps
  const { getFallbackForQuery } = await import("../ai/fallback.js");
  const response = getFallbackForQuery(queryType, context);

  // Build recommendations
  const recommendations: FarmScheduleRunResponse["recommendations"] = [];

  if (response.recommendations) {
    for (const rec of response.recommendations) {
      const policy = getApprovalPolicy(params.automationLevel);
      const requiresApproval = policy.requiresApproval;

      let approvalId: string | undefined;
      if (requiresApproval && rec.priority !== "low") {
        const approval = createApprovalRequest({
          actionType: "water",
          proposedAction: rec.action,
          reason: rec.reasoning,
          automationLevel: params.automationLevel,
        });
        approvalRequests.push(approval);
        approvalId = approval.id;
      }

      recommendations.push({
        action: rec.action,
        priority: rec.priority,
        requiresApproval,
        approvalId,
      });
    }
  }

  // Log to audit
  const auditEntry = createAuditEntry({
    entryType: "system_event",
    actor: "farm_scheduler",
    action: `Schedule run (${params.type || "full"})`,
    details: {
      runId,
      recommendationCount: recommendations.length,
      fallbackUsed: response.fallbackUsed,
    },
    previousHash: auditEntries.length > 0 ? auditEntries[auditEntries.length - 1].hash : undefined,
  });
  auditEntries.push(auditEntry);

  return {
    runId,
    timestamp: new Date().toISOString(),
    analysis: response.content,
    recommendations,
    sourcesUsed: response.sourcesUsed,
    fallbackUsed: response.fallbackUsed,
  };
}

/**
 * Handle farm.approval.list
 */
export async function handleFarmApprovalList(params: {
  status?: "pending" | "approved" | "rejected" | "all";
  limit?: number;
}): Promise<FarmApprovalListResponse> {
  let filtered = approvalRequests;

  if (params.status && params.status !== "all") {
    filtered = filtered.filter((a) => a.status === params.status);
  }

  if (params.limit) {
    filtered = filtered.slice(-params.limit);
  }

  const totalPending = approvalRequests.filter((a) => a.status === "pending").length;

  return {
    approvals: filtered.map((a) => ({
      id: a.id,
      status: a.status,
      actionType: a.actionType,
      proposedAction: a.proposedAction,
      createdAt: a.createdAt,
      expiresAt: a.expiresAt,
    })),
    totalPending,
  };
}

/**
 * Handle farm.approval.submit
 */
export async function handleFarmApprovalSubmit(params: {
  approvalId: string;
  decision: "approve" | "reject";
  reason?: string;
  actor: string;
}): Promise<{ success: boolean; newStatus: string; executionResult?: string }> {
  const approval = approvalRequests.find((a) => a.id === params.approvalId);

  if (!approval) {
    return { success: false, newStatus: "not_found" };
  }

  if (approval.status !== "pending") {
    return { success: false, newStatus: approval.status };
  }

  // Update approval
  approval.status = params.decision === "approve" ? "approved" : "rejected";
  if (params.decision === "approve") {
    approval.approvedBy = params.actor;
    approval.approvedAt = new Date().toISOString();
  } else {
    approval.rejectedBy = params.actor;
    approval.rejectedAt = new Date().toISOString();
    approval.rejectionReason = params.reason;
  }

  // Log to audit
  const auditEntry = createAuditEntry({
    entryType: params.decision === "approve" ? "action_approved" : "action_rejected",
    actor: params.actor,
    action: `${params.decision} approval ${params.approvalId}`,
    target: approval.targetId,
    details: { reason: params.reason },
    previousHash: auditEntries.length > 0 ? auditEntries[auditEntries.length - 1].hash : undefined,
  });
  auditEntries.push(auditEntry);

  return {
    success: true,
    newStatus: approval.status,
    executionResult: params.decision === "approve" ? "Action queued for execution" : undefined,
  };
}

/**
 * Handle farm.audit.list
 */
export async function handleFarmAuditList(params: {
  limit?: number;
  types?: string[];
  startDate?: string;
  endDate?: string;
}): Promise<FarmAuditListResponse> {
  let filtered = auditEntries;

  if (params.types && params.types.length > 0) {
    filtered = filtered.filter((e) => params.types!.includes(e.entryType));
  }

  if (params.startDate) {
    const start = new Date(params.startDate).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() >= start);
  }

  if (params.endDate) {
    const end = new Date(params.endDate).getTime();
    filtered = filtered.filter((e) => new Date(e.timestamp).getTime() <= end);
  }

  if (params.limit) {
    filtered = filtered.slice(-params.limit);
  }

  const verification = verifyAuditChain(auditEntries);

  return {
    entries: filtered.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      entryType: e.entryType,
      actor: e.actor,
      action: e.action,
      hash: e.hash,
    })),
    chainValid: verification.valid,
    totalEntries: auditEntries.length,
  };
}

/**
 * Handle farm.experiment.status
 */
export async function handleFarmExperimentStatus(params: {
  experimentId?: string;
}): Promise<FarmExperimentStatusResponse> {
  // For now, return the lemon tree experiment
  const experiments = [
    {
      id: "lemon-tree",
      name: "Santa Teresa Lemon Tree Biodome",
      enabled: true,
      lastUpdate: new Date().toISOString(),
      metrics: {
        daysActive: Math.floor(
          (Date.now() - new Date("2025-01-31").getTime()) / (1000 * 60 * 60 * 24),
        ),
        sensorReadings: sensorReadings.length,
        waterEvents: 0,
        alertsTriggered: 0,
      },
    },
  ];

  if (params.experimentId) {
    return {
      experiments: experiments.filter((e) => e.id === params.experimentId),
    };
  }

  return { experiments };
}

/**
 * Handle farm.sensor.read
 */
export async function handleFarmSensorRead(params: {
  sensorId?: string;
  type?: string;
}): Promise<FarmSensorReadResponse> {
  let filtered = sensorReadings;

  if (params.sensorId) {
    filtered = filtered.filter((r) => r.sensor_id === params.sensorId);
  }

  if (params.type) {
    filtered = filtered.filter((r) => r.reading_type === params.type);
  }

  // Get latest reading for each sensor/type combo
  const latestMap = new Map<string, SensorReading>();
  for (const reading of filtered) {
    const key = `${reading.sensor_id}:${reading.reading_type}`;
    const existing = latestMap.get(key);
    if (!existing || new Date(reading.timestamp) > new Date(existing.timestamp)) {
      latestMap.set(key, reading);
    }
  }

  return {
    readings: [...latestMap.values()].map((r) => ({
      sensorId: r.sensor_id,
      type: r.reading_type,
      value: r.value,
      unit: r.unit,
      timestamp: r.timestamp,
      battery: r.battery_pct,
    })),
  };
}

/**
 * Ingest sensor readings
 */
export function ingestSensorReadings(readings: SensorReading[]): void {
  sensorReadings.push(...readings);

  // Log to audit
  const auditEntry = createAuditEntry({
    entryType: "sensor_reading",
    actor: "sensor_ingest",
    action: `Ingested ${readings.length} readings`,
    details: { sensorIds: [...new Set(readings.map((r) => r.sensor_id))] },
    previousHash: auditEntries.length > 0 ? auditEntries[auditEntries.length - 1].hash : undefined,
  });
  auditEntries.push(auditEntry);
}

/**
 * Get all sensor readings (for export/testing)
 */
export function getAllSensorReadings(): SensorReading[] {
  return [...sensorReadings];
}

/**
 * Get all audit entries (for export/testing)
 */
export function getAllAuditEntries(): AuditEntry[] {
  return [...auditEntries];
}

/**
 * Get all approval requests (for export/testing)
 */
export function getAllApprovalRequests(): ApprovalRequest[] {
  return [...approvalRequests];
}

/**
 * Clear in-memory data (for testing)
 */
export function clearFarmData(): void {
  auditEntries = [];
  approvalRequests = [];
  sensorReadings = [];
}
