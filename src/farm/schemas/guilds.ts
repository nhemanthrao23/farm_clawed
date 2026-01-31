/**
 * Guilds Schema
 *
 * Plant guild definitions for polyculture plantings.
 */

import { z } from "zod";

export const GuildLayerSchema = z
  .union([
    z.literal("canopy"),
    z.literal("understory"),
    z.literal("shrub"),
    z.literal("herbaceous"),
    z.literal("ground_cover"),
    z.literal("vine"),
    z.literal("root"),
  ])
  .describe("Forest garden layers");

export const GuildFunctionSchema = z.union([
  z.literal("nitrogen_fixer"),
  z.literal("dynamic_accumulator"),
  z.literal("pest_repellent"),
  z.literal("pollinator_attractor"),
  z.literal("beneficial_insect_habitat"),
  z.literal("mulch_producer"),
  z.literal("living_mulch"),
  z.literal("windbreak"),
  z.literal("erosion_control"),
  z.literal("food_producer"),
  z.literal("medicine"),
  z.literal("fiber"),
  z.literal("fuel"),
  z.literal("other"),
]);

export const GuildPlantSchema = z.object({
  name: z.string(),
  scientific_name: z.string().optional(),
  layer: GuildLayerSchema.optional(),
  functions: z.array(GuildFunctionSchema).optional(),
  spacing_from_anchor_ft: z.number().optional(),
  notes: z.string().optional(),
});

export const GuildDefinitionSchema = z.object({
  name: z.string(),
  anchor: z.string().describe("Main tree or plant the guild is built around"),
  description: z.string().optional(),
  layers: z
    .object({
      canopy: z.string().nullable().optional(),
      understory: z.string().nullable().optional(),
      shrub: z
        .union([z.string(), z.array(z.string())])
        .nullable()
        .optional(),
      herbaceous: z
        .union([z.string(), z.array(z.string())])
        .nullable()
        .optional(),
      ground_cover: z
        .union([z.string(), z.array(z.string())])
        .nullable()
        .optional(),
      vine: z.string().nullable().optional(),
      root: z
        .union([z.string(), z.array(z.string())])
        .nullable()
        .optional(),
    })
    .optional(),
  plants: z.array(GuildPlantSchema).optional(),
  functions: z
    .object({
      nitrogen_fixers: z.array(z.string()).optional(),
      dynamic_accumulators: z.array(z.string()).optional(),
      pest_repellent: z.array(z.string()).optional(),
      pollinator_attractors: z.array(z.string()).optional(),
      mulch_producers: z.array(z.string()).optional(),
    })
    .optional(),
  spacing: z.record(z.string(), z.number()).optional(),
  notes: z.string().optional(),
});

export const GuildsListSchema = z.object({
  guilds: z.array(GuildDefinitionSchema),
});

export type GuildLayer = z.infer<typeof GuildLayerSchema>;
export type GuildFunction = z.infer<typeof GuildFunctionSchema>;
export type GuildPlant = z.infer<typeof GuildPlantSchema>;
export type GuildDefinition = z.infer<typeof GuildDefinitionSchema>;
export type GuildsList = z.infer<typeof GuildsListSchema>;

/**
 * Validate guilds list
 */
export function validateGuilds(
  data: unknown,
): { ok: true; data: GuildsList } | { ok: false; errors: string[] } {
  const result = GuildsListSchema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

/**
 * Get plants by function in a guild
 */
export function getPlantsByFunction(
  guild: GuildDefinition,
  func: keyof GuildDefinition["functions"],
): string[] {
  return guild.functions?.[func] || [];
}

/**
 * Common guild templates
 */
export const GUILD_TEMPLATES: Record<string, Partial<GuildDefinition>> = {
  "apple-guild": {
    name: "Apple Guild",
    anchor: "Apple Tree",
    layers: {
      canopy: "Apple Tree",
      understory: null,
      shrub: ["Gooseberry", "Currant"],
      herbaceous: ["Comfrey", "Yarrow", "Bee Balm", "Fennel"],
      ground_cover: ["White Clover", "Strawberry"],
      vine: null,
      root: ["Garlic", "Daffodil"],
    },
    functions: {
      nitrogen_fixers: ["White Clover"],
      dynamic_accumulators: ["Comfrey", "Yarrow"],
      pest_repellent: ["Garlic", "Daffodil", "Fennel"],
      pollinator_attractors: ["Bee Balm", "Yarrow"],
      mulch_producers: ["Comfrey"],
    },
  },
  "citrus-guild": {
    name: "Citrus Guild",
    anchor: "Citrus Tree",
    layers: {
      canopy: "Citrus Tree",
      understory: null,
      shrub: "Rosemary",
      herbaceous: ["Comfrey", "Yarrow", "Nasturtium"],
      ground_cover: "White Clover",
      vine: null,
      root: "Garlic",
    },
    functions: {
      nitrogen_fixers: ["White Clover"],
      dynamic_accumulators: ["Comfrey", "Yarrow"],
      pest_repellent: ["Rosemary", "Garlic", "Nasturtium"],
      pollinator_attractors: ["Rosemary", "Yarrow"],
      mulch_producers: ["Comfrey"],
    },
  },
};
