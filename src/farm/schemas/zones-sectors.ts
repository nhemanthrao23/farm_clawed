/**
 * Zones and Sectors Schema
 *
 * Permaculture zone boundaries and sector analysis.
 */

import { z } from "zod";

// GeoJSON coordinate schemas (shared with farm-map)
const PositionSchema = z
  .tuple([z.number(), z.number()])
  .or(z.tuple([z.number(), z.number(), z.number()]));

const PolygonGeometrySchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(PositionSchema)),
});

// Zone definitions (0-5 in permaculture)
export const ZonePropertiesSchema = z.object({
  zone: z.number().int().min(0).max(5),
  name: z.string(),
  description: z.string().optional(),
  visit_frequency: z
    .union([
      z.literal("multiple_daily"),
      z.literal("daily"),
      z.literal("few_times_week"),
      z.literal("weekly"),
      z.literal("monthly"),
      z.literal("rarely"),
    ])
    .optional(),
  intensity: z
    .union([
      z.literal("intensive"),
      z.literal("moderate"),
      z.literal("extensive"),
      z.literal("wild"),
    ])
    .optional(),
});

export const ZoneFeatureSchema = z.object({
  type: z.literal("Feature"),
  properties: ZonePropertiesSchema,
  geometry: PolygonGeometrySchema,
});

export const ZonesGeoJsonSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(ZoneFeatureSchema),
});

// Sector analysis
export const SunSectorSchema = z.object({
  summer_sunrise_azimuth: z.number().min(0).max(360).optional(),
  summer_sunset_azimuth: z.number().min(0).max(360).optional(),
  winter_sunrise_azimuth: z.number().min(0).max(360).optional(),
  winter_sunset_azimuth: z.number().min(0).max(360).optional(),
  shade_sources: z
    .array(
      z.object({
        name: z.string(),
        azimuth: z.number().min(0).max(360),
        shade_hours_summer: z.number().optional(),
        shade_hours_winter: z.number().optional(),
      }),
    )
    .optional(),
});

export const WindSectorSchema = z.object({
  prevailing_direction: z.number().min(0).max(360).optional(),
  storm_direction: z.number().min(0).max(360).optional(),
  wind_breaks: z
    .array(
      z.object({
        name: z.string(),
        azimuth_range: z.tuple([z.number(), z.number()]),
        effectiveness: z.number().min(0).max(1),
      }),
    )
    .optional(),
});

export const WaterSectorSchema = z.object({
  slope_direction: z.number().min(0).max(360).optional(),
  slope_percent: z.number().optional(),
  drainage_issues: z.array(z.string()).optional(),
  water_sources_direction: z.number().min(0).max(360).optional(),
});

export const FireSectorSchema = z.object({
  risk_direction: z.number().min(0).max(360).optional(),
  risk_level: z
    .union([z.literal("low"), z.literal("moderate"), z.literal("high"), z.literal("extreme")])
    .optional(),
  defensible_space_ft: z.number().optional(),
});

export const SectorsSchema = z.object({
  sun: SunSectorSchema.optional(),
  wind: WindSectorSchema.optional(),
  water: WaterSectorSchema.optional(),
  fire: FireSectorSchema.optional(),
  custom: z
    .array(
      z.object({
        name: z.string(),
        direction: z.number().min(0).max(360),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

export type ZoneProperties = z.infer<typeof ZonePropertiesSchema>;
export type ZoneFeature = z.infer<typeof ZoneFeatureSchema>;
export type ZonesGeoJson = z.infer<typeof ZonesGeoJsonSchema>;
export type ZoneDefinition = ZoneFeature;

export type SunSector = z.infer<typeof SunSectorSchema>;
export type WindSector = z.infer<typeof WindSectorSchema>;
export type WaterSector = z.infer<typeof WaterSectorSchema>;
export type FireSector = z.infer<typeof FireSectorSchema>;
export type SectorDefinition = z.infer<typeof SectorsSchema>;

/**
 * Validate zones GeoJSON
 */
export function validateZones(
  data: unknown,
): { ok: true; data: ZonesGeoJson } | { ok: false; errors: string[] } {
  const result = ZonesGeoJsonSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Validate sectors
 */
export function validateSectors(
  data: unknown,
): { ok: true; data: SectorDefinition } | { ok: false; errors: string[] } {
  const result = SectorsSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Get zone by number
 */
export function getZoneByNumber(zones: ZonesGeoJson, zoneNumber: number): ZoneFeature | null {
  return zones.features.find((f) => f.properties.zone === zoneNumber) || null;
}

/**
 * Zone descriptions for UI
 */
export const ZONE_DESCRIPTIONS: Record<number, string> = {
  0: "House - The center of activity, kitchen, living space",
  1: "Intensive Garden - Daily visits, herbs, salad greens, frequently harvested crops",
  2: "Food Forest - Regular visits, perennials, orchards, main food production",
  3: "Farm Zone - Occasional visits, field crops, large livestock",
  4: "Managed Wild - Minimal intervention, timber, foraging, wild foods",
  5: "Wilderness - No intervention, wildlife habitat, natural systems",
};
