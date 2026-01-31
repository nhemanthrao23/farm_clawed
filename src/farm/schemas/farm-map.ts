/**
 * Farm Map Schema
 *
 * GeoJSON-based farm layout with areas, fields, and zones.
 */

import { z } from "zod";

// GeoJSON coordinate schemas
const PositionSchema = z
  .tuple([z.number(), z.number()])
  .or(z.tuple([z.number(), z.number(), z.number()]));

const PointGeometrySchema = z.object({
  type: z.literal("Point"),
  coordinates: PositionSchema,
});

const PolygonGeometrySchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(PositionSchema)),
});

const MultiPolygonGeometrySchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(z.array(PositionSchema))),
});

const GeometrySchema = z.union([
  PointGeometrySchema,
  PolygonGeometrySchema,
  MultiPolygonGeometrySchema,
]);

// Farm area properties
export const FarmAreaPropertiesSchema = z.object({
  id: z.string(),
  name: z.string(),
  area_type: z
    .union([
      z.literal("container"),
      z.literal("bed"),
      z.literal("field"),
      z.literal("block"),
      z.literal("zone"),
      z.literal("orchard"),
      z.literal("pasture"),
      z.literal("structure"),
      z.literal("water_feature"),
      z.literal("other"),
    ])
    .optional(),
  area_sqft: z.number().nonnegative().optional(),
  crop: z.string().optional(),
  crops: z.array(z.string()).optional(),
  planted_date: z.string().optional(),
  irrigation_zone: z.string().optional(),
  permaculture_zone: z.number().int().min(0).max(5).optional(),
  notes: z.string().optional(),
});

export const FarmAreaFeatureSchema = z.object({
  type: z.literal("Feature"),
  properties: FarmAreaPropertiesSchema,
  geometry: GeometrySchema,
});

export const FarmMapSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(FarmAreaFeatureSchema),
});

export type FarmAreaProperties = z.infer<typeof FarmAreaPropertiesSchema>;
export type FarmAreaFeature = z.infer<typeof FarmAreaFeatureSchema>;
export type FarmMap = z.infer<typeof FarmMapSchema>;

/**
 * Validate a farm map GeoJSON
 */
export function validateFarmMap(
  data: unknown,
): { ok: true; data: FarmMap } | { ok: false; errors: string[] } {
  const result = FarmMapSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Get all area IDs from a farm map
 */
export function getFarmAreaIds(map: FarmMap): string[] {
  return map.features.map((f) => f.properties.id);
}

/**
 * Get areas by type
 */
export function getAreasByType(
  map: FarmMap,
  type: FarmAreaProperties["area_type"],
): FarmAreaFeature[] {
  return map.features.filter((f) => f.properties.area_type === type);
}
