/**
 * Water Assets Schema
 *
 * Water infrastructure inventory: sources, valves, manifolds, sensors.
 */

import { z } from "zod";

export const WaterAssetTypeSchema = z.union([
  z.literal("source"),
  z.literal("valve"),
  z.literal("manifold"),
  z.literal("sensor"),
  z.literal("pump"),
  z.literal("tank"),
  z.literal("drip_line"),
  z.literal("sprinkler"),
  z.literal("swale"),
  z.literal("other"),
]);

export const WaterAssetSchema = z.object({
  asset_id: z.string(),
  asset_type: WaterAssetTypeSchema,
  name: z.string(),
  location: z.string().optional(),
  capacity_gpm: z.number().nonnegative().optional(),
  capacity_gallons: z.number().nonnegative().optional(),
  connected_to: z.string().optional(),
  smart_enabled: z.boolean().default(false),
  device_id: z.string().optional(),
  device_platform: z
    .union([
      z.literal("tuya"),
      z.literal("smartlife"),
      z.literal("homeassistant"),
      z.literal("ifttt"),
      z.literal("other"),
    ])
    .optional(),
  notes: z.string().optional(),
});

export const WaterAssetsListSchema = z.array(WaterAssetSchema);

export type WaterAssetType = z.infer<typeof WaterAssetTypeSchema>;
export type WaterAsset = z.infer<typeof WaterAssetSchema>;
export type WaterAssetsList = z.infer<typeof WaterAssetsListSchema>;

/**
 * Validate water assets list
 */
export function validateWaterAssets(
  data: unknown,
): { ok: true; data: WaterAssetsList } | { ok: false; errors: string[] } {
  const result = WaterAssetsListSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Parse CSV water assets
 */
export function parseWaterAssetsCsv(csv: string): WaterAsset[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const assets: WaterAsset[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });

    assets.push({
      asset_id: row["asset_id"] || `asset_${i}`,
      asset_type: (row["asset_type"] as WaterAssetType) || "other",
      name: row["name"] || "",
      location: row["location"] || undefined,
      capacity_gpm: row["capacity_gpm"] ? parseFloat(row["capacity_gpm"]) : undefined,
      capacity_gallons: row["capacity_gallons"] ? parseFloat(row["capacity_gallons"]) : undefined,
      connected_to: row["connected_to"] || undefined,
      smart_enabled: row["smart_enabled"] === "true",
      device_id: row["device_id"] || undefined,
      notes: row["notes"] || undefined,
    });
  }

  return assets;
}

/**
 * Get smart-enabled assets
 */
export function getSmartAssets(assets: WaterAsset[]): WaterAsset[] {
  return assets.filter((a) => a.smart_enabled);
}

/**
 * Get assets by type
 */
export function getAssetsByType(assets: WaterAsset[], type: WaterAssetType): WaterAsset[] {
  return assets.filter((a) => a.asset_type === type);
}
