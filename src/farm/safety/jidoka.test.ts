/**
 * Jidoka Safety System Tests
 */

import { describe, it, expect } from "vitest";
import {
  checkStopTrigger,
  createJidokaEvent,
  getRecommendedActions,
  resolveJidokaEvent,
  DEFAULT_STOP_TRIGGERS,
} from "./jidoka.js";

describe("Jidoka Safety System", () => {
  describe("checkStopTrigger", () => {
    it("triggers overwatering alert when moisture exceeds threshold", () => {
      const result = checkStopTrigger("overwatering", 85, DEFAULT_STOP_TRIGGERS.overwatering);

      expect(result.triggered).toBe(true);
      expect(result.severity).toBe("warning");
      expect(result.message).toContain("85%");
    });

    it("triggers critical overwatering when far above threshold", () => {
      const result = checkStopTrigger("overwatering", 95, DEFAULT_STOP_TRIGGERS.overwatering);

      expect(result.triggered).toBe(true);
      expect(result.severity).toBe("critical");
    });

    it("does not trigger when moisture is normal", () => {
      const result = checkStopTrigger("overwatering", 50, DEFAULT_STOP_TRIGGERS.overwatering);

      expect(result.triggered).toBe(false);
    });

    it("triggers frost risk below threshold", () => {
      const result = checkStopTrigger("frost_risk", 33, DEFAULT_STOP_TRIGGERS.frost_risk);

      expect(result.triggered).toBe(true);
      expect(result.severity).toBe("critical");
    });

    it("triggers emergency for freezing temperatures", () => {
      const result = checkStopTrigger("frost_risk", 30, DEFAULT_STOP_TRIGGERS.frost_risk);

      expect(result.triggered).toBe(true);
      expect(result.severity).toBe("emergency");
    });

    it("triggers EC spike alert", () => {
      const result = checkStopTrigger("ec_spike", 3.5, DEFAULT_STOP_TRIGGERS.ec_spike);

      expect(result.triggered).toBe(true);
      expect(result.message).toContain("3.5");
    });
  });

  describe("createJidokaEvent", () => {
    it("creates event with unique ID", () => {
      const event1 = createJidokaEvent({
        triggerType: "overwatering",
        severity: "warning",
        message: "Test message",
      });

      const event2 = createJidokaEvent({
        triggerType: "overwatering",
        severity: "warning",
        message: "Test message",
      });

      expect(event1.id).not.toBe(event2.id);
    });

    it("includes timestamp", () => {
      const event = createJidokaEvent({
        triggerType: "frost_risk",
        severity: "critical",
        message: "Test",
      });

      expect(event.timestamp).toBeDefined();
      expect(new Date(event.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("sets resolved to false by default", () => {
      const event = createJidokaEvent({
        triggerType: "leak_detected",
        severity: "emergency",
        message: "Leak!",
      });

      expect(event.resolved).toBe(false);
    });
  });

  describe("getRecommendedActions", () => {
    it("returns appropriate actions for leak detection", () => {
      const event = createJidokaEvent({
        triggerType: "leak_detected",
        severity: "emergency",
        message: "Leak detected",
      });

      const actions = getRecommendedActions(event);

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((a) => a.toLowerCase().includes("valve"))).toBe(true);
    });

    it("returns frost protection actions for frost risk", () => {
      const event = createJidokaEvent({
        triggerType: "frost_risk",
        severity: "critical",
        message: "Frost risk",
      });

      const actions = getRecommendedActions(event);

      expect(actions.some((a) => a.toLowerCase().includes("cover"))).toBe(true);
    });
  });

  describe("resolveJidokaEvent", () => {
    it("marks event as resolved", () => {
      const event = createJidokaEvent({
        triggerType: "overwatering",
        severity: "warning",
        message: "Test",
      });

      const resolved = resolveJidokaEvent(event, "test_user", "Drainage fixed");

      expect(resolved.resolved).toBe(true);
      expect(resolved.resolvedBy).toBe("test_user");
      expect(resolved.notes).toBe("Drainage fixed");
      expect(resolved.resolvedAt).toBeDefined();
    });
  });
});
