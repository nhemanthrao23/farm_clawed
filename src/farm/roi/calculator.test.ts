/**
 * ROI Calculator Tests
 */

import { describe, it, expect } from "vitest";
import {
  calculateRoiMetrics,
  createRoiSnapshot,
  calculateCumulativeRoi,
  projectRoi,
  type RoiCalculationInputs,
} from "./calculator.js";

describe("ROI Calculator", () => {
  const sampleInputs: RoiCalculationInputs = {
    baselineWaterGallons: 30,
    actualWaterGallons: 20,
    waterCostPerGallon: 0.008,
    baselineHoursPerWeek: 2,
    actualHoursPerWeek: 1,
    hourlyValue: 25,
    periodWeeks: 4,
    plantValue: 75,
    lossRiskBaseline: 0.15,
    lossRiskWithMonitoring: 0.02,
    baselineInputsCost: 20,
    actualInputsCost: 15,
    harvestValue: 25,
    equipmentCost: 105,
    subscriptionCost: 0,
    apiCost: 0,
  };

  describe("calculateRoiMetrics", () => {
    it("calculates water savings", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      expect(metrics.waterSavedGallons).toBe(10);
      expect(metrics.waterSavedDollars).toBeCloseTo(0.08, 2);
    });

    it("calculates time savings", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      // 1 hour/week saved × 4 weeks = 4 hours
      expect(metrics.timeSavedHours).toBe(4);
      // 4 hours × $25/hour = $100
      expect(metrics.timeSavedDollars).toBe(100);
    });

    it("calculates avoided loss value", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      // $75 × (0.15 - 0.02) = $9.75
      expect(metrics.avoidedLossDollars).toBeCloseTo(9.75, 2);
    });

    it("calculates total benefit", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      const expectedTotal =
        metrics.waterSavedDollars +
        metrics.timeSavedDollars +
        metrics.avoidedLossDollars +
        metrics.inputSavingsDollars +
        metrics.harvestValueDollars;

      expect(metrics.totalBenefitDollars).toBeCloseTo(expectedTotal, 2);
    });

    it("handles zero savings", () => {
      const zeroInputs: RoiCalculationInputs = {
        ...sampleInputs,
        baselineWaterGallons: 20, // Same as actual
        actualWaterGallons: 20,
        baselineHoursPerWeek: 1, // Same as actual
        actualHoursPerWeek: 1,
      };

      const metrics = calculateRoiMetrics(zeroInputs, "2025-01");

      expect(metrics.waterSavedGallons).toBe(0);
      expect(metrics.timeSavedHours).toBe(0);
    });
  });

  describe("createRoiSnapshot", () => {
    it("creates snapshot with unique ID", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      const snapshot1 = createRoiSnapshot({
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
        metrics,
      });

      const snapshot2 = createRoiSnapshot({
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
        metrics,
      });

      expect(snapshot1.id).not.toBe(snapshot2.id);
    });

    it("includes automation and permaculture levels", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      const snapshot = createRoiSnapshot({
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
        metrics,
        automationLevel: 2,
        permacultureDepth: 1,
      });

      expect(snapshot.automationLevel).toBe(2);
      expect(snapshot.permacultureDepth).toBe(1);
    });
  });

  describe("calculateCumulativeRoi", () => {
    it("sums multiple snapshots", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      const snapshots = [
        createRoiSnapshot({ periodStart: "2025-01-01", periodEnd: "2025-01-31", metrics }),
        createRoiSnapshot({ periodStart: "2025-02-01", periodEnd: "2025-02-28", metrics }),
      ];

      const cumulative = calculateCumulativeRoi(snapshots, 105);

      expect(cumulative.totalWaterSavedGallons).toBe(20); // 10 × 2
      expect(cumulative.totalTimeSavedHours).toBe(8); // 4 × 2
    });

    it("calculates payback period", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      const snapshots = [
        createRoiSnapshot({ periodStart: "2025-01-01", periodEnd: "2025-01-31", metrics }),
      ];

      const cumulative = calculateCumulativeRoi(snapshots, 105);

      expect(cumulative.paybackMonths).not.toBeNull();
      expect(cumulative.paybackMonths!).toBeGreaterThan(0);
    });

    it("includes equipment cost in total costs", () => {
      const metrics = calculateRoiMetrics(sampleInputs, "2025-01");

      const snapshots = [
        createRoiSnapshot({ periodStart: "2025-01-01", periodEnd: "2025-01-31", metrics }),
      ];

      const cumulative = calculateCumulativeRoi(snapshots, 105);

      expect(cumulative.totalCostsDollars).toBeGreaterThanOrEqual(105);
    });
  });

  describe("projectRoi", () => {
    it("projects ROI over time", () => {
      const projection = projectRoi({
        monthlyBenefit: 50,
        monthlyCost: 0,
        initialEquipmentCost: 100,
        months: 6,
      });

      expect(projection.length).toBe(6);
      expect(projection[0].cumulativeBenefit).toBe(50);
      expect(projection[5].cumulativeBenefit).toBe(300);
    });

    it("calculates net ROI correctly", () => {
      const projection = projectRoi({
        monthlyBenefit: 50,
        monthlyCost: 10,
        initialEquipmentCost: 100,
        months: 3,
      });

      // Month 1: 50 benefit - (100 + 10) cost = -60
      expect(projection[0].netRoi).toBe(-60);

      // Month 3: 150 benefit - (100 + 30) cost = 20
      expect(projection[2].netRoi).toBe(20);
    });

    it("shows positive ROI after payback", () => {
      const projection = projectRoi({
        monthlyBenefit: 50,
        monthlyCost: 0,
        initialEquipmentCost: 100,
        months: 4,
      });

      // Payback at month 2 (100/50 = 2)
      expect(projection[1].netRoi).toBe(0);
      expect(projection[2].netRoi).toBeGreaterThan(0);
    });
  });
});
