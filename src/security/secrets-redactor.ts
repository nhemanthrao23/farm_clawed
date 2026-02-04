/**
 * Secrets Redactor - Pattern-based redaction for logs and output
 *
 * Implements the No Secrets Policy by automatically redacting sensitive
 * information from logs, error messages, and other output.
 */

/**
 * Patterns that identify sensitive data to redact
 * Order matters! More specific patterns should come before generic ones.
 */
const SECRET_PATTERNS: Array<{ pattern: RegExp; name: string; replacement: string }> = [
  // API Keys (specific prefixes first)
  {
    pattern: /\b(sk-[a-zA-Z0-9]{20,})\b/g,
    name: "OpenAI API Key",
    replacement: "sk-[REDACTED]",
  },
  {
    pattern: /\b(sk-ant-[a-zA-Z0-9-]{20,})\b/g,
    name: "Anthropic API Key",
    replacement: "sk-ant-[REDACTED]",
  },

  // JWT tokens (before generic base64, since JWTs are base64)
  {
    pattern: /(eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+)/g,
    name: "JWT Token",
    replacement: "[JWT_REDACTED]",
  },

  // Home Assistant Long-Lived Access Tokens (also JWTs)
  {
    pattern: /\b(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)\b/g,
    name: "HA Token",
    replacement: "[HA_TOKEN_REDACTED]",
  },

  // Bearer tokens (before generic patterns)
  {
    pattern: /(Bearer\s+)([a-zA-Z0-9._-]+)/gi,
    name: "Bearer Token",
    replacement: "Bearer [REDACTED]",
  },

  // OAuth tokens
  {
    pattern: /\b(ya29\.[a-zA-Z0-9_-]+)\b/g,
    name: "Google OAuth Token",
    replacement: "ya29.[REDACTED]",
  },

  // URLs with embedded credentials (http, https, postgres, mysql, mongodb, redis, etc.)
  {
    pattern: /(\w+:\/\/[^:]+:)[^@]+(@)/g,
    name: "URL Password",
    replacement: "$1[REDACTED]$2",
  },

  // IFTTT Webhook Keys (typically alphanumeric, 20+ chars, context-dependent)
  {
    pattern: /\b([a-zA-Z0-9_-]{20,50})\b(?=.*(?:ifttt|webhook|maker))/gi,
    name: "IFTTT Webhook Key",
    replacement: "[IFTTT_KEY_REDACTED]",
  },

  // Environment variable values that look like secrets (UPPERCASE_NAME=value format only)
  {
    pattern:
      /\b((?:API_KEY|SECRET_KEY|ACCESS_TOKEN|REFRESH_TOKEN|CLIENT_SECRET|PRIVATE_KEY|PASSWORD|AUTH_TOKEN|WEBHOOK_KEY)[A-Z_]*)\s*[=:]\s*([^\s"']+)/gi,
    name: "Env Secret",
    replacement: "$1=[REDACTED]",
  },

  // FMIS Client Secrets
  {
    pattern: /\b(client_secret[=:]\s*)([a-zA-Z0-9_-]{16,})\b/gi,
    name: "Client Secret",
    replacement: "$1[REDACTED]",
  },

  // Generic long tokens/keys (40+ hex or base64 chars) - LAST as catch-all
  {
    pattern: /\b([a-fA-F0-9]{40,})\b/g,
    name: "Hex Token",
    replacement: "[HEX_TOKEN_REDACTED]",
  },
  {
    pattern: /\b([A-Za-z0-9+/]{50,}={0,2})\b/g,
    name: "Base64 Token",
    replacement: "[BASE64_TOKEN_REDACTED]",
  },

  // Phone numbers (basic patterns)
  {
    pattern: /\b(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})\b/g,
    name: "Phone Number",
    replacement: "[PHONE_REDACTED]",
  },
];

/**
 * Additional patterns that can be dynamically added
 */
const dynamicPatterns: Array<{ pattern: RegExp; name: string; replacement: string }> = [];

/**
 * Result of a redaction operation
 */
export interface RedactionResult {
  /** The redacted string */
  redacted: string;
  /** Whether any redactions were made */
  wasRedacted: boolean;
  /** Names of the patterns that matched */
  matchedPatterns: string[];
}

/**
 * Redact sensitive information from a string
 */
export function redactSecrets(input: string): RedactionResult {
  let result = input;
  const matchedPatterns: string[] = [];
  const allPatterns = [...SECRET_PATTERNS, ...dynamicPatterns];

  for (const { pattern, name, replacement } of allPatterns) {
    // Reset pattern state for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(result)) {
      matchedPatterns.push(name);
      pattern.lastIndex = 0;
      result = result.replace(pattern, replacement);
    }
  }

  return {
    redacted: result,
    wasRedacted: matchedPatterns.length > 0,
    matchedPatterns,
  };
}

/**
 * Redact a single value if it looks like a secret
 */
export function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    const result = redactSecrets(value);
    return result.redacted;
  }
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }
  if (value && typeof value === "object") {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

/**
 * Redact sensitive information from an object (deep)
 */
export function redactObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if the key itself suggests a secret
    const keyLower = key.toLowerCase();
    const isSensitiveKey =
      keyLower.includes("secret") ||
      keyLower.includes("password") ||
      keyLower.includes("token") ||
      keyLower.includes("key") ||
      keyLower.includes("credential") ||
      keyLower.includes("auth");

    if (isSensitiveKey && typeof value === "string" && value.length > 0) {
      result[key] = "[REDACTED]";
    } else {
      result[key] = redactValue(value);
    }
  }

  return result as T;
}

/**
 * Add a custom redaction pattern
 */
export function addRedactionPattern(pattern: RegExp, name: string, replacement: string): void {
  dynamicPatterns.push({ pattern, name, replacement });
}

/**
 * Clear all dynamic patterns
 */
export function clearDynamicPatterns(): void {
  dynamicPatterns.length = 0;
}

/**
 * Create a logging wrapper that automatically redacts secrets
 */
export function createRedactedLogger(
  logger: {
    debug: (msg: string, ...args: unknown[]) => void;
    info: (msg: string, ...args: unknown[]) => void;
    warn: (msg: string, ...args: unknown[]) => void;
    error: (msg: string, ...args: unknown[]) => void;
  },
  enabled = true,
): typeof logger {
  if (!enabled) {
    return logger;
  }

  const redactArgs = (args: unknown[]): unknown[] => {
    return args.map((arg) => {
      if (typeof arg === "string") {
        return redactSecrets(arg).redacted;
      }
      if (arg && typeof arg === "object") {
        try {
          return redactObject(arg as Record<string, unknown>);
        } catch {
          return arg;
        }
      }
      return arg;
    });
  };

  return {
    debug: (msg: string, ...args: unknown[]) => {
      logger.debug(redactSecrets(msg).redacted, ...redactArgs(args));
    },
    info: (msg: string, ...args: unknown[]) => {
      logger.info(redactSecrets(msg).redacted, ...redactArgs(args));
    },
    warn: (msg: string, ...args: unknown[]) => {
      logger.warn(redactSecrets(msg).redacted, ...redactArgs(args));
    },
    error: (msg: string, ...args: unknown[]) => {
      logger.error(redactSecrets(msg).redacted, ...redactArgs(args));
    },
  };
}

/**
 * Check if a string likely contains secrets (for validation)
 */
export function containsSecrets(input: string): boolean {
  const allPatterns = [...SECRET_PATTERNS, ...dynamicPatterns];
  for (const { pattern } of allPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

/**
 * Mask a secret for display (show first and last few chars)
 */
export function maskSecret(secret: string, visibleChars = 4): string {
  if (secret.length <= visibleChars * 2) {
    return "*".repeat(secret.length);
  }
  const start = secret.slice(0, visibleChars);
  const end = secret.slice(-visibleChars);
  const middle = "*".repeat(Math.min(8, secret.length - visibleChars * 2));
  return `${start}${middle}${end}`;
}
