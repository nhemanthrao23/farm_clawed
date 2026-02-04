/**
 * Tests for Guardrails Safety System
 */

import { describe, it, expect } from "vitest";
import {
  getGuardrails,
  checkGuardrails,
  allGuardrailsPass,
  getFailedGuardrails,
  GUARDRAILS_BY_LEVEL,
  type GuardrailCheck,
} from "./guardrails.js";

describe("Guardrails", () => {
  describe("getGuardrails", () => {
    it("should return level 0 guardrails for level 0", () => {
      const guardrails = getGuardrails(0);
      expect(guardrails.maxWaterPerActionGallons).toBe(0);
      expect(guardrails.maxConsecutiveActions).toBe(0);
    });

    it("should return level 2 guardrails for level 2", () => {
      const guardrails = getGuardrails(2);
      expect(guardrails.maxWaterPerActionGallons).toBe(2);
      expect(guardrails.minWateringIntervalMinutes).toBe(240);
    });

    it("should clamp negative levels to 0", () => {
      const guardrails = getGuardrails(-1);
      expect(guardrails).toEqual(GUARDRAILS_BY_LEVEL[0]);
    });

    it("should clamp levels above 4 to 4", () => {
      const guardrails = getGuardrails(10);
      expect(guardrails).toEqual(GUARDRAILS_BY_LEVEL[4]);
    });
  });

  describe("checkGuardrails", () => {
    describe("Level 0 (Observe Only)", () => {
      it("should fail all water actions", () => {
        const checks = checkGuardrails({
          automationLevel: 0,
          proposedWaterGallons: 1,
        });
        const waterCheck = checks.find((c) => c.guardrailType === "max_water_per_action");
        expect(waterCheck?.passed).toBe(false);
      });
    });

    describe("Level 2 (Propose + Approve)", () => {
      it("should pass water action within limits", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          proposedWaterGallons: 1.5,
          waterUsedTodayGallons: 2,
          minutesSinceLastWatering: 300,
          consecutiveActionsToday: 1,
          hasSensorReading: true,
          currentMoisturePercent: 20,
        });
        expect(allGuardrailsPass(checks)).toBe(true);
      });

      it("should fail if water per action exceeds limit", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          proposedWaterGallons: 5, // Exceeds 2 gal limit
        });
        const waterCheck = checks.find((c) => c.guardrailType === "max_water_per_action");
        expect(waterCheck?.passed).toBe(false);
        expect(waterCheck?.message).toContain("exceeds limit");
      });

      it("should fail if daily water would be exceeded", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          proposedWaterGallons: 2,
          waterUsedTodayGallons: 9, // Total would be 11, exceeds 10 gal limit
        });
        const dailyCheck = checks.find((c) => c.guardrailType === "max_water_daily");
        expect(dailyCheck?.passed).toBe(false);
      });

      it("should fail if watering too soon", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          minutesSinceLastWatering: 60, // Below 240 min limit
        });
        const intervalCheck = checks.find((c) => c.guardrailType === "min_watering_interval");
        expect(intervalCheck?.passed).toBe(false);
        expect(intervalCheck?.message).toContain("minimum is");
      });

      it("should fail if no sensor reading when required", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          hasSensorReading: false,
        });
        const sensorCheck = checks.find((c) => c.guardrailType === "require_sensor_reading");
        expect(sensorCheck?.passed).toBe(false);
      });

      it("should fail if moisture at ceiling", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          currentMoisturePercent: 75, // At or above 70% ceiling
        });
        const moistureCheck = checks.find((c) => c.guardrailType === "moisture_ceiling");
        expect(moistureCheck?.passed).toBe(false);
        expect(moistureCheck?.message).toContain("do not water");
      });
    });

    describe("Level 3 (Auto within guardrails)", () => {
      it("should have more permissive limits", () => {
        const level2 = getGuardrails(2);
        const level3 = getGuardrails(3);
        expect(level3.maxWaterPerActionGallons).toBeGreaterThan(level2.maxWaterPerActionGallons);
        expect(level3.minWateringIntervalMinutes).toBeLessThan(level2.minWateringIntervalMinutes);
      });

      it("should pass larger water amounts", () => {
        const checks = checkGuardrails({
          automationLevel: 3,
          proposedWaterGallons: 4, // Would fail at level 2
          hasSensorReading: true,
        });
        const waterCheck = checks.find((c) => c.guardrailType === "max_water_per_action");
        expect(waterCheck?.passed).toBe(true);
      });
    });

    describe("Temperature checks", () => {
      it("should fail if temperature below floor (frost risk)", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          currentTempF: 32, // Below 35°F floor
        });
        const tempCheck = checks.find((c) => c.guardrailType === "temp_floor");
        expect(tempCheck?.passed).toBe(false);
        expect(tempCheck?.message).toContain("frost risk");
      });

      it("should pass if temperature above floor", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          currentTempF: 55,
        });
        const tempCheck = checks.find((c) => c.guardrailType === "temp_floor");
        expect(tempCheck?.passed).toBe(true);
      });
    });

    describe("EC checks", () => {
      it("should fail if EC above ceiling", () => {
        const checks = checkGuardrails({
          automationLevel: 2,
          currentEcMsCm: 4.0, // Above 3.0 ceiling
        });
        const ecCheck = checks.find((c) => c.guardrailType === "ec_ceiling");
        expect(ecCheck?.passed).toBe(false);
      });
    });
  });

  describe("Helper functions", () => {
    it("allGuardrailsPass returns true when all pass", () => {
      const checks: GuardrailCheck[] = [
        { guardrailType: "max_water_per_action", passed: true, message: "OK" },
        { guardrailType: "max_water_daily", passed: true, message: "OK" },
      ];
      expect(allGuardrailsPass(checks)).toBe(true);
    });

    it("allGuardrailsPass returns false when any fails", () => {
      const checks: GuardrailCheck[] = [
        { guardrailType: "max_water_per_action", passed: true, message: "OK" },
        { guardrailType: "max_water_daily", passed: false, message: "Failed" },
      ];
      expect(allGuardrailsPass(checks)).toBe(false);
    });

    it("getFailedGuardrails returns only failed checks", () => {
      const checks: GuardrailCheck[] = [
        { guardrailType: "max_water_per_action", passed: true, message: "OK" },
        { guardrailType: "max_water_daily", passed: false, message: "Failed" },
        { guardrailType: "temp_floor", passed: false, message: "Too cold" },
      ];
      const failed = getFailedGuardrails(checks);
      expect(failed.length).toBe(2);
      expect(failed.every((c) => !c.passed)).toBe(true);
    });
  });
});
