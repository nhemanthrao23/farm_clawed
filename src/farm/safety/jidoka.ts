/**
 * Jidoka - Stop-the-Line Safety System
 *
 * Implements Toyota-style autonomation for farm automation.
 * Automatically stops operations when anomalies are detected.
 */

import { z } from "zod";

// Stop trigger types
export const StopTriggerTypeSchema = z.union([
  z.literal("leak_detected"),
  z.literal("overwatering"),
  z.literal("underwatering"),
  z.literal("ec_spike"),
  z.literal("ec_drop"),
  z.literal("frost_risk"),
  z.literal("heat_risk"),
  z.literal("sensor_offline"),
  z.literal("actuator_timeout"),
  z.literal("manual_stop"),
  z.literal("system_error"),
]);

export type StopTriggerType = z.infer<typeof StopTriggerTypeSchema>;

// Stop trigger configuration
export const StopTriggerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  threshold: z.number().optional(),
  durationMinutes: z.number().optional(),
  cooldownMinutes: z.number().default(60),
});

export type StopTriggerConfig = z.infer<typeof StopTriggerConfigSchema>;

// Jidoka event
export const JidokaEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  triggerType: StopTriggerTypeSchema,
  severity: z.union([z.literal("warning"), z.literal("critical"), z.literal("emergency")]),
  sensorId: z.string().optional(),
  actuatorId: z.string().optional(),
  currentValue: z.number().optional(),
  threshold: z.number().optional(),
  message: z.string(),
  actionsTaken: z.array(z.string()),
  resolved: z.boolean().default(false),
  resolvedAt: z.string().optional(),
  resolvedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type JidokaEvent = z.infer<typeof JidokaEventSchema>;

// Default stop trigger configurations
export const DEFAULT_STOP_TRIGGERS: Record<StopTriggerType, StopTriggerConfig> = {
  leak_detected: {
    enabled: true,
    cooldownMinutes: 120,
  },
  overwatering: {
    enabled: true,
    threshold: 80, // moisture percent
    durationMinutes: 60,
    cooldownMinutes: 240,
  },
  underwatering: {
    enabled: true,
    threshold: 15, // moisture percent
    durationMinutes: 1440, // 24 hours
    cooldownMinutes: 60,
  },
  ec_spike: {
    enabled: true,
    threshold: 3.0, // mS/cm
    cooldownMinutes: 120,
  },
  ec_drop: {
    enabled: true,
    threshold: 0.1, // mS/cm (very low)
    cooldownMinutes: 60,
  },
  frost_risk: {
    enabled: true,
    threshold: 35, // degrees F
    cooldownMinutes: 60,
  },
  heat_risk: {
    enabled: true,
    threshold: 105, // degrees F
    cooldownMinutes: 60,
  },
  sensor_offline: {
    enabled: true,
    durationMinutes: 60, // offline for 1 hour
    cooldownMinutes: 30,
  },
  actuator_timeout: {
    enabled: true,
    durationMinutes: 5, // no response for 5 min
    cooldownMinutes: 30,
  },
  manual_stop: {
    enabled: true,
    cooldownMinutes: 0, // no cooldown for manual
  },
  system_error: {
    enabled: true,
    cooldownMinutes: 60,
  },
};

/**
 * Check if a value triggers a stop condition
 */
export function checkStopTrigger(
  triggerType: StopTriggerType,
  currentValue: number,
  config: StopTriggerConfig = DEFAULT_STOP_TRIGGERS[triggerType],
): { triggered: boolean; severity: JidokaEvent["severity"]; message: string } {
  if (!config.enabled) {
    return { triggered: false, severity: "warning", message: "" };
  }

  const threshold = config.threshold;
  if (threshold === undefined) {
    return { triggered: false, severity: "warning", message: "" };
  }

  switch (triggerType) {
    case "overwatering":
      if (currentValue > threshold) {
        return {
          triggered: true,
          severity: currentValue > threshold + 10 ? "critical" : "warning",
          message: `Soil moisture ${currentValue}% exceeds threshold ${threshold}%`,
        };
      }
      break;

    case "underwatering":
      if (currentValue < threshold) {
        return {
          triggered: true,
          severity: currentValue < threshold - 5 ? "critical" : "warning",
          message: `Soil moisture ${currentValue}% below threshold ${threshold}%`,
        };
      }
      break;

    case "ec_spike":
      if (currentValue > threshold) {
        return {
          triggered: true,
          severity: currentValue > threshold * 1.5 ? "critical" : "warning",
          message: `EC ${currentValue} mS/cm exceeds threshold ${threshold} mS/cm`,
        };
      }
      break;

    case "ec_drop":
      if (currentValue < threshold) {
        return {
          triggered: true,
          severity: "warning",
          message: `EC ${currentValue} mS/cm below threshold ${threshold} mS/cm - possible nutrient deficiency`,
        };
      }
      break;

    case "frost_risk":
      if (currentValue < threshold) {
        const severity =
          currentValue < 32 ? "emergency" : currentValue < threshold ? "critical" : "warning";
        return {
          triggered: true,
          severity,
          message: `Temperature ${currentValue}°F below frost threshold ${threshold}°F`,
        };
      }
      break;

    case "heat_risk":
      if (currentValue > threshold) {
        return {
          triggered: true,
          severity: currentValue > threshold + 5 ? "critical" : "warning",
          message: `Temperature ${currentValue}°F exceeds heat threshold ${threshold}°F`,
        };
      }
      break;
  }

  return { triggered: false, severity: "warning", message: "" };
}

/**
 * Create a Jidoka event
 */
export function createJidokaEvent(params: {
  triggerType: StopTriggerType;
  severity: JidokaEvent["severity"];
  message: string;
  sensorId?: string;
  actuatorId?: string;
  currentValue?: number;
  threshold?: number;
  actionsTaken?: string[];
}): JidokaEvent {
  return {
    id: `jidoka_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    triggerType: params.triggerType,
    severity: params.severity,
    sensorId: params.sensorId,
    actuatorId: params.actuatorId,
    currentValue: params.currentValue,
    threshold: params.threshold,
    message: params.message,
    actionsTaken: params.actionsTaken || [],
    resolved: false,
  };
}

/**
 * Get recommended actions for a Jidoka event
 */
export function getRecommendedActions(event: JidokaEvent): string[] {
  const actions: string[] = [];

  switch (event.triggerType) {
    case "leak_detected":
      actions.push("Immediately shut off all valves");
      actions.push("Inspect water lines for damage");
      actions.push("Check valve connections");
      actions.push("Do not resume until leak source identified");
      break;

    case "overwatering":
      actions.push("Stop all scheduled irrigation");
      actions.push("Check drainage");
      actions.push("Allow soil to dry before resuming");
      actions.push("Review watering schedule");
      break;

    case "underwatering":
      actions.push("Check irrigation system functionality");
      actions.push("Manually water if critical");
      actions.push("Verify sensor readings");
      actions.push("Review schedule and adjust");
      break;

    case "frost_risk":
      actions.push("Cover sensitive plants");
      actions.push("Water soil (thermal mass)");
      actions.push("Move containers near house");
      actions.push("Consider supplemental heat");
      break;

    case "heat_risk":
      actions.push("Provide shade");
      actions.push("Increase watering frequency");
      actions.push("Water roots, not leaves");
      actions.push("Check for wilting");
      break;

    case "ec_spike":
      actions.push("Stop fertilization immediately");
      actions.push("Flush soil with clean water");
      actions.push("Check for salt buildup");
      actions.push("Test water source");
      break;

    case "sensor_offline":
      actions.push("Check sensor battery");
      actions.push("Verify sensor connectivity");
      actions.push("Replace sensor if needed");
      actions.push("Use manual monitoring until resolved");
      break;

    case "actuator_timeout":
      actions.push("Check actuator power");
      actions.push("Verify network connectivity");
      actions.push("Test manual operation");
      actions.push("Do not send commands until resolved");
      break;
  }

  return actions;
}

/**
 * Resolve a Jidoka event
 */
export function resolveJidokaEvent(
  event: JidokaEvent,
  resolvedBy: string,
  notes?: string,
): JidokaEvent {
  return {
    ...event,
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    notes,
  };
}
