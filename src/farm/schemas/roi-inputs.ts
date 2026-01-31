/**
 * ROI Inputs Schema
 *
 * Cost tracking and value estimation configuration.
 */

import { z } from "zod";

export const WaterCostsSchema = z.object({
  rate_per_gallon: z.number().nonnegative().optional(),
  baseline_monthly_gallons: z.number().nonnegative().optional(),
  rate_structure: z
    .union([z.literal("flat"), z.literal("tiered"), z.literal("seasonal")])
    .optional(),
});

export const InputCostsSchema = z.object({
  fertilizer_monthly: z.number().nonnegative().optional(),
  pest_control_monthly: z.number().nonnegative().optional(),
  amendments_monthly: z.number().nonnegative().optional(),
  seeds_annual: z.number().nonnegative().optional(),
  tools_annual: z.number().nonnegative().optional(),
  other_monthly: z.number().nonnegative().optional(),
});

export const TimeCostsSchema = z.object({
  hourly_value: z.number().nonnegative().optional(),
  baseline_hours_per_week: z.number().nonnegative().optional(),
});

export const EquipmentCostsSchema = z.object({
  sensor_cost: z.number().nonnegative().optional(),
  valve_cost: z.number().nonnegative().optional(),
  hub_cost: z.number().nonnegative().optional(),
  other_hardware: z.number().nonnegative().optional(),
  subscription_monthly: z.number().nonnegative().optional(),
});

export const HarvestValuesSchema = z.object({
  expected_units_per_year: z.number().nonnegative().optional(),
  value_per_unit: z.number().nonnegative().optional(),
  unit_name: z.string().optional(),
});

export const AvoidedLossValuesSchema = z.object({
  plant_replacement_cost: z.number().nonnegative().optional(),
  probability_without_monitoring: z.number().min(0).max(1).optional(),
  probability_with_monitoring: z.number().min(0).max(1).optional(),
});

export const RoiGoalsSchema = z.object({
  target_water_savings_percent: z.number().min(0).max(100).optional(),
  target_time_savings_percent: z.number().min(0).max(100).optional(),
  payback_target_months: z.number().int().positive().optional(),
});

export const RoiInputsSchema = z.object({
  tracking_period: z
    .union([z.literal("daily"), z.literal("weekly"), z.literal("monthly")])
    .default("monthly"),
  costs: z
    .object({
      water: WaterCostsSchema.optional(),
      inputs: InputCostsSchema.optional(),
      time: TimeCostsSchema.optional(),
      equipment: EquipmentCostsSchema.optional(),
    })
    .optional(),
  values: z
    .object({
      harvest: HarvestValuesSchema.optional(),
      avoided_loss: AvoidedLossValuesSchema.optional(),
    })
    .optional(),
  goals: RoiGoalsSchema.optional(),
});

export type WaterCosts = z.infer<typeof WaterCostsSchema>;
export type InputCosts = z.infer<typeof InputCostsSchema>;
export type TimeCosts = z.infer<typeof TimeCostsSchema>;
export type EquipmentCosts = z.infer<typeof EquipmentCostsSchema>;
export type HarvestValues = z.infer<typeof HarvestValuesSchema>;
export type AvoidedLossValues = z.infer<typeof AvoidedLossValuesSchema>;
export type RoiGoals = z.infer<typeof RoiGoalsSchema>;
export type RoiInputs = z.infer<typeof RoiInputsSchema>;

/**
 * Validate ROI inputs
 */
export function validateRoiInputs(
  data: unknown,
): { ok: true; data: RoiInputs } | { ok: false; errors: string[] } {
  const result = RoiInputsSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Calculate total monthly baseline costs
 */
export function getMonthlyBaselineCosts(inputs: RoiInputs): number {
  let total = 0;

  // Water costs
  if (inputs.costs?.water?.rate_per_gallon && inputs.costs?.water?.baseline_monthly_gallons) {
    total += inputs.costs.water.rate_per_gallon * inputs.costs.water.baseline_monthly_gallons;
  }

  // Input costs
  if (inputs.costs?.inputs) {
    total += inputs.costs.inputs.fertilizer_monthly || 0;
    total += inputs.costs.inputs.pest_control_monthly || 0;
    total += inputs.costs.inputs.amendments_monthly || 0;
    total += inputs.costs.inputs.other_monthly || 0;
    total += (inputs.costs.inputs.seeds_annual || 0) / 12;
    total += (inputs.costs.inputs.tools_annual || 0) / 12;
  }

  // Time costs
  if (inputs.costs?.time?.hourly_value && inputs.costs?.time?.baseline_hours_per_week) {
    total += inputs.costs.time.hourly_value * inputs.costs.time.baseline_hours_per_week * 4.33;
  }

  return total;
}

/**
 * Calculate total equipment investment
 */
export function getTotalEquipmentCost(inputs: RoiInputs): number {
  if (!inputs.costs?.equipment) return 0;
  const eq = inputs.costs.equipment;
  return (
    (eq.sensor_cost || 0) + (eq.valve_cost || 0) + (eq.hub_cost || 0) + (eq.other_hardware || 0)
  );
}

/**
 * Calculate expected annual value from harvest
 */
export function getExpectedHarvestValue(inputs: RoiInputs): number {
  if (!inputs.values?.harvest) return 0;
  const h = inputs.values.harvest;
  return (h.expected_units_per_year || 0) * (h.value_per_unit || 0);
}

/**
 * Calculate expected annual value from avoided loss
 */
export function getAvoidedLossValue(inputs: RoiInputs): number {
  if (!inputs.values?.avoided_loss) return 0;
  const a = inputs.values.avoided_loss;
  const riskReduction =
    (a.probability_without_monitoring || 0) - (a.probability_with_monitoring || 0);
  return (a.plant_replacement_cost || 0) * riskReduction;
}
