/**
 * Farm Profile Schema
 *
 * Defines the basic farm information, location, climate, and constraints.
 */

import { z } from "zod";

export const FarmLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevation_m: z.number().optional(),
  timezone: z.string().optional(),
});

export const FarmClimateSchema = z.object({
  zone: z.string().describe("USDA hardiness zone (e.g., '9b')"),
  avg_rainfall_mm: z.number().nonnegative().optional(),
  frost_free_days: z.number().int().nonnegative().optional(),
  last_frost: z.string().optional().describe("ISO date or MM-DD format"),
  first_frost: z.string().optional().describe("ISO date or MM-DD format"),
});

export const FarmConstraintsSchema = z.object({
  water_source: z
    .union([
      z.literal("municipal"),
      z.literal("well"),
      z.literal("rainwater"),
      z.literal("pond"),
      z.literal("stream"),
      z.literal("other"),
    ])
    .optional(),
  water_cost_per_gallon: z.number().nonnegative().optional(),
  max_daily_gallons: z.number().nonnegative().optional(),
  power_available: z.boolean().optional(),
  internet_available: z.boolean().optional(),
});

export const FarmScaleSchema = z.object({
  type: z.union([
    z.literal("container"),
    z.literal("garden"),
    z.literal("small_farm"),
    z.literal("orchard"),
    z.literal("ranch"),
    z.literal("commercial"),
  ]),
  area_sqft: z.number().nonnegative().optional(),
  plant_count: z.number().int().nonnegative().optional(),
});

export const FarmOwnerSchema = z.object({
  name: z.string().optional(),
  experience_years: z.number().int().nonnegative().optional(),
  goals: z.array(z.string()).optional(),
});

export const FarmProfileSchema = z.object({
  name: z.string(),
  location: FarmLocationSchema,
  climate: FarmClimateSchema.optional(),
  constraints: FarmConstraintsSchema.optional(),
  scale: FarmScaleSchema.optional(),
  owner: FarmOwnerSchema.optional(),
});

export type FarmLocation = z.infer<typeof FarmLocationSchema>;
export type FarmClimate = z.infer<typeof FarmClimateSchema>;
export type FarmConstraints = z.infer<typeof FarmConstraintsSchema>;
export type FarmScale = z.infer<typeof FarmScaleSchema>;
export type FarmOwner = z.infer<typeof FarmOwnerSchema>;
export type FarmProfile = z.infer<typeof FarmProfileSchema>;

/**
 * Validate a farm profile object
 */
export function validateFarmProfile(
  data: unknown,
): { ok: true; data: FarmProfile } | { ok: false; errors: string[] } {
  const result = FarmProfileSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}
