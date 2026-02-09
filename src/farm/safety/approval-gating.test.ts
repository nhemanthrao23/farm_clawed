/**
 * Tests for Approval Gating - IFTTT actions require approval before execution
 */

import { describe, it, expect, beforeEach } from "vitest";
import { IftttConnector } from "../../connectors/ifttt-webhooks/index.js";

describe("Approval Gating", () => {
  let connector: IftttConnector;

  beforeEach(() => {
    connector = new IftttConnector({
      webhookKey: "test_webhook_key_at_least_20_chars_long",
      simulationMode: true,
      rateLimitMs: 0,
    });
  });

  describe("Proposal Creation", () => {
    it("should create a pending action when proposeAction is called", () => {
      const action = connector.proposeAction({
        event: "water_zone1",
        payload: { value1: "zone1", value2: "120" },
        metadata: {
          reason: "Moisture below threshold",
          source: "automation:water-schedule",
          target: "Meyer Lemon Tree",
          confidence: 92,
        },
      });

      expect(action.status).toBe("pending");
      expect(action.id).toBeDefined();
      expect(action.fullEventName).toBe("farm_clawed_water_zone1");
    });

    it("should set expiration time for proposals", () => {
      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });

      const expiresAt = new Date(action.expiresAt);
      const proposedAt = new Date(action.proposedAt);
      expect(expiresAt.getTime()).toBeGreaterThan(proposedAt.getTime());
    });
  });

  describe("Execution Requires Approval", () => {
    it("should reject execution of unapproved actions", async () => {
      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });

      await expect(connector.executeAction(action.id)).rejects.toThrow(/Must be approved first/);
    });

    it("should allow execution after approval", async () => {
      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });

      connector.approveAction(action.id);
      const result = await connector.executeAction(action.id);

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
    });

    it("should not allow execution of rejected actions", async () => {
      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });

      connector.rejectAction(action.id);

      await expect(connector.executeAction(action.id)).rejects.toThrow();
    });
  });

  describe("Approval Flow", () => {
    it("should track who approved the action", () => {
      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });

      connector.approveAction(action.id, "approval_123");
      const approved = connector.getAction(action.id);

      expect(approved?.approval?.decidedBy).toBe("user");
      expect(approved?.approval?.approvalId).toBe("approval_123");
      expect(approved?.approval?.decidedAt).toBeDefined();
    });

    it("should not allow double approval", () => {
      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });

      connector.approveAction(action.id);
      expect(() => connector.approveAction(action.id)).toThrow();
    });

    it("should not allow approving after rejection", () => {
      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });

      connector.rejectAction(action.id);
      expect(() => connector.approveAction(action.id)).toThrow();
    });
  });

  describe("Pending Actions List", () => {
    it("should return only pending actions", () => {
      connector.proposeAction({ event: "a", metadata: { reason: "A", source: "test" } });
      const b = connector.proposeAction({ event: "b", metadata: { reason: "B", source: "test" } });
      connector.proposeAction({ event: "c", metadata: { reason: "C", source: "test" } });

      connector.approveAction(b.id);

      const pending = connector.getPendingActions();
      expect(pending.length).toBe(2);
      expect(pending.every((a) => a.status === "pending")).toBe(true);
    });
  });

  describe("Simulation Mode", () => {
    it("should auto-approve in simulateAction", async () => {
      const { action, result } = await connector.simulateAction({
        event: "test",
        metadata: { reason: "Test simulation", source: "test" },
      });

      expect(action.approval?.decidedBy).toBe("auto");
      expect(result.simulated).toBe(true);
      expect(result.success).toBe(true);
    });

    it("should mark action as executed after simulation", async () => {
      const { action } = await connector.simulateAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });

      expect(action.status).toBe("executed");
      expect(action.execution?.simulated).toBe(true);
    });
  });

  describe("Event Emission", () => {
    it("should emit events on approval", () => {
      let approvedAction: unknown = null;
      connector.on("approved", (action) => {
        approvedAction = action;
      });

      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });
      connector.approveAction(action.id);

      expect(approvedAction).not.toBeNull();
    });

    it("should emit events on rejection", () => {
      let rejectedAction: unknown = null;
      connector.on("rejected", (action) => {
        rejectedAction = action;
      });

      const action = connector.proposeAction({
        event: "test",
        metadata: { reason: "Test", source: "test" },
      });
      connector.rejectAction(action.id);

      expect(rejectedAction).not.toBeNull();
    });
  });
});
