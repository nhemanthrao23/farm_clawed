/**
 * Succession Plan Schema
 *
 * Multi-year succession planning for permaculture systems.
 */

import { z } from "zod";

export const SuccessionActionSchema = z.object({
  action: z.string(),
  timing: z.string().optional().describe("When to perform (e.g., 'March', 'Week 1-2')"),
  priority: z.union([z.literal("high"), z.literal("medium"), z.literal("low")]).optional(),
  notes: z.string().optional(),
});

export const SuccessionCriteriaSchema = z.object({
  metric: z.string(),
  target: z.string().optional(),
  measurement_method: z.string().optional(),
});

export const SuccessionStageSchema = z.object({
  year: z.number().int().positive(),
  name: z.string(),
  focus: z.string().optional(),
  actions: z.array(z.union([z.string(), SuccessionActionSchema])),
  success_criteria: z.array(z.union([z.string(), SuccessionCriteriaSchema])).optional(),
  notes: z.string().optional(),
});

export const SuccessionEvaluationSchema = z.object({
  frequency: z
    .union([z.literal("monthly"), z.literal("quarterly"), z.literal("annually")])
    .default("quarterly"),
  metrics: z.array(z.string()).optional(),
  review_dates: z.array(z.string()).optional(),
});

export const SuccessionPlanSchema = z.object({
  start_year: z.number().int(),
  planning_horizon_years: z.number().int().positive().default(5),
  description: z.string().optional(),
  goals: z.array(z.string()).optional(),
  stages: z.array(SuccessionStageSchema),
  evaluation: SuccessionEvaluationSchema.optional(),
  notes: z.string().optional(),
});

export type SuccessionAction = z.infer<typeof SuccessionActionSchema>;
export type SuccessionCriteria = z.infer<typeof SuccessionCriteriaSchema>;
export type SuccessionStage = z.infer<typeof SuccessionStageSchema>;
export type SuccessionEvaluation = z.infer<typeof SuccessionEvaluationSchema>;
export type SuccessionPlan = z.infer<typeof SuccessionPlanSchema>;

/**
 * Validate succession plan
 */
export function validateSuccessionPlan(
  data: unknown,
): { ok: true; data: SuccessionPlan } | { ok: false; errors: string[] } {
  const result = SuccessionPlanSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Get current stage based on year
 */
export function getCurrentStage(
  plan: SuccessionPlan,
  currentYear: number = new Date().getFullYear(),
): SuccessionStage | null {
  const yearInPlan = currentYear - plan.start_year + 1;
  return plan.stages.find((s) => s.year === yearInPlan) || null;
}

/**
 * Get all actions for a stage as strings
 */
export function getStageActions(stage: SuccessionStage): string[] {
  return stage.actions.map((a) => (typeof a === "string" ? a : a.action));
}

/**
 * Get all success criteria for a stage as strings
 */
export function getStageCriteria(stage: SuccessionStage): string[] {
  return (stage.success_criteria || []).map((c) => (typeof c === "string" ? c : c.metric));
}

/**
 * Calculate plan progress percentage
 */
export function getPlanProgress(
  plan: SuccessionPlan,
  currentYear: number = new Date().getFullYear(),
): number {
  const yearsElapsed = currentYear - plan.start_year;
  const progress = (yearsElapsed / plan.planning_horizon_years) * 100;
  return Math.min(100, Math.max(0, progress));
}
