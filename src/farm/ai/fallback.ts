/**
 * Farm AI Fallback - Rule-Based Recommendations
 *
 * Provides deterministic recommendations when AI is unavailable.
 */

import type { SensorReading } from "../schemas/sensor-readings.js";
import type { FarmAIResponse, FarmAIContext } from "./provider.js";

// Rule-based recommendation types
export interface FallbackRule {
  id: string;
  name: string;
  condition: (context: FallbackContext) => boolean;
  recommendation: (context: FallbackContext) => string;
  priority: "low" | "medium" | "high";
  sources: string[];
}

export interface FallbackContext {
  moisture?: number;
  ec?: number;
  soilTemp?: number;
  airTemp?: number;
  lastWatered?: Date;
  currentSeason?: string;
  frostRisk?: boolean;
  permacultureDepth?: number;
}

// Built-in fallback rules
export const FALLBACK_RULES: FallbackRule[] = [
  // Watering rules
  {
    id: "water_critical_dry",
    name: "Critical Dry Alert",
    condition: (ctx) => (ctx.moisture ?? 100) < 15,
    recommendation: () =>
      "URGENT: Soil moisture critically low (<15%). Water immediately to prevent plant stress.",
    priority: "high",
    sources: ["sensor_readings.csv"],
  },
  {
    id: "water_dry",
    name: "Dry Soil Warning",
    condition: (ctx) => (ctx.moisture ?? 100) >= 15 && (ctx.moisture ?? 100) < 30,
    recommendation: (ctx) =>
      `Soil moisture is low (${ctx.moisture}%). Schedule watering within 24 hours. Water deeply to encourage root growth.`,
    priority: "medium",
    sources: ["sensor_readings.csv"],
  },
  {
    id: "water_optimal",
    name: "Optimal Moisture",
    condition: (ctx) => (ctx.moisture ?? 0) >= 30 && (ctx.moisture ?? 0) <= 60,
    recommendation: (ctx) =>
      `Soil moisture is optimal (${ctx.moisture}%). No watering needed. Next check in 24-48 hours.`,
    priority: "low",
    sources: ["sensor_readings.csv"],
  },
  {
    id: "water_too_wet",
    name: "Overwatering Warning",
    condition: (ctx) => (ctx.moisture ?? 0) > 75,
    recommendation: (ctx) =>
      `Soil moisture is high (${ctx.moisture}%). Skip watering until moisture drops below 60%. Check drainage.`,
    priority: "medium",
    sources: ["sensor_readings.csv"],
  },

  // Fertility rules
  {
    id: "ec_very_low",
    name: "Nutrient Deficiency",
    condition: (ctx) => (ctx.ec ?? 1) < 0.3,
    recommendation: (ctx) =>
      `EC is very low (${ctx.ec} mS/cm), indicating nutrient deficiency. Apply light fertilization with next watering.`,
    priority: "medium",
    sources: ["sensor_readings.csv"],
  },
  {
    id: "ec_low",
    name: "Low Fertility",
    condition: (ctx) => (ctx.ec ?? 1) >= 0.3 && (ctx.ec ?? 1) < 0.8,
    recommendation: (ctx) =>
      `EC is low (${ctx.ec} mS/cm). Consider adding compost or light fertilizer during active growth periods.`,
    priority: "low",
    sources: ["sensor_readings.csv"],
  },
  {
    id: "ec_high",
    name: "High EC Warning",
    condition: (ctx) => (ctx.ec ?? 0) > 2.5,
    recommendation: (ctx) =>
      `EC is high (${ctx.ec} mS/cm). Possible salt buildup. Flush soil with clean water before next feeding.`,
    priority: "high",
    sources: ["sensor_readings.csv"],
  },

  // Temperature rules
  {
    id: "frost_imminent",
    name: "Frost Warning",
    condition: (ctx) => (ctx.soilTemp ?? 50) < 35,
    recommendation: (ctx) =>
      `Soil temperature (${ctx.soilTemp}°F) indicates frost risk. Protect sensitive plants: cover, move containers near house, water for thermal mass.`,
    priority: "high",
    sources: ["sensor_readings.csv", "season_calendar.yaml"],
  },
  {
    id: "cold_soil",
    name: "Cold Soil",
    condition: (ctx) => (ctx.soilTemp ?? 50) >= 35 && (ctx.soilTemp ?? 50) < 50,
    recommendation: (ctx) =>
      `Soil is cold (${ctx.soilTemp}°F). Reduce watering frequency. Soil biology is slow; avoid heavy feeding until soil warms.`,
    priority: "low",
    sources: ["sensor_readings.csv"],
  },
  {
    id: "heat_stress",
    name: "Heat Stress Risk",
    condition: (ctx) => (ctx.soilTemp ?? 70) > 95,
    recommendation: (ctx) =>
      `High soil temperature (${ctx.soilTemp}°F). Increase mulch depth, water in early morning, consider shade cloth.`,
    priority: "high",
    sources: ["sensor_readings.csv"],
  },
];

/**
 * Get applicable fallback rules for context
 */
export function getApplicableRules(context: FallbackContext): FallbackRule[] {
  return FALLBACK_RULES.filter((rule) => rule.condition(context));
}

/**
 * Generate fallback response from rules
 */
export function generateFallbackResponse(context: FallbackContext): FarmAIResponse {
  const applicableRules = getApplicableRules(context);

  if (applicableRules.length === 0) {
    return {
      content: "Current conditions appear normal. Continue regular monitoring.",
      sourcesUsed: ["sensor_readings.csv"],
      confidence: 0.6,
      fallbackUsed: true,
    };
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  applicableRules.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Build response from applicable rules
  const recommendations = applicableRules.map((rule) => ({
    action: rule.recommendation(context),
    priority: rule.priority,
    reasoning: `Rule: ${rule.name}`,
  }));

  const allSources = [...new Set(applicableRules.flatMap((r) => r.sources))];

  // Highest priority rule's recommendation becomes main content
  const mainContent = applicableRules[0].recommendation(context);

  return {
    content: mainContent,
    sourcesUsed: allSources,
    confidence: 0.75, // Fallback has consistent confidence
    recommendations,
    fallbackUsed: true,
  };
}

/**
 * Extract fallback context from sensor readings
 */
export function buildFallbackContext(
  readings: SensorReading[],
  aiContext?: FarmAIContext,
): FallbackContext {
  const context: FallbackContext = {
    permacultureDepth: aiContext?.permacultureDepth,
    currentSeason: aiContext?.seasonInfo?.current,
    frostRisk: aiContext?.seasonInfo?.frostRisk,
  };

  // Get latest readings by type
  const latestByType: Record<string, SensorReading> = {};
  for (const reading of readings) {
    const existing = latestByType[reading.reading_type];
    if (!existing || new Date(reading.timestamp) > new Date(existing.timestamp)) {
      latestByType[reading.reading_type] = reading;
    }
  }

  if (latestByType["moisture"]) {
    context.moisture = latestByType["moisture"].value;
  }
  if (latestByType["ec"]) {
    context.ec = latestByType["ec"].value;
  }
  if (latestByType["temperature"]) {
    // Assume soil temp if from soil sensor
    context.soilTemp = latestByType["temperature"].value;
  }

  return context;
}

/**
 * Get fallback response for a specific query type
 */
export function getFallbackForQuery(
  queryType: "water" | "fertilize" | "climate" | "general",
  context: FallbackContext,
): FarmAIResponse {
  switch (queryType) {
    case "water": {
      const waterRules = FALLBACK_RULES.filter((r) => r.id.startsWith("water_"));
      const applicable = waterRules.filter((r) => r.condition(context));
      if (applicable.length > 0) {
        return {
          content: applicable[0].recommendation(context),
          sourcesUsed: applicable[0].sources,
          confidence: 0.75,
          recommendations: applicable.map((r) => ({
            action: r.recommendation(context),
            priority: r.priority,
            reasoning: r.name,
          })),
          fallbackUsed: true,
        };
      }
      break;
    }

    case "fertilize": {
      const ecRules = FALLBACK_RULES.filter((r) => r.id.startsWith("ec_"));
      const applicable = ecRules.filter((r) => r.condition(context));
      if (applicable.length > 0) {
        return {
          content: applicable[0].recommendation(context),
          sourcesUsed: applicable[0].sources,
          confidence: 0.75,
          recommendations: applicable.map((r) => ({
            action: r.recommendation(context),
            priority: r.priority,
            reasoning: r.name,
          })),
          fallbackUsed: true,
        };
      }
      break;
    }

    case "climate": {
      const tempRules = FALLBACK_RULES.filter(
        (r) => r.id.includes("frost") || r.id.includes("cold") || r.id.includes("heat"),
      );
      const applicable = tempRules.filter((r) => r.condition(context));
      if (applicable.length > 0) {
        return {
          content: applicable[0].recommendation(context),
          sourcesUsed: applicable[0].sources,
          confidence: 0.75,
          recommendations: applicable.map((r) => ({
            action: r.recommendation(context),
            priority: r.priority,
            reasoning: r.name,
          })),
          fallbackUsed: true,
        };
      }
      break;
    }
  }

  // General fallback
  return generateFallbackResponse(context);
}
