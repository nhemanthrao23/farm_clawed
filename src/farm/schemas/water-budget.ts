/**
 * Water Budget Schema
 *
 * Water allocation, drought stages, and priorities.
 */

import { z } from "zod";

export const WaterPrioritySchema = z.object({
  rank: z.number().int().positive(),
  category: z.string(),
  items: z.array(z.string()),
  min_percent: z.number().min(0).max(100),
  notes: z.string().optional(),
});

export const DroughtStageSchema = z.object({
  stage: z.number().int().min(0),
  name: z.string(),
  trigger: z.string().describe("Condition that activates this stage"),
  allocation_percent: z.number().min(0).max(100),
  actions: z.array(z.string()),
  notes: z.string().optional(),
});

export const WaterMonitoringSchema = z.object({
  check_frequency: z
    .union([z.literal("daily"), z.literal("weekly"), z.literal("monthly")])
    .default("weekly"),
  sources: z.array(z.string()).optional(),
  alert_thresholds: z
    .object({
      low_moisture_percent: z.number().optional(),
      high_moisture_percent: z.number().optional(),
      daily_usage_gallons: z.number().optional(),
    })
    .optional(),
});

export const WaterBudgetSchema = z.object({
  annual_budget_gallons: z.number().nonnegative().optional(),
  daily_budget_gallons: z.number().nonnegative().optional(),
  priorities: z.array(WaterPrioritySchema).optional(),
  drought_stages: z.array(DroughtStageSchema).optional(),
  monitoring: WaterMonitoringSchema.optional(),
  notes: z.string().optional(),
});

export type WaterPriority = z.infer<typeof WaterPrioritySchema>;
export type DroughtStage = z.infer<typeof DroughtStageSchema>;
export type WaterMonitoring = z.infer<typeof WaterMonitoringSchema>;
export type WaterBudget = z.infer<typeof WaterBudgetSchema>;

/**
 * Validate water budget
 */
export function validateWaterBudget(
  data: unknown,
): { ok: true; data: WaterBudget } | { ok: false; errors: string[] } {
  const result = WaterBudgetSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Get current drought stage
 */
export function getCurrentDroughtStage(
  budget: WaterBudget,
  stageNumber: number,
): DroughtStage | null {
  return budget.drought_stages?.find((s) => s.stage === stageNumber) || null;
}

/**
 * Get water allocation for a category at a drought stage
 */
export function getCategoryAllocation(
  budget: WaterBudget,
  category: string,
  droughtStage: number,
): number {
  const priority = budget.priorities?.find((p) => p.category === category);
  if (!priority) return 0;

  const stage = getCurrentDroughtStage(budget, droughtStage);
  const stageMultiplier = stage ? stage.allocation_percent / 100 : 1;

  return priority.min_percent * stageMultiplier;
}

/**
 * Calculate daily gallons from annual budget
 */
export function getDailyBudget(budget: WaterBudget): number {
  if (budget.daily_budget_gallons) return budget.daily_budget_gallons;
  if (budget.annual_budget_gallons) return budget.annual_budget_gallons / 365;
  return 0;
}

/**
 * Get items by priority rank
 */
export function getItemsByPriorityRank(budget: WaterBudget, rank: number): string[] {
  const priority = budget.priorities?.find((p) => p.rank === rank);
  return priority?.items || [];
}

/**
 * Default drought stage definitions
 */
export const DEFAULT_DROUGHT_STAGES: DroughtStage[] = [
  {
    stage: 0,
    name: "Normal",
    trigger: "No water restrictions",
    allocation_percent: 100,
    actions: [],
  },
  {
    stage: 1,
    name: "Watch",
    trigger: "Voluntary conservation requested",
    allocation_percent: 85,
    actions: ["Reduce ornamental watering", "Check for leaks", "Water early morning or evening"],
  },
  {
    stage: 2,
    name: "Warning",
    trigger: "Mandatory restrictions in effect",
    allocation_percent: 70,
    actions: ["Suspend new plantings", "Deep mulch all beds", "Prioritize food production"],
  },
  {
    stage: 3,
    name: "Emergency",
    trigger: "Severe water shortage",
    allocation_percent: 50,
    actions: ["Water priority plants only", "Hand water at roots", "Consider shade cloth"],
  },
];
