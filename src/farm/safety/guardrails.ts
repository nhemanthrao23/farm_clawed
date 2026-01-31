/**
 * Guardrails - Safety Limits by Automation Level
 *
 * Defines operational limits that cannot be exceeded at each automation level.
 */

import { z } from "zod";

// Guardrail types
export const GuardrailTypeSchema = z.union([
  z.literal("max_water_per_action"),
  z.literal("max_water_daily"),
  z.literal("min_watering_interval"),
  z.literal("max_consecutive_actions"),
  z.literal("require_sensor_reading"),
  z.literal("moisture_ceiling"),
  z.literal("moisture_floor"),
  z.literal("ec_ceiling"),
  z.literal("temp_floor"),
  z.literal("temp_ceiling"),
]);

export type GuardrailType = z.infer<typeof GuardrailTypeSchema>;

// Guardrail check result
export const GuardrailCheckSchema = z.object({
  guardrailType: GuardrailTypeSchema,
  passed: z.boolean(),
  currentValue: z.number().optional(),
  limit: z.number().optional(),
  message: z.string(),
});

export type GuardrailCheck = z.infer<typeof GuardrailCheckSchema>;

// Guardrail configuration by automation level
export interface GuardrailConfig {
  maxWaterPerActionGallons: number;
  maxWaterDailyGallons: number;
  minWateringIntervalMinutes: number;
  maxConsecutiveActions: number;
  requireSensorReading: boolean;
  moistureCeilingPercent: number;
  moistureFloorPercent: number;
  ecCeilingMsCm: number;
  tempFloorF: number;
  tempCeilingF: number;
}

// Default guardrails by automation level
export const GUARDRAILS_BY_LEVEL: Record<number, GuardrailConfig> = {
  // Level 0: Observe only (no actuator control)
  0: {
    maxWaterPerActionGallons: 0,
    maxWaterDailyGallons: 0,
    minWateringIntervalMinutes: Infinity,
    maxConsecutiveActions: 0,
    requireSensorReading: true,
    moistureCeilingPercent: 100,
    moistureFloorPercent: 0,
    ecCeilingMsCm: Infinity,
    tempFloorF: -Infinity,
    tempCeilingF: Infinity,
  },
  // Level 1: Assist (recommendations only)
  1: {
    maxWaterPerActionGallons: 0,
    maxWaterDailyGallons: 0,
    minWateringIntervalMinutes: Infinity,
    maxConsecutiveActions: 0,
    requireSensorReading: true,
    moistureCeilingPercent: 100,
    moistureFloorPercent: 0,
    ecCeilingMsCm: Infinity,
    tempFloorF: -Infinity,
    tempCeilingF: Infinity,
  },
  // Level 2: Propose + Approvals (human must approve)
  2: {
    maxWaterPerActionGallons: 2,
    maxWaterDailyGallons: 10,
    minWateringIntervalMinutes: 240, // 4 hours
    maxConsecutiveActions: 3,
    requireSensorReading: true,
    moistureCeilingPercent: 70,
    moistureFloorPercent: 15,
    ecCeilingMsCm: 3.0,
    tempFloorF: 35,
    tempCeilingF: 100,
  },
  // Level 3: Auto within guardrails
  3: {
    maxWaterPerActionGallons: 5,
    maxWaterDailyGallons: 20,
    minWateringIntervalMinutes: 120, // 2 hours
    maxConsecutiveActions: 5,
    requireSensorReading: true,
    moistureCeilingPercent: 75,
    moistureFloorPercent: 20,
    ecCeilingMsCm: 2.5,
    tempFloorF: 38,
    tempCeilingF: 95,
  },
  // Level 4: Full Ops (strict Jidoka)
  4: {
    maxWaterPerActionGallons: 10,
    maxWaterDailyGallons: 50,
    minWateringIntervalMinutes: 60, // 1 hour
    maxConsecutiveActions: 10,
    requireSensorReading: true, // Always require sensors at this level
    moistureCeilingPercent: 80,
    moistureFloorPercent: 25,
    ecCeilingMsCm: 2.0,
    tempFloorF: 40,
    tempCeilingF: 90,
  },
};

/**
 * Get guardrails for an automation level
 */
export function getGuardrails(automationLevel: number): GuardrailConfig {
  const level = Math.min(4, Math.max(0, automationLevel));
  return GUARDRAILS_BY_LEVEL[level] || GUARDRAILS_BY_LEVEL[0];
}

/**
 * Check if an action is within guardrails
 */
export function checkGuardrails(params: {
  automationLevel: number;
  proposedWaterGallons?: number;
  waterUsedTodayGallons?: number;
  minutesSinceLastWatering?: number;
  consecutiveActionsToday?: number;
  hasSensorReading?: boolean;
  currentMoisturePercent?: number;
  currentEcMsCm?: number;
  currentTempF?: number;
}): GuardrailCheck[] {
  const guardrails = getGuardrails(params.automationLevel);
  const checks: GuardrailCheck[] = [];

  // Check max water per action
  if (params.proposedWaterGallons !== undefined) {
    checks.push({
      guardrailType: "max_water_per_action",
      passed: params.proposedWaterGallons <= guardrails.maxWaterPerActionGallons,
      currentValue: params.proposedWaterGallons,
      limit: guardrails.maxWaterPerActionGallons,
      message:
        params.proposedWaterGallons <= guardrails.maxWaterPerActionGallons
          ? "Water amount within limit"
          : `Water amount ${params.proposedWaterGallons} gal exceeds limit ${guardrails.maxWaterPerActionGallons} gal`,
    });
  }

  // Check max water daily
  if (params.waterUsedTodayGallons !== undefined && params.proposedWaterGallons !== undefined) {
    const totalWater = params.waterUsedTodayGallons + params.proposedWaterGallons;
    checks.push({
      guardrailType: "max_water_daily",
      passed: totalWater <= guardrails.maxWaterDailyGallons,
      currentValue: totalWater,
      limit: guardrails.maxWaterDailyGallons,
      message:
        totalWater <= guardrails.maxWaterDailyGallons
          ? "Daily water limit OK"
          : `Total daily water ${totalWater} gal would exceed limit ${guardrails.maxWaterDailyGallons} gal`,
    });
  }

  // Check min watering interval
  if (params.minutesSinceLastWatering !== undefined) {
    checks.push({
      guardrailType: "min_watering_interval",
      passed: params.minutesSinceLastWatering >= guardrails.minWateringIntervalMinutes,
      currentValue: params.minutesSinceLastWatering,
      limit: guardrails.minWateringIntervalMinutes,
      message:
        params.minutesSinceLastWatering >= guardrails.minWateringIntervalMinutes
          ? "Sufficient time since last watering"
          : `Only ${params.minutesSinceLastWatering} min since last watering, minimum is ${guardrails.minWateringIntervalMinutes} min`,
    });
  }

  // Check max consecutive actions
  if (params.consecutiveActionsToday !== undefined) {
    checks.push({
      guardrailType: "max_consecutive_actions",
      passed: params.consecutiveActionsToday < guardrails.maxConsecutiveActions,
      currentValue: params.consecutiveActionsToday,
      limit: guardrails.maxConsecutiveActions,
      message:
        params.consecutiveActionsToday < guardrails.maxConsecutiveActions
          ? "Action count within limit"
          : `${params.consecutiveActionsToday} actions today, limit is ${guardrails.maxConsecutiveActions}`,
    });
  }

  // Check sensor reading requirement
  if (guardrails.requireSensorReading) {
    checks.push({
      guardrailType: "require_sensor_reading",
      passed: params.hasSensorReading === true,
      message:
        params.hasSensorReading === true
          ? "Sensor reading available"
          : "No sensor reading available - required for this automation level",
    });
  }

  // Check moisture ceiling
  if (params.currentMoisturePercent !== undefined) {
    checks.push({
      guardrailType: "moisture_ceiling",
      passed: params.currentMoisturePercent < guardrails.moistureCeilingPercent,
      currentValue: params.currentMoisturePercent,
      limit: guardrails.moistureCeilingPercent,
      message:
        params.currentMoisturePercent < guardrails.moistureCeilingPercent
          ? "Moisture below ceiling"
          : `Moisture ${params.currentMoisturePercent}% at or above ceiling ${guardrails.moistureCeilingPercent}% - do not water`,
    });
  }

  // Check EC ceiling
  if (params.currentEcMsCm !== undefined) {
    checks.push({
      guardrailType: "ec_ceiling",
      passed: params.currentEcMsCm <= guardrails.ecCeilingMsCm,
      currentValue: params.currentEcMsCm,
      limit: guardrails.ecCeilingMsCm,
      message:
        params.currentEcMsCm <= guardrails.ecCeilingMsCm
          ? "EC within limits"
          : `EC ${params.currentEcMsCm} mS/cm exceeds ceiling ${guardrails.ecCeilingMsCm} mS/cm`,
    });
  }

  // Check temperature floor
  if (params.currentTempF !== undefined) {
    checks.push({
      guardrailType: "temp_floor",
      passed: params.currentTempF >= guardrails.tempFloorF,
      currentValue: params.currentTempF,
      limit: guardrails.tempFloorF,
      message:
        params.currentTempF >= guardrails.tempFloorF
          ? "Temperature above floor"
          : `Temperature ${params.currentTempF}°F below floor ${guardrails.tempFloorF}°F - frost risk`,
    });
  }

  return checks;
}

/**
 * Check if all guardrails pass
 */
export function allGuardrailsPass(checks: GuardrailCheck[]): boolean {
  return checks.every((c) => c.passed);
}

/**
 * Get failed guardrails
 */
export function getFailedGuardrails(checks: GuardrailCheck[]): GuardrailCheck[] {
  return checks.filter((c) => !c.passed);
}
