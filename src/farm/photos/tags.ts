/**
 * Photo Tags - User-Defined Tagging System
 *
 * Tags become sources_used in AI context for evidence-based recommendations.
 */

import { z } from "zod";

// Predefined tag categories
export const TagCategorySchema = z.union([
  z.literal("growth"),
  z.literal("health"),
  z.literal("pest"),
  z.literal("disease"),
  z.literal("water"),
  z.literal("soil"),
  z.literal("harvest"),
  z.literal("weather"),
  z.literal("infrastructure"),
  z.literal("other"),
]);

export type TagCategory = z.infer<typeof TagCategorySchema>;

// Photo tag
export const PhotoTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: TagCategorySchema,
  description: z.string().optional(),
  color: z.string().optional(),
  usageCount: z.number().default(0),
  createdAt: z.string(),
});

export type PhotoTag = z.infer<typeof PhotoTagSchema>;

// Photo metadata with tags
export const PhotoMetadataSchema = z.object({
  id: z.string(),
  filename: z.string(),
  capturedAt: z.string(),
  uploadedAt: z.string(),
  plantId: z.string().optional(),
  areaId: z.string().optional(),
  tags: z.array(z.string()),
  notes: z.string().optional(),
  aiAnalyzed: z.boolean().default(false),
  aiAnalysis: z.string().optional(),
});

export type PhotoMetadata = z.infer<typeof PhotoMetadataSchema>;

// Predefined tags for common observations
export const PREDEFINED_TAGS: Omit<PhotoTag, "id" | "usageCount" | "createdAt">[] = [
  // Growth
  {
    name: "new-growth",
    category: "growth",
    description: "New leaves, shoots, or buds",
    color: "#4ade80",
  },
  {
    name: "flowering",
    category: "growth",
    description: "Flowers or buds forming",
    color: "#f472b6",
  },
  { name: "fruiting", category: "growth", description: "Fruit developing", color: "#fb923c" },
  { name: "dormant", category: "growth", description: "Plant in dormancy", color: "#9ca3af" },

  // Health
  { name: "healthy", category: "health", description: "Plant looks healthy", color: "#22c55e" },
  { name: "yellowing", category: "health", description: "Leaves turning yellow", color: "#eab308" },
  { name: "wilting", category: "health", description: "Plant wilting", color: "#ef4444" },
  { name: "leaf-drop", category: "health", description: "Leaves falling", color: "#f97316" },
  { name: "stunted", category: "health", description: "Growth appears stunted", color: "#dc2626" },

  // Pests
  { name: "pest-aphids", category: "pest", description: "Aphids visible", color: "#84cc16" },
  { name: "pest-scale", category: "pest", description: "Scale insects visible", color: "#a3a3a3" },
  {
    name: "pest-mites",
    category: "pest",
    description: "Spider mites or webbing",
    color: "#fbbf24",
  },
  {
    name: "pest-caterpillar",
    category: "pest",
    description: "Caterpillars or damage",
    color: "#10b981",
  },
  {
    name: "pest-unknown",
    category: "pest",
    description: "Unknown pest observed",
    color: "#f43f5e",
  },

  // Disease
  {
    name: "disease-fungal",
    category: "disease",
    description: "Fungal infection signs",
    color: "#7c3aed",
  },
  {
    name: "disease-bacterial",
    category: "disease",
    description: "Bacterial infection signs",
    color: "#db2777",
  },
  {
    name: "disease-viral",
    category: "disease",
    description: "Viral infection signs",
    color: "#e11d48",
  },
  {
    name: "disease-unknown",
    category: "disease",
    description: "Unknown disease symptoms",
    color: "#be123c",
  },

  // Water
  { name: "soil-dry", category: "water", description: "Soil appears dry", color: "#d97706" },
  { name: "soil-wet", category: "water", description: "Soil appears wet", color: "#0ea5e9" },
  {
    name: "overwatered",
    category: "water",
    description: "Signs of overwatering",
    color: "#3b82f6",
  },
  {
    name: "underwatered",
    category: "water",
    description: "Signs of underwatering",
    color: "#f59e0b",
  },

  // Soil
  { name: "mulch-fresh", category: "soil", description: "Fresh mulch applied", color: "#a16207" },
  {
    name: "mulch-decomposing",
    category: "soil",
    description: "Mulch breaking down",
    color: "#78350f",
  },
  { name: "compost-applied", category: "soil", description: "Compost added", color: "#713f12" },
  { name: "earthworms", category: "soil", description: "Earthworms visible", color: "#b45309" },

  // Harvest
  {
    name: "ready-to-harvest",
    category: "harvest",
    description: "Ready for picking",
    color: "#16a34a",
  },
  { name: "harvested", category: "harvest", description: "Post-harvest photo", color: "#15803d" },

  // Weather
  {
    name: "frost-damage",
    category: "weather",
    description: "Frost damage visible",
    color: "#60a5fa",
  },
  {
    name: "heat-stress",
    category: "weather",
    description: "Heat stress symptoms",
    color: "#ef4444",
  },
  { name: "wind-damage", category: "weather", description: "Wind damage", color: "#6b7280" },
];

/**
 * Create a new tag
 */
export function createTag(params: {
  name: string;
  category: TagCategory;
  description?: string;
  color?: string;
}): PhotoTag {
  return {
    id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: params.name.toLowerCase().replace(/\s+/g, "-"),
    category: params.category,
    description: params.description,
    color: params.color,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create photo metadata
 */
export function createPhotoMetadata(params: {
  filename: string;
  capturedAt?: string;
  plantId?: string;
  areaId?: string;
  tags?: string[];
  notes?: string;
}): PhotoMetadata {
  return {
    id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    filename: params.filename,
    capturedAt: params.capturedAt || new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
    plantId: params.plantId,
    areaId: params.areaId,
    tags: params.tags || [],
    notes: params.notes,
    aiAnalyzed: false,
  };
}

/**
 * Add tags to photo
 */
export function addTagsToPhoto(photo: PhotoMetadata, tags: string[]): PhotoMetadata {
  const existingTags = new Set(photo.tags);
  for (const tag of tags) {
    existingTags.add(tag.toLowerCase());
  }
  return {
    ...photo,
    tags: [...existingTags],
  };
}

/**
 * Remove tags from photo
 */
export function removeTagsFromPhoto(photo: PhotoMetadata, tags: string[]): PhotoMetadata {
  const tagsToRemove = new Set(tags.map((t) => t.toLowerCase()));
  return {
    ...photo,
    tags: photo.tags.filter((t) => !tagsToRemove.has(t)),
  };
}

/**
 * Get tags as sources_used for AI context
 */
export function tagsToSourcesUsed(tags: string[], photoId: string): string[] {
  return tags.map((tag) => `photo:${photoId}:${tag}`);
}

/**
 * Filter photos by tags
 */
export function filterPhotosByTags(
  photos: PhotoMetadata[],
  requiredTags: string[],
  mode: "all" | "any" = "any",
): PhotoMetadata[] {
  const normalizedRequired = requiredTags.map((t) => t.toLowerCase());

  return photos.filter((photo) => {
    if (mode === "all") {
      return normalizedRequired.every((t) => photo.tags.includes(t));
    }
    return normalizedRequired.some((t) => photo.tags.includes(t));
  });
}

/**
 * Get tag statistics
 */
export function getTagStatistics(photos: PhotoMetadata[]): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const photo of photos) {
    for (const tag of photo.tags) {
      stats[tag] = (stats[tag] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Format photo metadata for display
 */
export function formatPhotoMetadata(photo: PhotoMetadata): string {
  const lines: string[] = [];

  lines.push(`Photo: ${photo.filename}`);
  lines.push(`  ID: ${photo.id}`);
  lines.push(`  Captured: ${photo.capturedAt}`);
  if (photo.plantId) lines.push(`  Plant: ${photo.plantId}`);
  if (photo.areaId) lines.push(`  Area: ${photo.areaId}`);
  lines.push(`  Tags: ${photo.tags.length > 0 ? photo.tags.join(", ") : "(none)"}`);
  if (photo.notes) lines.push(`  Notes: ${photo.notes}`);
  if (photo.aiAnalyzed) lines.push(`  AI Analysis: ${photo.aiAnalysis || "Complete"}`);

  return lines.join("\n");
}

/**
 * Suggest tags based on notes or AI analysis
 */
export function suggestTags(text: string): string[] {
  const suggestions: string[] = [];
  const lowerText = text.toLowerCase();

  // Check for predefined tag keywords
  for (const tag of PREDEFINED_TAGS) {
    const keywords = [tag.name.replace(/-/g, " "), tag.description?.toLowerCase() || ""];
    if (keywords.some((kw) => lowerText.includes(kw))) {
      suggestions.push(tag.name);
    }
  }

  return [...new Set(suggestions)];
}
