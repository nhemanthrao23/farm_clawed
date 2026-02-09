/**
 * Tests for secrets-redactor.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  redactSecrets,
  redactObject,
  redactValue,
  containsSecrets,
  maskSecret,
  addRedactionPattern,
  clearDynamicPatterns,
} from "./secrets-redactor.js";

describe("secrets-redactor", () => {
  beforeEach(() => {
    clearDynamicPatterns();
  });

  describe("redactSecrets", () => {
    it("should redact OpenAI API keys", () => {
      const input = "Using key sk-abcdefghijklmnopqrstuvwxyz1234567890";
      const result = redactSecrets(input);
      expect(result.wasRedacted).toBe(true);
      expect(result.redacted).toContain("sk-[REDACTED]");
      expect(result.redacted).not.toContain("sk-abcdefghijklmnopqrstuvwxyz1234567890");
    });

    it("should redact Anthropic API keys", () => {
      const input = "Key: sk-ant-api03-abcdefghijklmnopqrstuvwxyz";
      const result = redactSecrets(input);
      expect(result.wasRedacted).toBe(true);
      expect(result.redacted).toContain("sk-ant-[REDACTED]");
    });

    it("should redact Bearer tokens with simple tokens", () => {
      const input = "Authorization: Bearer abc123def456ghi789";
      const result = redactSecrets(input);
      expect(result.wasRedacted).toBe(true);
      expect(result.redacted).toContain("Bearer [REDACTED]");
    });

    it("should redact Bearer tokens with JWT-style tokens", () => {
      // JWT tokens within Bearer headers get JWT-specific redaction
      const input =
        "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.sig";
      const result = redactSecrets(input);
      expect(result.wasRedacted).toBe(true);
      // The JWT within the Bearer header is redacted as a JWT
      expect(result.redacted).toContain("[JWT_REDACTED]");
    });

    it("should redact JWT tokens", () => {
      const input = "Token: eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature123";
      const result = redactSecrets(input);
      expect(result.wasRedacted).toBe(true);
      expect(result.redacted).toContain("[JWT_REDACTED]");
    });

    it("should redact URLs with embedded passwords", () => {
      const input = "postgres://user:mysecretpassword@localhost:5432/db";
      const result = redactSecrets(input);
      // URL password pattern matches user:password@
      expect(result.redacted).toContain("[REDACTED]@");
    });

    it("should redact environment variable patterns", () => {
      const input = "API_KEY=secretvalue123456789012345";
      const result = redactSecrets(input);
      expect(result.wasRedacted).toBe(true);
      expect(result.redacted).not.toContain("secretvalue123456789012345");
    });

    it("should not modify strings without secrets", () => {
      const input = "This is a normal log message about farming";
      const result = redactSecrets(input);
      expect(result.wasRedacted).toBe(false);
      expect(result.redacted).toBe(input);
    });

    it("should track matched patterns", () => {
      const input = "Using sk-test12345678901234567890 key";
      const result = redactSecrets(input);
      expect(result.matchedPatterns.length).toBeGreaterThan(0);
    });

    it("should handle multiple secrets in one string", () => {
      const input = "OpenAI: sk-abcdefghijklmnopqrstuvwxyz1234567890, Token: Bearer abc123";
      const result = redactSecrets(input);
      expect(result.wasRedacted).toBe(true);
      expect(result.redacted).not.toContain("sk-abcdefghijklmnopqrstuvwxyz1234567890");
    });
  });

  describe("redactObject", () => {
    it("should redact values in objects with sensitive keys", () => {
      const obj = {
        apiKey: "sk-secret123456789012345678901234567890",
        password: "mysecretpassword",
        username: "normaluser",
      };
      const result = redactObject(obj);
      expect(result.apiKey).toBe("[REDACTED]");
      expect(result.password).toBe("[REDACTED]");
      expect(result.username).toBe("normaluser");
    });

    it("should handle nested objects", () => {
      const obj = {
        config: {
          credentials: {
            token: "secrettoken12345678901234567890",
          },
        },
        name: "farm1",
      };
      const result = redactObject(obj);
      expect((result.config as Record<string, unknown>).credentials).toEqual({
        token: "[REDACTED]",
      });
      expect(result.name).toBe("farm1");
    });

    it("should handle arrays", () => {
      const obj = {
        keys: ["sk-key1234567890123456789012345", "sk-key2234567890123456789012345"],
      };
      const result = redactObject(obj) as { keys: string[] };
      expect(result.keys[0]).toContain("[REDACTED]");
      expect(result.keys[1]).toContain("[REDACTED]");
    });
  });

  describe("redactValue", () => {
    it("should redact string values", () => {
      const result = redactValue("sk-secret12345678901234567890");
      expect(result).toContain("[REDACTED]");
    });

    it("should handle non-string primitives", () => {
      expect(redactValue(123)).toBe(123);
      expect(redactValue(true)).toBe(true);
      expect(redactValue(null)).toBe(null);
    });
  });

  describe("containsSecrets", () => {
    it("should detect secrets in strings", () => {
      expect(containsSecrets("sk-abcdefghijklmnopqrstuvwxyz1234567890")).toBe(true);
      expect(containsSecrets("Bearer eyJtoken")).toBe(true);
    });

    it("should return false for safe strings", () => {
      expect(containsSecrets("normal text")).toBe(false);
      expect(containsSecrets("farm_clawed config")).toBe(false);
    });
  });

  describe("maskSecret", () => {
    it("should mask secrets showing start and end", () => {
      const result = maskSecret("abcdefghijklmnop", 4);
      expect(result).toBe("abcd********mnop");
    });

    it("should handle short secrets", () => {
      const result = maskSecret("short", 4);
      expect(result).toBe("*****");
    });

    it("should respect visibleChars parameter", () => {
      const result = maskSecret("secretvalue12345", 2);
      expect(result.startsWith("se")).toBe(true);
      expect(result.endsWith("45")).toBe(true);
    });
  });

  describe("dynamic patterns", () => {
    it("should support adding custom patterns", () => {
      addRedactionPattern(/FARM_SECRET_[A-Z0-9]+/g, "Farm Secret", "[FARM_SECRET_REDACTED]");
      const result = redactSecrets("Using FARM_SECRET_ABC123 for testing");
      expect(result.wasRedacted).toBe(true);
      expect(result.redacted).toContain("[FARM_SECRET_REDACTED]");
    });

    it("should clear dynamic patterns", () => {
      addRedactionPattern(/CUSTOM_[A-Z]+/g, "Custom", "[CUSTOM_REDACTED]");
      clearDynamicPatterns();
      const result = redactSecrets("Using CUSTOM_ABC for testing");
      // CUSTOM_ABC won't be redacted after clearing (unless it matches other patterns)
      expect(result.matchedPatterns).not.toContain("Custom");
    });
  });
});
