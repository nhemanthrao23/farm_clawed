/**
 * SmartLife Scene Definitions
 *
 * Scene naming convention and management for SmartLife/Tuya devices.
 */

import { z } from "zod";

// Scene configuration
export const SceneConfigSchema = z.object({
  name: z.string().describe("Scene name in SmartLife (e.g., FARM_LEMON_WATER_1MIN)"),
  iftttEvent: z.string().describe("IFTTT webhook event name"),
  description: z.string(),
  deviceId: z.string().optional(),
  duration: z.number().optional().describe("Duration in seconds"),
  estimatedGallons: z.number().optional(),
  safetyLevel: z.union([z.literal("safe"), z.literal("moderate"), z.literal("requires_approval")]).default("moderate"),
});

export type SceneConfig = z.infer<typeof SceneConfigSchema>;

// Scene prefix for farm_clawed
export const SCENE_PREFIX = "FARM_";

// Default scenes for common operations
export const DEFAULT_SCENES: SceneConfig[] = [
  // Watering scenes
  {
    name: "FARM_ZONE1_WATER_1MIN",
    iftttEvent: "farm_zone1_water_1min",
    description: "Water zone 1 for 1 minute",
    duration: 60,
    estimatedGallons: 0.5,
    safetyLevel: "safe",
  },
  {
    name: "FARM_ZONE1_WATER_2MIN",
    iftttEvent: "farm_zone1_water_2min",
    description: "Water zone 1 for 2 minutes",
    duration: 120,
    estimatedGallons: 1.0,
    safetyLevel: "safe",
  },
  {
    name: "FARM_ZONE1_WATER_5MIN",
    iftttEvent: "farm_zone1_water_5min",
    description: "Water zone 1 for 5 minutes (deep water)",
    duration: 300,
    estimatedGallons: 2.5,
    safetyLevel: "moderate",
  },
  {
    name: "FARM_ZONE1_WATER_10MIN",
    iftttEvent: "farm_zone1_water_10min",
    description: "Water zone 1 for 10 minutes (deep soak)",
    duration: 600,
    estimatedGallons: 5.0,
    safetyLevel: "requires_approval",
  },

  // Emergency scenes
  {
    name: "FARM_ZONE1_STOP",
    iftttEvent: "farm_zone1_stop",
    description: "Emergency stop zone 1",
    safetyLevel: "safe",
  },
  {
    name: "FARM_ALL_OFF",
    iftttEvent: "farm_all_off",
    description: "Emergency stop all zones",
    safetyLevel: "safe",
  },
];

// Scene naming convention
export interface SceneNamingConvention {
  prefix: string;
  zone: string;
  action: string;
  duration?: string;
}

/**
 * Parse scene name into components
 */
export function parseSceneName(name: string): SceneNamingConvention | null {
  const match = name.match(/^(FARM)_([A-Z0-9]+)_([A-Z]+)(?:_(\d+MIN|\d+SEC))?$/);
  if (!match) return null;

  return {
    prefix: match[1],
    zone: match[2],
    action: match[3],
    duration: match[4],
  };
}

/**
 * Build scene name from components
 */
export function buildSceneName(parts: SceneNamingConvention): string {
  let name = `${parts.prefix}_${parts.zone}_${parts.action}`;
  if (parts.duration) {
    name += `_${parts.duration}`;
  }
  return name;
}

/**
 * Get scene by name
 */
export function getScene(scenes: SceneConfig[], name: string): SceneConfig | undefined {
  return scenes.find((s) => s.name === name || s.iftttEvent === name);
}

/**
 * Get scenes for a zone
 */
export function getScenesForZone(scenes: SceneConfig[], zoneName: string): SceneConfig[] {
  return scenes.filter((s) => {
    const parsed = parseSceneName(s.name);
    return parsed && parsed.zone.toLowerCase() === zoneName.toLowerCase();
  });
}

/**
 * Get watering scenes sorted by duration
 */
export function getWateringScenesOrdered(scenes: SceneConfig[]): SceneConfig[] {
  return scenes
    .filter((s) => s.name.includes("WATER"))
    .sort((a, b) => (a.duration || 0) - (b.duration || 0));
}

/**
 * Validate scene name follows convention
 */
export function validateSceneName(name: string): { valid: boolean; error?: string } {
  if (!name.startsWith(SCENE_PREFIX)) {
    return { valid: false, error: `Scene name must start with ${SCENE_PREFIX}` };
  }

  const parsed = parseSceneName(name);
  if (!parsed) {
    return { valid: false, error: "Scene name does not match expected pattern: FARM_ZONE_ACTION[_DURATION]" };
  }

  return { valid: true };
}

/**
 * Generate scene config template
 */
export function generateSceneTemplate(zoneName: string, actionType: "water" | "stop"): SceneConfig[] {
  if (actionType === "stop") {
    return [
      {
        name: `FARM_${zoneName.toUpperCase()}_STOP`,
        iftttEvent: `farm_${zoneName.toLowerCase()}_stop`,
        description: `Emergency stop ${zoneName}`,
        safetyLevel: "safe",
      },
    ];
  }

  return [
    {
      name: `FARM_${zoneName.toUpperCase()}_WATER_1MIN`,
      iftttEvent: `farm_${zoneName.toLowerCase()}_water_1min`,
      description: `Water ${zoneName} for 1 minute`,
      duration: 60,
      estimatedGallons: 0.5,
      safetyLevel: "safe",
    },
    {
      name: `FARM_${zoneName.toUpperCase()}_WATER_2MIN`,
      iftttEvent: `farm_${zoneName.toLowerCase()}_water_2min`,
      description: `Water ${zoneName} for 2 minutes`,
      duration: 120,
      estimatedGallons: 1.0,
      safetyLevel: "safe",
    },
    {
      name: `FARM_${zoneName.toUpperCase()}_WATER_5MIN`,
      iftttEvent: `farm_${zoneName.toLowerCase()}_water_5min`,
      description: `Water ${zoneName} for 5 minutes`,
      duration: 300,
      estimatedGallons: 2.5,
      safetyLevel: "moderate",
    },
  ];
}

/**
 * Format scene list for display
 */
export function formatSceneList(scenes: SceneConfig[]): string {
  const lines: string[] = [];
  lines.push("AVAILABLE SCENES");
  lines.push("================");

  for (const scene of scenes) {
    lines.push(`\n${scene.name}`);
    lines.push(`  IFTTT Event: ${scene.iftttEvent}`);
    lines.push(`  Description: ${scene.description}`);
    if (scene.duration) {
      lines.push(`  Duration: ${scene.duration}s`);
    }
    if (scene.estimatedGallons) {
      lines.push(`  Est. Gallons: ${scene.estimatedGallons}`);
    }
    lines.push(`  Safety: ${scene.safetyLevel}`);
  }

  return lines.join("\n");
}

