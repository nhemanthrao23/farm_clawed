/**
 * Farm AI Provider Abstraction
 *
 * Supports OpenAI, Anthropic, local (OpenAI-compatible), or no AI.
 */

import { z } from "zod";

// Provider types
export const FarmAIProviderTypeSchema = z.union([
  z.literal("none"),
  z.literal("openai"),
  z.literal("anthropic"),
  z.literal("local"),
]);

export type FarmAIProviderType = z.infer<typeof FarmAIProviderTypeSchema>;

// Provider configuration
export const FarmAIConfigSchema = z.object({
  provider: FarmAIProviderTypeSchema.default("none"),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  maxTokens: z.number().int().positive().default(2048),
  temperature: z.number().min(0).max(2).default(0.7),
  timeout: z.number().int().positive().default(30000),
});

export type FarmAIConfig = z.infer<typeof FarmAIConfigSchema>;

// AI request context
export interface FarmAIContext {
  farmProfile?: Record<string, unknown>;
  sensorReadings?: Array<{ type: string; value: number; unit: string; timestamp: string }>;
  seasonInfo?: { current: string; frostRisk: boolean };
  recentActions?: Array<{ action: string; timestamp: string }>;
  permacultureDepth?: number;
  automationLevel?: number;
}

// AI response
export interface FarmAIResponse {
  content: string;
  sourcesUsed: string[];
  confidence: number;
  recommendations?: Array<{
    action: string;
    priority: "low" | "medium" | "high";
    reasoning: string;
  }>;
  fallbackUsed: boolean;
}

// Default models by provider
export const DEFAULT_MODELS: Record<FarmAIProviderType, string> = {
  none: "",
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-20250514",
  local: "llama3.2:latest", // Ollama default
};

/**
 * Get AI provider configuration with defaults
 */
export function getAIConfig(config: Partial<FarmAIConfig>): FarmAIConfig {
  const provider = config.provider || "none";
  return {
    provider,
    baseUrl: config.baseUrl,
    model: config.model || DEFAULT_MODELS[provider],
    apiKey: config.apiKey,
    maxTokens: config.maxTokens || 2048,
    temperature: config.temperature || 0.7,
    timeout: config.timeout || 30000,
  };
}

/**
 * Check if AI is available
 */
export function isAIAvailable(config: FarmAIConfig): boolean {
  if (config.provider === "none") return false;
  if (config.provider === "local") return !!config.baseUrl;
  return !!config.apiKey;
}

/**
 * Build system prompt for farm AI
 */
export function buildFarmSystemPrompt(context: FarmAIContext): string {
  const parts: string[] = [];

  parts.push(
    `You are farm_clawed, an AI farm assistant helping manage a farm with these settings:`,
  );
  parts.push(
    `- Permaculture Depth: ${context.permacultureDepth ?? 1} (0=standard, 1=regen, 2=permaculture-lite, 3=full)`,
  );
  parts.push(
    `- Automation Level: ${context.automationLevel ?? 1} (0=observe, 1=assist, 2=approve, 3=auto, 4=full)`,
  );
  parts.push("");

  if (context.farmProfile) {
    parts.push("Farm Profile:");
    parts.push(JSON.stringify(context.farmProfile, null, 2));
    parts.push("");
  }

  if (context.sensorReadings && context.sensorReadings.length > 0) {
    parts.push("Recent Sensor Readings:");
    for (const reading of context.sensorReadings.slice(-10)) {
      parts.push(`- ${reading.type}: ${reading.value} ${reading.unit} (${reading.timestamp})`);
    }
    parts.push("");
  }

  if (context.seasonInfo) {
    parts.push(`Current Season: ${context.seasonInfo.current}`);
    parts.push(`Frost Risk: ${context.seasonInfo.frostRisk ? "YES" : "No"}`);
    parts.push("");
  }

  parts.push("Guidelines:");
  parts.push("- Provide specific, actionable recommendations");
  parts.push("- Always cite data sources used (sensor readings, profile, etc.)");
  parts.push("- Include confidence level (0-100%)");
  parts.push("- For permaculture depth 2+, consider ecological interactions");
  parts.push("- For automation level 2+, format actions for the approval system");
  parts.push("- Prioritize plant health and safety");

  return parts.join("\n");
}

/**
 * Parse AI response into structured format
 */
export function parseAIResponse(rawContent: string, sourcesProvided: string[]): FarmAIResponse {
  // Extract confidence if mentioned
  let confidence = 0.7; // Default
  const confidenceMatch = rawContent.match(/confidence[:\s]+(\d+)%/i);
  if (confidenceMatch) {
    confidence = parseInt(confidenceMatch[1], 10) / 100;
  }

  // Extract recommendations if structured
  const recommendations: FarmAIResponse["recommendations"] = [];
  const actionMatches = rawContent.matchAll(/(?:recommend|suggest|action)[:\s]+([^\n]+)/gi);
  for (const match of actionMatches) {
    recommendations.push({
      action: match[1].trim(),
      priority: "medium",
      reasoning: "Extracted from AI response",
    });
  }

  return {
    content: rawContent,
    sourcesUsed: sourcesProvided,
    confidence,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
    fallbackUsed: false,
  };
}

/**
 * Create a mock AI provider for testing
 */
export function createMockProvider(): {
  query: (prompt: string, context: FarmAIContext) => Promise<FarmAIResponse>;
} {
  return {
    query: async (prompt: string, context: FarmAIContext): Promise<FarmAIResponse> => {
      // Simple mock response based on prompt content
      let content = "Based on current conditions, I recommend monitoring the situation.";
      const sources: string[] = [];

      if (prompt.toLowerCase().includes("water")) {
        content =
          "Based on the sensor readings, soil moisture is adequate. Continue monitoring and water when moisture drops below 30%.";
        sources.push("sensor_readings.csv");
      }

      if (prompt.toLowerCase().includes("fertiliz")) {
        content =
          "EC levels indicate low nutrient availability. Consider a light application of balanced fertilizer.";
        sources.push("sensor_readings.csv", "farm_profile.yaml");
      }

      if (prompt.toLowerCase().includes("frost") || prompt.toLowerCase().includes("cold")) {
        content =
          "Temperature is stable. Monitor overnight lows and prepare frost protection if temps drop below 35°F.";
        sources.push("season_calendar.yaml");
      }

      return {
        content,
        sourcesUsed: sources,
        confidence: 0.8,
        recommendations: [
          {
            action: "Continue monitoring",
            priority: "low",
            reasoning: "Current conditions are stable",
          },
        ],
        fallbackUsed: true,
      };
    },
  };
}
