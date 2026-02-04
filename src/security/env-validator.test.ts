/**
 * Tests for Environment Validator
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateEnv, getEnvSummary, isSecureConfiguration } from "./env-validator.js";

describe("env-validator", () => {
  // Store original env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear test env vars
    delete process.env.IFTTT_WEBHOOK_KEY;
    delete process.env.BIND_ADDRESS;
    delete process.env.AUTH_ENABLED;
    delete process.env.AUTH_TOKEN;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe("validateEnv", () => {
    it("should pass with valid configuration", () => {
      const env = {
        IFTTT_WEBHOOK_KEY: "valid_key_that_is_at_least_20_chars",
        BIND_ADDRESS: "127.0.0.1",
      };
      const result = validateEnv(env);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should warn about placeholder values", () => {
      const env = {
        IFTTT_WEBHOOK_KEY: "YOUR_IFTTT_WEBHOOK_KEY_HERE",
      };
      const result = validateEnv(env);
      expect(result.warnings.some((w) => w.includes("placeholder"))).toBe(true);
    });

    it("should warn about unsafe network binding", () => {
      const env = {
        BIND_ADDRESS: "0.0.0.0",
        AUTH_ENABLED: "false",
      };
      const result = validateEnv(env);
      expect(result.warnings.some((w) => w.includes("UNSAFE"))).toBe(true);
    });

    it("should error if auth enabled without token", () => {
      const env = {
        AUTH_ENABLED: "true",
        // AUTH_TOKEN not set
      };
      const result = validateEnv(env);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("AUTH_TOKEN"))).toBe(true);
    });

    it("should warn about short IFTTT key", () => {
      const env = {
        IFTTT_WEBHOOK_KEY: "short",
      };
      const result = validateEnv(env);
      expect(result.warnings.some((w) => w.includes("too short"))).toBe(true);
    });

    it("should track present and missing vars", () => {
      const env = {
        IFTTT_WEBHOOK_KEY: "valid_key_that_is_at_least_20_chars",
      };
      const result = validateEnv(env);
      expect(result.presentVars).toContain("IFTTT_WEBHOOK_KEY");
      expect(result.missingVars).toContain("OPENAI_API_KEY");
    });
  });

  describe("getEnvSummary", () => {
    it("should redact sensitive values", () => {
      const env = {
        IFTTT_WEBHOOK_KEY: "secret_webhook_key_value_12345",
        BIND_ADDRESS: "127.0.0.1",
      };
      const summary = getEnvSummary(env);
      expect(summary.IFTTT_WEBHOOK_KEY).toContain("[SET");
      expect(summary.IFTTT_WEBHOOK_KEY).not.toContain("secret");
      expect(summary.BIND_ADDRESS).toBe("127.0.0.1"); // Non-sensitive shown
    });

    it("should show defaults for unset values", () => {
      const summary = getEnvSummary({});
      expect(summary.IFTTT_EVENT_PREFIX).toContain("[DEFAULT");
      expect(summary.OPENAI_API_KEY).toBe("[NOT SET]");
    });
  });

  describe("isSecureConfiguration", () => {
    it("should be secure with default settings", () => {
      const result = isSecureConfiguration({});
      expect(result.secure).toBe(true);
      expect(result.reasons.length).toBe(0);
    });

    it("should be insecure with 0.0.0.0 without auth", () => {
      const env = {
        BIND_ADDRESS: "0.0.0.0",
        AUTH_ENABLED: "false",
      };
      const result = isSecureConfiguration(env);
      expect(result.secure).toBe(false);
      expect(result.reasons.some((r) => r.includes("authentication"))).toBe(true);
    });

    it("should be secure with 0.0.0.0 when auth is enabled", () => {
      const env = {
        BIND_ADDRESS: "0.0.0.0",
        AUTH_ENABLED: "true",
        AUTH_TOKEN: "my_secret_token",
      };
      const result = isSecureConfiguration(env);
      expect(result.reasons).not.toContain(
        expect.stringContaining("Network-accessible without authentication"),
      );
    });

    it("should warn when secret redaction is disabled", () => {
      const env = {
        LOG_REDACT_SECRETS: "false",
      };
      const result = isSecureConfiguration(env);
      expect(result.secure).toBe(false);
      expect(result.reasons.some((r) => r.includes("redaction disabled"))).toBe(true);
    });
  });
});
