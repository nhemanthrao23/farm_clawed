/**
 * ROI Calculator - Farm Return on Investment
 *
 * Calculates water savings, time savings, avoided losses, and payback period.
 */

import { z } from "zod";

// ROI metrics
export const RoiMetricsSchema = z.object({
  period: z.string().describe("Tracking period (e.g., '2025-01')"),
  waterSavedGallons: z.number().nonnegative(),
  waterSavedDollars: z.number().nonnegative(),
  timeSavedHours: z.number().nonnegative(),
  timeSavedDollars: z.number().nonnegative(),
  avoidedLossDollars: z.number().nonnegative(),
  inputSavingsDollars: z.number().nonnegative(),
  harvestValueDollars: z.number().nonnegative(),
  totalBenefitDollars: z.number().nonnegative(),
  costsDollars: z.number().nonnegative(),
  netBenefitDollars: z.number().nonnegative(),
});

export type RoiMetrics = z.infer<typeof RoiMetricsSchema>;

// ROI snapshot for a period
export const RoiSnapshotSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  metrics: RoiMetricsSchema,
  notes: z.string().optional(),
  automationLevel: z.number().optional(),
  permacultureDepth: z.number().optional(),
});

export type RoiSnapshot = z.infer<typeof RoiSnapshotSchema>;

// ROI inputs for calculation
export interface RoiCalculationInputs {
  // Water
  baselineWaterGallons: number;
  actualWaterGallons: number;
  waterCostPerGallon: number;

  // Time
  baselineHoursPerWeek: number;
  actualHoursPerWeek: number;
  hourlyValue: number;
  periodWeeks: number;

  // Avoided loss
  plantValue: number;
  lossRiskBaseline: number;
  lossRiskWithMonitoring: number;

  // Input savings
  baselineInputsCost: number;
  actualInputsCost: number;

  // Harvest
  harvestValue: number;

  // Costs
  equipmentCost: number;
  subscriptionCost: number;
  apiCost: number;
}

// Cumulative ROI tracking
export interface CumulativeRoi {
  totalWaterSavedGallons: number;
  totalWaterSavedDollars: number;
  totalTimeSavedHours: number;
  totalTimeSavedDollars: number;
  totalAvoidedLossDollars: number;
  totalBenefitDollars: number;
  totalCostsDollars: number;
  netRoi: number;
  paybackMonths: number | null;
  snapshots: RoiSnapshot[];
}

/**
 * Calculate ROI metrics for a period
 */
export function calculateRoiMetrics(inputs: RoiCalculationInputs, period: string): RoiMetrics {
  // Water savings
  const waterSavedGallons = Math.max(0, inputs.baselineWaterGallons - inputs.actualWaterGallons);
  const waterSavedDollars = waterSavedGallons * inputs.waterCostPerGallon;

  // Time savings
  const baselineTotalHours = inputs.baselineHoursPerWeek * inputs.periodWeeks;
  const actualTotalHours = inputs.actualHoursPerWeek * inputs.periodWeeks;
  const timeSavedHours = Math.max(0, baselineTotalHours - actualTotalHours);
  const timeSavedDollars = timeSavedHours * inputs.hourlyValue;

  // Avoided loss (expected value calculation)
  const lossRiskReduction = Math.max(0, inputs.lossRiskBaseline - inputs.lossRiskWithMonitoring);
  const avoidedLossDollars = inputs.plantValue * lossRiskReduction;

  // Input savings
  const inputSavingsDollars = Math.max(0, inputs.baselineInputsCost - inputs.actualInputsCost);

  // Harvest value
  const harvestValueDollars = inputs.harvestValue;

  // Total benefits
  const totalBenefitDollars =
    waterSavedDollars +
    timeSavedDollars +
    avoidedLossDollars +
    inputSavingsDollars +
    harvestValueDollars;

  // Costs for period
  const costsDollars = inputs.subscriptionCost + inputs.apiCost;

  // Net benefit (equipment cost amortized separately)
  const netBenefitDollars = totalBenefitDollars - costsDollars;

  return {
    period,
    waterSavedGallons,
    waterSavedDollars,
    timeSavedHours,
    timeSavedDollars,
    avoidedLossDollars,
    inputSavingsDollars,
    harvestValueDollars,
    totalBenefitDollars,
    costsDollars,
    netBenefitDollars,
  };
}

/**
 * Create ROI snapshot
 */
export function createRoiSnapshot(params: {
  periodStart: string;
  periodEnd: string;
  metrics: RoiMetrics;
  notes?: string;
  automationLevel?: number;
  permacultureDepth?: number;
}): RoiSnapshot {
  return {
    id: `roi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    metrics: params.metrics,
    notes: params.notes,
    automationLevel: params.automationLevel,
    permacultureDepth: params.permacultureDepth,
  };
}

/**
 * Calculate cumulative ROI from snapshots
 */
export function calculateCumulativeRoi(
  snapshots: RoiSnapshot[],
  totalEquipmentCost: number,
): CumulativeRoi {
  let totalWaterSavedGallons = 0;
  let totalWaterSavedDollars = 0;
  let totalTimeSavedHours = 0;
  let totalTimeSavedDollars = 0;
  let totalAvoidedLossDollars = 0;
  let totalBenefitDollars = 0;
  let totalCostsDollars = totalEquipmentCost; // Include initial equipment

  for (const snapshot of snapshots) {
    totalWaterSavedGallons += snapshot.metrics.waterSavedGallons;
    totalWaterSavedDollars += snapshot.metrics.waterSavedDollars;
    totalTimeSavedHours += snapshot.metrics.timeSavedHours;
    totalTimeSavedDollars += snapshot.metrics.timeSavedDollars;
    totalAvoidedLossDollars += snapshot.metrics.avoidedLossDollars;
    totalBenefitDollars += snapshot.metrics.totalBenefitDollars;
    totalCostsDollars += snapshot.metrics.costsDollars;
  }

  const netRoi = totalBenefitDollars - totalCostsDollars;

  // Calculate payback period
  let paybackMonths: number | null = null;
  if (snapshots.length > 0 && totalBenefitDollars > 0) {
    const avgMonthlyBenefit = totalBenefitDollars / snapshots.length;
    if (avgMonthlyBenefit > 0) {
      paybackMonths = totalEquipmentCost / avgMonthlyBenefit;
    }
  }

  return {
    totalWaterSavedGallons,
    totalWaterSavedDollars,
    totalTimeSavedHours,
    totalTimeSavedDollars,
    totalAvoidedLossDollars,
    totalBenefitDollars,
    totalCostsDollars,
    netRoi,
    paybackMonths,
    snapshots,
  };
}

/**
 * Format ROI metrics for display
 */
export function formatRoiMetrics(metrics: RoiMetrics): string {
  const lines: string[] = [];

  lines.push(`ROI REPORT - ${metrics.period}`);
  lines.push("========================");
  lines.push("");
  lines.push("SAVINGS:");
  lines.push(
    `  Water: ${metrics.waterSavedGallons.toFixed(1)} gal ($${metrics.waterSavedDollars.toFixed(2)})`,
  );
  lines.push(
    `  Time: ${metrics.timeSavedHours.toFixed(1)} hrs ($${metrics.timeSavedDollars.toFixed(2)})`,
  );
  lines.push(`  Avoided Loss: $${metrics.avoidedLossDollars.toFixed(2)}`);
  lines.push(`  Input Savings: $${metrics.inputSavingsDollars.toFixed(2)}`);
  lines.push(`  Harvest Value: $${metrics.harvestValueDollars.toFixed(2)}`);
  lines.push("");
  lines.push(`TOTAL BENEFIT: $${metrics.totalBenefitDollars.toFixed(2)}`);
  lines.push(`COSTS: $${metrics.costsDollars.toFixed(2)}`);
  lines.push(`NET BENEFIT: $${metrics.netBenefitDollars.toFixed(2)}`);

  return lines.join("\n");
}

/**
 * Format cumulative ROI for display
 */
export function formatCumulativeRoi(roi: CumulativeRoi): string {
  const lines: string[] = [];

  lines.push("CUMULATIVE ROI SUMMARY");
  lines.push("======================");
  lines.push(`Tracking periods: ${roi.snapshots.length}`);
  lines.push("");
  lines.push("TOTAL SAVINGS:");
  lines.push(
    `  Water: ${roi.totalWaterSavedGallons.toFixed(0)} gallons ($${roi.totalWaterSavedDollars.toFixed(2)})`,
  );
  lines.push(
    `  Time: ${roi.totalTimeSavedHours.toFixed(1)} hours ($${roi.totalTimeSavedDollars.toFixed(2)})`,
  );
  lines.push(`  Avoided Losses: $${roi.totalAvoidedLossDollars.toFixed(2)}`);
  lines.push("");
  lines.push(`TOTAL BENEFITS: $${roi.totalBenefitDollars.toFixed(2)}`);
  lines.push(`TOTAL COSTS: $${roi.totalCostsDollars.toFixed(2)}`);
  lines.push(`NET ROI: $${roi.netRoi.toFixed(2)}`);

  if (roi.paybackMonths !== null) {
    if (roi.paybackMonths <= 0) {
      lines.push(`PAYBACK: Already achieved!`);
    } else {
      lines.push(`PAYBACK: ~${roi.paybackMonths.toFixed(1)} months`);
    }
  }

  return lines.join("\n");
}

/**
 * Generate ROI projection
 */
export function projectRoi(params: {
  monthlyBenefit: number;
  monthlyCost: number;
  initialEquipmentCost: number;
  months: number;
}): Array<{ month: number; cumulativeBenefit: number; cumulativeCost: number; netRoi: number }> {
  const projection = [];

  for (let month = 1; month <= params.months; month++) {
    const cumulativeBenefit = params.monthlyBenefit * month;
    const cumulativeCost = params.initialEquipmentCost + params.monthlyCost * month;
    const netRoi = cumulativeBenefit - cumulativeCost;

    projection.push({
      month,
      cumulativeBenefit,
      cumulativeCost,
      netRoi,
    });
  }

  return projection;
}
