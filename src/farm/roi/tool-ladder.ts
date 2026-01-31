/**
 * Tool Ladder - Tier-Based Value Tracking
 *
 * Tracks which tools/features are in use and their value contribution.
 */

import { z } from "zod";

// Tool tiers
export const ToolTierSchema = z.union([
  z.literal(0), // Free (AI console only)
  z.literal(1), // Paid AI models
  z.literal(2), // Workflows
  z.literal(3), // Builder (custom skills)
  z.literal(4), // Local LLM
  z.literal(5), // Full Ops (hardware)
]);

export type ToolTier = z.infer<typeof ToolTierSchema>;

// Tool tier definitions
export interface ToolTierDefinition {
  tier: ToolTier;
  name: string;
  description: string;
  features: string[];
  typicalCost: string;
  roiMetrics: string[];
}

export const TOOL_TIERS: ToolTierDefinition[] = [
  {
    tier: 0,
    name: "Free Console",
    description: "AI console with manual inputs, no API keys required",
    features: [
      "AI recommendations (fallback rules)",
      "Manual sensor logging",
      "Template-based analysis",
      "Seasonal planning",
      "Basic ROI tracking",
    ],
    typicalCost: "Free",
    roiMetrics: ["time_saved_hours", "decisions_improved", "knowledge_gained"],
  },
  {
    tier: 1,
    name: "Paid AI",
    description: "Cloud AI models for enhanced recommendations",
    features: [
      "GPT-4 / Claude recommendations",
      "Contextual analysis",
      "Photo analysis",
      "Detailed explanations",
    ],
    typicalCost: "$5-20/month",
    roiMetrics: ["recommendation_quality", "time_saved_hours", "avoided_mistakes"],
  },
  {
    tier: 2,
    name: "Workflows",
    description: "Automated scheduling and notifications",
    features: [
      "Scheduled AI runs",
      "Alert notifications",
      "Calendar integration",
      "Batch processing",
    ],
    typicalCost: "$0-10/month",
    roiMetrics: ["consistency_improvement", "time_saved_hours", "missed_tasks_reduction"],
  },
  {
    tier: 3,
    name: "Builder",
    description: "Custom skills and integrations",
    features: [
      "Custom skill development",
      "API integrations",
      "Advanced templates",
      "Community skills",
    ],
    typicalCost: "Time investment",
    roiMetrics: ["custom_value_created", "efficiency_gains", "knowledge_codified"],
  },
  {
    tier: 4,
    name: "Local LLM",
    description: "Self-hosted AI for privacy and cost",
    features: ["Ollama/local model support", "No API costs", "Full privacy", "Offline operation"],
    typicalCost: "$0 (hardware owned)",
    roiMetrics: ["api_costs_saved", "privacy_maintained", "availability_improved"],
  },
  {
    tier: 5,
    name: "Full Ops",
    description: "Hardware integration with sensors and actuators",
    features: [
      "Sensor integration",
      "Actuator control",
      "Real-time monitoring",
      "Automated actions",
      "Jidoka safety",
    ],
    typicalCost: "$50-500 hardware",
    roiMetrics: [
      "water_saved_gallons",
      "labor_saved_hours",
      "plant_losses_avoided",
      "harvest_improved",
    ],
  },
];

// Tool usage tracking
export interface ToolUsage {
  tier: ToolTier;
  enabledAt: string;
  lastUsedAt: string;
  usageCount: number;
  estimatedValue: number;
}

// Current tool ladder state
export interface ToolLadderState {
  currentTier: ToolTier;
  tierUsage: Record<number, ToolUsage>;
  totalEstimatedValue: number;
  recommendations: string[];
}

/**
 * Get tier definition
 */
export function getTierDefinition(tier: ToolTier): ToolTierDefinition {
  return TOOL_TIERS.find((t) => t.tier === tier) || TOOL_TIERS[0];
}

/**
 * Calculate current tier based on enabled features
 */
export function calculateCurrentTier(features: {
  hasAIKey?: boolean;
  hasScheduler?: boolean;
  hasCustomSkills?: boolean;
  hasLocalLLM?: boolean;
  hasSensors?: boolean;
  hasActuators?: boolean;
}): ToolTier {
  if (features.hasSensors || features.hasActuators) return 5;
  if (features.hasLocalLLM) return 4;
  if (features.hasCustomSkills) return 3;
  if (features.hasScheduler) return 2;
  if (features.hasAIKey) return 1;
  return 0;
}

/**
 * Get next tier recommendation
 */
export function getNextTierRecommendation(
  currentTier: ToolTier,
): { tier: ToolTier; reason: string } | null {
  if (currentTier >= 5) return null;

  const nextTier = (currentTier + 1) as ToolTier;
  const nextDef = getTierDefinition(nextTier);

  const reasons: Record<number, string> = {
    1: "Add AI provider for smarter recommendations",
    2: "Enable scheduling for consistent automated analysis",
    3: "Create custom skills for your specific needs",
    4: "Set up local LLM for privacy and cost savings",
    5: "Add sensors/actuators for full automation",
  };

  return {
    tier: nextTier,
    reason: reasons[nextTier] || `Upgrade to ${nextDef.name}`,
  };
}

/**
 * Estimate monthly value by tier
 */
export function estimateTierValue(
  tier: ToolTier,
  usageIntensity: "low" | "medium" | "high",
): number {
  // Base values in dollars per month
  const baseValues: Record<number, number> = {
    0: 10, // Time saved from better decisions
    1: 25, // Better recommendations
    2: 15, // Consistency
    3: 20, // Custom value
    4: 30, // API costs saved + privacy
    5: 100, // Water + labor + plants saved
  };

  const multipliers = { low: 0.5, medium: 1.0, high: 2.0 };

  return baseValues[tier] * multipliers[usageIntensity];
}

/**
 * Format tool ladder for display
 */
export function formatToolLadder(state: ToolLadderState): string {
  const lines: string[] = [];

  lines.push("TOOL LADDER STATUS");
  lines.push("==================");
  lines.push("");

  for (const tierDef of TOOL_TIERS) {
    const isCurrent = tierDef.tier === state.currentTier;
    const isEnabled = tierDef.tier <= state.currentTier;
    const prefix = isCurrent ? "▶ " : isEnabled ? "✓ " : "  ";

    lines.push(`${prefix}Tier ${tierDef.tier}: ${tierDef.name}`);
    if (isEnabled && state.tierUsage[tierDef.tier]) {
      const usage = state.tierUsage[tierDef.tier];
      lines.push(`    Used: ${usage.usageCount} times`);
      lines.push(`    Value: $${usage.estimatedValue.toFixed(2)}`);
    }
  }

  lines.push("");
  lines.push(`Current Tier: ${state.currentTier}`);
  lines.push(`Total Estimated Value: $${state.totalEstimatedValue.toFixed(2)}`);

  if (state.recommendations.length > 0) {
    lines.push("");
    lines.push("Recommendations:");
    for (const rec of state.recommendations) {
      lines.push(`  - ${rec}`);
    }
  }

  return lines.join("\n");
}
