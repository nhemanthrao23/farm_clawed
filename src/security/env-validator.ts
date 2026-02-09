/**
 * Environment Validator - Runtime configuration validation
 *
 * Validates environment configuration at startup and warns about
 * unsafe configurations without logging sensitive values.
 */

import { z } from "zod";

/**
 * Environment variable definition
 */
interface EnvVarDef {
  name: string;
  required: boolean;
  description: string;
  sensitive: boolean;
  validator?: (value: string) => boolean;
  defaultValue?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  presentVars: string[];
  missingVars: string[];
}

/**
 * Environment variable definitions for farm_clawed
 */
const ENV_VARS: EnvVarDef[] = [
  // AI Providers
  {
    name: "OPENAI_API_KEY",
    required: false,
    description: "OpenAI API key for cloud AI",
    sensitive: true,
    validator: (v) => v.startsWith("sk-") && v.length > 20,
  },
  {
    name: "ANTHROPIC_API_KEY",
    required: false,
    description: "Anthropic API key",
    sensitive: true,
    validator: (v) => v.startsWith("sk-ant-") && v.length > 20,
  },

  // IFTTT
  {
    name: "IFTTT_WEBHOOK_KEY",
    required: false,
    description: "IFTTT Webhooks key for actuator control",
    sensitive: true,
    validator: (v) => v.length >= 20,
  },
  {
    name: "IFTTT_EVENT_PREFIX",
    required: false,
    description: "Prefix for IFTTT event names",
    sensitive: false,
    defaultValue: "farm_clawed_",
  },
  {
    name: "IFTTT_SIMULATION_MODE",
    required: false,
    description: "Run IFTTT in simulation mode (no actual calls)",
    sensitive: false,
    defaultValue: "false",
  },

  // FMIS - Deere
  {
    name: "DEERE_CLIENT_ID",
    required: false,
    description: "John Deere OAuth2 client ID",
    sensitive: true,
  },
  {
    name: "DEERE_CLIENT_SECRET",
    required: false,
    description: "John Deere OAuth2 client secret",
    sensitive: true,
  },
  {
    name: "DEERE_REDIRECT_URI",
    required: false,
    description: "John Deere OAuth2 redirect URI",
    sensitive: false,
  },

  // FMIS - FieldView
  {
    name: "FIELDVIEW_CLIENT_ID",
    required: false,
    description: "Climate FieldView OAuth2 client ID",
    sensitive: true,
  },
  {
    name: "FIELDVIEW_CLIENT_SECRET",
    required: false,
    description: "Climate FieldView OAuth2 client secret",
    sensitive: true,
  },
  {
    name: "FIELDVIEW_REDIRECT_URI",
    required: false,
    description: "Climate FieldView OAuth2 redirect URI",
    sensitive: false,
  },

  // Home Assistant
  {
    name: "HOME_ASSISTANT_URL",
    required: false,
    description: "Home Assistant instance URL",
    sensitive: false,
  },
  {
    name: "HOME_ASSISTANT_TOKEN",
    required: false,
    description: "Home Assistant long-lived access token",
    sensitive: true,
  },

  // Server
  {
    name: "PORT",
    required: false,
    description: "Gateway server port",
    sensitive: false,
    defaultValue: "18789",
    validator: (v) => {
      const port = parseInt(v, 10);
      return !isNaN(port) && port > 0 && port < 65536;
    },
  },
  {
    name: "BIND_ADDRESS",
    required: false,
    description: "Server bind address",
    sensitive: false,
    defaultValue: "127.0.0.1",
  },
  {
    name: "AUTH_ENABLED",
    required: false,
    description: "Enable authentication",
    sensitive: false,
    defaultValue: "false",
  },
  {
    name: "AUTH_TOKEN",
    required: false,
    description: "Authentication token",
    sensitive: true,
  },

  // Logging
  {
    name: "LOG_LEVEL",
    required: false,
    description: "Log level (debug, info, warn, error)",
    sensitive: false,
    defaultValue: "info",
    validator: (v) => ["debug", "info", "warn", "error"].includes(v.toLowerCase()),
  },
  {
    name: "LOG_REDACT_SECRETS",
    required: false,
    description: "Redact secrets from logs",
    sensitive: false,
    defaultValue: "true",
  },
];

/**
 * Check if a value looks like a placeholder (not a real secret)
 */
function isPlaceholder(value: string): boolean {
  const placeholderPatterns = [
    /^YOUR_/i,
    /_HERE$/i,
    /^CHANGE_ME/i,
    /^REPLACE_/i,
    /^xxx+$/i,
    /^placeholder/i,
    /^example/i,
    /^test$/i,
  ];
  return placeholderPatterns.some((p) => p.test(value));
}

/**
 * Validate environment configuration
 */
export function validateEnv(
  env: Record<string, string | undefined> = process.env,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const presentVars: string[] = [];
  const missingVars: string[] = [];

  for (const def of ENV_VARS) {
    const value = env[def.name];

    if (value !== undefined && value !== "") {
      presentVars.push(def.name);

      // Check for placeholder values
      if (def.sensitive && isPlaceholder(value)) {
        warnings.push(`${def.name} appears to be a placeholder value`);
      }

      // Run custom validator if present
      if (def.validator && !def.validator(value)) {
        errors.push(`${def.name} has an invalid format`);
      }
    } else if (def.required) {
      missingVars.push(def.name);
      errors.push(`Required environment variable ${def.name} is not set`);
    } else {
      missingVars.push(def.name);
    }
  }

  // Security checks
  const bindAddress = env.BIND_ADDRESS || "127.0.0.1";
  const authEnabled = env.AUTH_ENABLED === "true";

  if (bindAddress === "0.0.0.0" && !authEnabled) {
    warnings.push(
      "UNSAFE: Server bound to 0.0.0.0 without authentication enabled. " +
        "This exposes your farm_clawed instance to the network without protection. " +
        "Set AUTH_ENABLED=true and configure AUTH_TOKEN.",
    );
  }

  if (authEnabled && !env.AUTH_TOKEN) {
    errors.push("AUTH_ENABLED is true but AUTH_TOKEN is not set");
  }

  // Check for common misconfigurations
  if (env.IFTTT_WEBHOOK_KEY && env.IFTTT_SIMULATION_MODE !== "true") {
    // This is fine, just informational
  }

  const iftttKey = env.IFTTT_WEBHOOK_KEY;
  if (iftttKey && iftttKey.length < 20) {
    warnings.push("IFTTT_WEBHOOK_KEY seems too short - verify it's correct");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    presentVars,
    missingVars,
  };
}

/**
 * Get a safe summary of environment configuration (no values)
 */
export function getEnvSummary(
  env: Record<string, string | undefined> = process.env,
): Record<string, string> {
  const summary: Record<string, string> = {};

  for (const def of ENV_VARS) {
    const value = env[def.name];
    if (value !== undefined && value !== "") {
      if (def.sensitive) {
        summary[def.name] = `[SET - ${value.length} chars]`;
      } else {
        summary[def.name] = value;
      }
    } else if (def.defaultValue) {
      summary[def.name] = `[DEFAULT: ${def.defaultValue}]`;
    } else {
      summary[def.name] = "[NOT SET]";
    }
  }

  return summary;
}

/**
 * Check if running in a secure configuration
 */
export function isSecureConfiguration(env: Record<string, string | undefined> = process.env): {
  secure: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  const bindAddress = env.BIND_ADDRESS || "127.0.0.1";
  const authEnabled = env.AUTH_ENABLED === "true";
  const redactSecrets = env.LOG_REDACT_SECRETS !== "false";

  // Check bind address
  if (bindAddress === "0.0.0.0") {
    if (!authEnabled) {
      reasons.push("Network-accessible without authentication");
    }
  }

  // Check log redaction
  if (!redactSecrets) {
    reasons.push("Secret redaction disabled in logs");
  }

  // Check for simulation mode (not insecure, but worth noting)
  if (env.IFTTT_SIMULATION_MODE === "true") {
    // This is actually safer, not a security issue
  }

  return {
    secure: reasons.length === 0,
    reasons,
  };
}

/**
 * Print validation results to console (for startup)
 */
export function printValidationResults(
  result: ValidationResult,
  logger?: {
    warn: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  },
): void {
  const log = logger || {
    info: (msg: string) => console.log(msg),
    warn: (msg: string) => console.warn(msg),
    error: (msg: string) => console.error(msg),
  };

  if (result.errors.length > 0) {
    log.error("Environment validation errors:");
    for (const error of result.errors) {
      log.error(`  - ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    log.warn("Environment validation warnings:");
    for (const warning of result.warnings) {
      log.warn(`  - ${warning}`);
    }
  }

  if (result.valid && result.warnings.length === 0) {
    log.info("Environment configuration validated successfully");
  }
}

/**
 * Schema for runtime environment validation with Zod
 */
export const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  IFTTT_WEBHOOK_KEY: z.string().optional(),
  IFTTT_EVENT_PREFIX: z.string().default("farm_clawed_"),
  IFTTT_SIMULATION_MODE: z.enum(["true", "false"]).default("false"),
  DEERE_CLIENT_ID: z.string().optional(),
  DEERE_CLIENT_SECRET: z.string().optional(),
  DEERE_REDIRECT_URI: z.string().url().optional(),
  FIELDVIEW_CLIENT_ID: z.string().optional(),
  FIELDVIEW_CLIENT_SECRET: z.string().optional(),
  FIELDVIEW_REDIRECT_URI: z.string().url().optional(),
  HOME_ASSISTANT_URL: z.string().url().optional(),
  HOME_ASSISTANT_TOKEN: z.string().optional(),
  PORT: z.string().regex(/^\d+$/).default("18789"),
  BIND_ADDRESS: z
    .string()
    .regex(/^(?:\d{1,3}\.){3}\d{1,3}$|^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$|^localhost$/)
    .default("127.0.0.1"),
  AUTH_ENABLED: z.enum(["true", "false"]).default("false"),
  AUTH_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  LOG_REDACT_SECRETS: z.enum(["true", "false"]).default("true"),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
