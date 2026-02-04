/**
 * Tests for IFTTT Webhooks connector
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  IftttConnector,
  createIftttConnectorFromEnv,
  buildWebhookUrl,
  generateIdempotencyKey,
  testConnection,
  clearIdempotencyCache,
  type IftttConfig,
} from "./index.js";

describe("IFTTT Webhooks Connector", () => {
  const testConfig: IftttConfig = {
    webhookKey: "test_webhook_key_at_least_20_chars",
    baseUrl: "https://maker.ifttt.com/trigger",
    eventPrefix: "farm_clawed_",
    timeout: 10000,
    retries: 3,
    simulationMode: true, // Always simulate in tests
    rateLimitMs: 0, // No rate limiting in tests
  };

  // Clear idempotency cache before each test to avoid state leakage
  beforeEach(() => {
    clearIdempotencyCache();
  });

  describe("buildWebhookUrl", () => {
    it("should build correct URL with prefix", () => {
      const url = buildWebhookUrl(testConfig, "water_zone1");
      expect(url).toBe(
        "https://maker.ifttt.com/trigger/farm_clawed_water_zone1/with/key/test_webhook_key_at_least_20_chars",
      );
    });

    it("should not double-prefix events", () => {
      const url = buildWebhookUrl(testConfig, "farm_clawed_water_zone1");
      expect(url).toContain("farm_clawed_water_zone1");
      expect(url).not.toContain("farm_clawed_farm_clawed_");
    });
  });

  describe("generateIdempotencyKey", () => {
    it("should generate unique keys", () => {
      const key1 = generateIdempotencyKey("event1", { value1: "a" });
      const key2 = generateIdempotencyKey("event1", { value1: "b" });
      expect(key1).not.toBe(key2);
    });

    it("should start with idem_", () => {
      const key = generateIdempotencyKey("event", {});
      expect(key.startsWith("idem_")).toBe(true);
    });
  });

  describe("testConnection", () => {
    it("should reject missing webhook key", async () => {
      const result = await testConnection({ ...testConfig, webhookKey: "" });
      expect(result.valid).toBe(false);
      expect(result.message).toContain("No webhook key");
    });

    it("should reject short webhook key", async () => {
      const result = await testConnection({ ...testConfig, webhookKey: "short" });
      expect(result.valid).toBe(false);
      expect(result.message).toContain("too short");
    });

    it("should reject placeholder keys", async () => {
      const result = await testConnection({
        ...testConfig,
        webhookKey: "YOUR_IFTTT_WEBHOOK_KEY_HERE",
      });
      expect(result.valid).toBe(false);
      expect(result.message).toContain("placeholder");
    });

    it("should accept valid config in simulation mode", async () => {
      const result = await testConnection(testConfig);
      expect(result.valid).toBe(true);
    });
  });

  describe("IftttConnector", () => {
    let connector: IftttConnector;

    beforeEach(() => {
      connector = new IftttConnector(testConfig);
    });

    describe("proposeAction", () => {
      it("should create a pending action", () => {
        const action = connector.proposeAction({
          event: "test_event",
          payload: { value1: "test" },
          metadata: {
            reason: "Test reason",
            source: "test",
          },
        });

        expect(action.id).toBeDefined();
        expect(action.status).toBe("pending");
        expect(action.event).toBe("test_event");
        expect(action.fullEventName).toBe("farm_clawed_test_event");
      });

      it("should set expiration time", () => {
        const action = connector.proposeAction({
          event: "test",
          metadata: { reason: "Test", source: "test" },
        });

        const expiresAt = new Date(action.expiresAt);
        const proposedAt = new Date(action.proposedAt);
        expect(expiresAt.getTime()).toBeGreaterThan(proposedAt.getTime());
      });
    });

    describe("approveAction", () => {
      it("should mark action as approved", () => {
        const action = connector.proposeAction({
          event: "test",
          metadata: { reason: "Test", source: "test" },
        });

        const approved = connector.approveAction(action.id);
        expect(approved?.status).toBe("approved");
        expect(approved?.approval?.decidedBy).toBe("user");
      });

      it("should fail on non-pending action", () => {
        const action = connector.proposeAction({
          event: "test",
          metadata: { reason: "Test", source: "test" },
        });
        connector.approveAction(action.id);

        expect(() => connector.approveAction(action.id)).toThrow();
      });
    });

    describe("rejectAction", () => {
      it("should mark action as rejected", () => {
        const action = connector.proposeAction({
          event: "test",
          metadata: { reason: "Test", source: "test" },
        });

        const rejected = connector.rejectAction(action.id, "Not needed");
        expect(rejected?.status).toBe("rejected");
      });
    });

    describe("executeAction", () => {
      it("should require approval before execution", async () => {
        const action = connector.proposeAction({
          event: "test",
          metadata: { reason: "Test", source: "test" },
        });

        await expect(connector.executeAction(action.id)).rejects.toThrow(/Must be approved first/);
      });

      it("should execute approved actions (simulation)", async () => {
        const action = connector.proposeAction({
          event: "test",
          metadata: { reason: "Test", source: "test" },
        });
        connector.approveAction(action.id);

        const result = await connector.executeAction(action.id);
        expect(result.success).toBe(true);
        expect(result.simulated).toBe(true);

        const updated = connector.getAction(action.id);
        expect(updated?.status).toBe("executed");
      });
    });

    describe("simulateAction", () => {
      it("should simulate without requiring manual approval", async () => {
        const { action, result } = await connector.simulateAction({
          event: "test",
          metadata: { reason: "Test", source: "test" },
        });

        expect(result.success).toBe(true);
        expect(result.simulated).toBe(true);
        expect(action.status).toBe("executed");
        expect(action.approval?.decidedBy).toBe("auto");
      });
    });

    describe("listActions", () => {
      it("should filter by status", () => {
        connector.proposeAction({ event: "a", metadata: { reason: "A", source: "test" } });
        const b = connector.proposeAction({
          event: "b",
          metadata: { reason: "B", source: "test" },
        });
        connector.approveAction(b.id);

        const pending = connector.listActions({ status: "pending" });
        const approved = connector.listActions({ status: "approved" });

        expect(pending.length).toBe(1);
        expect(approved.length).toBe(1);
      });
    });

    describe("event listeners", () => {
      it("should emit events on state changes", () => {
        const proposedHandler = vi.fn();
        const approvedHandler = vi.fn();

        connector.on("proposed", proposedHandler);
        connector.on("approved", approvedHandler);

        const action = connector.proposeAction({
          event: "test",
          metadata: { reason: "Test", source: "test" },
        });

        expect(proposedHandler).toHaveBeenCalledWith(action);

        connector.approveAction(action.id);
        expect(approvedHandler).toHaveBeenCalled();
      });

      it("should allow unsubscribing", () => {
        const handler = vi.fn();
        const unsubscribe = connector.on("proposed", handler);

        connector.proposeAction({ event: "a", metadata: { reason: "A", source: "test" } });
        expect(handler).toHaveBeenCalledTimes(1);

        unsubscribe();
        connector.proposeAction({ event: "b", metadata: { reason: "B", source: "test" } });
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("createIftttConnectorFromEnv", () => {
    beforeEach(() => {
      delete process.env.IFTTT_WEBHOOK_KEY;
      delete process.env.IFTTT_EVENT_PREFIX;
      delete process.env.IFTTT_SIMULATION_MODE;
    });

    it("should return null without webhook key", () => {
      expect(createIftttConnectorFromEnv()).toBeNull();
    });

    it("should return null for placeholder key", () => {
      process.env.IFTTT_WEBHOOK_KEY = "YOUR_IFTTT_WEBHOOK_KEY_HERE";
      expect(createIftttConnectorFromEnv()).toBeNull();
    });

    it("should create connector with valid env", () => {
      process.env.IFTTT_WEBHOOK_KEY = "valid_key_with_at_least_20_chars";
      process.env.IFTTT_SIMULATION_MODE = "true";

      const connector = createIftttConnectorFromEnv();
      expect(connector).not.toBeNull();

      const summary = connector!.getConfigSummary();
      expect(summary.hasKey).toBe(true);
      expect(summary.simulationMode).toBe(true);
    });
  });
});
