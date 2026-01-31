/**
 * Lemon Tree Experiment - Main Experiment Logic
 *
 * Orchestrates the lemon tree biodome experiment.
 */

import type { SensorReading } from "../../schemas/sensor-readings.js";
import type { RoiSnapshot } from "../../roi/calculator.js";
import { getLemonExperimentSeedData, SEED_READINGS } from "./seed-data.js";
import { LEMON_DEVICES, LEMON_SCENES, validateSceneSafetyChecks } from "./devices.js";
import { generateFallbackResponse, buildFallbackContext } from "../../ai/fallback.js";

// Experiment status
export interface ExperimentStatus {
  id: string;
  name: string;
  description: string;
  startDate: string;
  currentPhase: string;
  daysActive: number;
  latestReadings: {
    moisture?: number;
    temperature?: number;
    ec?: number;
    battery?: number;
    timestamp?: string;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: "info" | "warning" | "critical";
    timestamp: string;
  }>;
  actions: Array<{
    type: string;
    timestamp: string;
    status: string;
  }>;
  roiSummary: {
    totalWaterSavedGallons: number;
    totalTimeSavedHours: number;
    estimatedValueDollars: number;
  };
}

// Experiment data store (in-memory for now)
let experimentReadings: SensorReading[] = [...SEED_READINGS];
let experimentAlerts: ExperimentStatus["alerts"] = [];
let experimentActions: ExperimentStatus["actions"] = [];
let experimentRoiSnapshots: RoiSnapshot[] = [];

/**
 * Get current experiment status
 */
export function getExperimentStatus(): ExperimentStatus {
  const seedData = getLemonExperimentSeedData();
  const startDate = new Date("2025-01-31");
  const now = new Date();
  const daysActive = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Get latest readings
  const latestReadings: ExperimentStatus["latestReadings"] = {};
  for (const reading of experimentReadings) {
    const existingTime = latestReadings.timestamp
      ? new Date(latestReadings.timestamp).getTime()
      : 0;
    const readingTime = new Date(reading.timestamp).getTime();

    if (readingTime >= existingTime) {
      latestReadings.timestamp = reading.timestamp;
    }

    switch (reading.reading_type) {
      case "moisture":
        if (!latestReadings.moisture || readingTime > existingTime) {
          latestReadings.moisture = reading.value;
        }
        break;
      case "temperature":
        if (!latestReadings.temperature || readingTime > existingTime) {
          latestReadings.temperature = reading.value;
        }
        break;
      case "ec":
        if (!latestReadings.ec || readingTime > existingTime) {
          latestReadings.ec = reading.value;
        }
        break;
    }
    if (reading.battery_pct !== undefined) {
      latestReadings.battery = reading.battery_pct;
    }
  }

  // Calculate ROI summary
  let totalWaterSaved = 0;
  let totalTimeSaved = 0;
  for (const snapshot of experimentRoiSnapshots) {
    totalWaterSaved += snapshot.metrics.waterSavedGallons;
    totalTimeSaved += snapshot.metrics.timeSavedHours;
  }
  const estimatedValue = totalWaterSaved * 0.008 + totalTimeSaved * 25;

  // Determine current phase
  let currentPhase = "Monitoring";
  if (daysActive < 7) {
    currentPhase = "Initial Assessment";
  } else if (daysActive < 30) {
    currentPhase = "Establishing Baseline";
  } else if (daysActive < 90) {
    currentPhase = "Optimization";
  } else {
    currentPhase = "Steady State";
  }

  return {
    id: "lemon-tree",
    name: seedData.profile.name,
    description: "Meyer Lemon container experiment demonstrating farm_clawed capabilities",
    startDate: startDate.toISOString(),
    currentPhase,
    daysActive,
    latestReadings,
    alerts: experimentAlerts.slice(-10), // Last 10 alerts
    actions: experimentActions.slice(-10), // Last 10 actions
    roiSummary: {
      totalWaterSavedGallons: totalWaterSaved,
      totalTimeSavedHours: totalTimeSaved,
      estimatedValueDollars: estimatedValue,
    },
  };
}

/**
 * Add sensor reading to experiment
 */
export function addExperimentReading(reading: SensorReading): void {
  experimentReadings.push(reading);

  // Check for alerts
  checkForAlerts(reading);
}

/**
 * Check for alert conditions
 */
function checkForAlerts(reading: SensorReading): void {
  const now = new Date().toISOString();

  switch (reading.reading_type) {
    case "moisture":
      if (reading.value < 15) {
        experimentAlerts.push({
          type: "moisture_critical",
          message: `Critical: Soil moisture ${reading.value}% - immediate watering needed`,
          severity: "critical",
          timestamp: now,
        });
      } else if (reading.value < 25) {
        experimentAlerts.push({
          type: "moisture_low",
          message: `Warning: Soil moisture ${reading.value}% - schedule watering`,
          severity: "warning",
          timestamp: now,
        });
      } else if (reading.value > 80) {
        experimentAlerts.push({
          type: "moisture_high",
          message: `Warning: Soil moisture ${reading.value}% - check drainage`,
          severity: "warning",
          timestamp: now,
        });
      }
      break;

    case "temperature":
      if (reading.value < 35) {
        experimentAlerts.push({
          type: "frost_risk",
          message: `Critical: Soil temperature ${reading.value}°F - frost protection needed`,
          severity: "critical",
          timestamp: now,
        });
      } else if (reading.value < 45) {
        experimentAlerts.push({
          type: "cold_soil",
          message: `Info: Soil temperature ${reading.value}°F - plant dormant, reduce watering`,
          severity: "info",
          timestamp: now,
        });
      }
      break;

    case "ec":
      if (reading.value > 3.0) {
        experimentAlerts.push({
          type: "ec_high",
          message: `Warning: EC ${reading.value} mS/cm - possible salt buildup`,
          severity: "warning",
          timestamp: now,
        });
      }
      break;
  }

  // Check battery
  if (reading.battery_pct !== undefined && reading.battery_pct < 20) {
    experimentAlerts.push({
      type: "battery_low",
      message: `Warning: Sensor battery at ${reading.battery_pct}%`,
      severity: "warning",
      timestamp: now,
    });
  }
}

/**
 * Log an action
 */
export function logExperimentAction(action: { type: string; status: string }): void {
  experimentActions.push({
    ...action,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get AI analysis for current state
 */
export function getExperimentAnalysis(): {
  analysis: string;
  recommendations: Array<{ action: string; priority: string; reasoning: string }>;
  sourcesUsed: string[];
} {
  const context = buildFallbackContext(experimentReadings, {
    permacultureDepth: 1,
    automationLevel: 1,
  });

  const response = generateFallbackResponse(context);

  return {
    analysis: response.content,
    recommendations: response.recommendations || [],
    sourcesUsed: response.sourcesUsed,
  };
}

/**
 * Execute a watering scene with safety checks
 */
export function executeWateringScene(
  sceneName: string,
  context: {
    automationLevel: number;
  },
): { success: boolean; message: string; approvalRequired?: boolean } {
  const scene = LEMON_SCENES.find((s) => s.name === sceneName);
  if (!scene) {
    return { success: false, message: `Scene ${sceneName} not found` };
  }

  // Get latest moisture reading
  const latestMoisture = experimentReadings
    .filter((r) => r.reading_type === "moisture")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  // Get last watering action
  const lastWatering = experimentActions
    .filter((a) => a.type.includes("water"))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const lastWateredMinutesAgo = lastWatering
    ? (Date.now() - new Date(lastWatering.timestamp).getTime()) / (1000 * 60)
    : Infinity;

  // Validate safety checks
  const validation = validateSceneSafetyChecks(scene, {
    currentMoisture: latestMoisture?.value,
    lastWateredMinutesAgo,
    dailyWaterUsed: 0, // Would be calculated from today's actions
    dailyLimit: 5,
    automationLevel: context.automationLevel,
  });

  if (!validation.valid) {
    return {
      success: false,
      message: `Safety checks failed: ${validation.failedChecks.join("; ")}`,
    };
  }

  // Check if approval is required
  if (context.automationLevel < 3) {
    return {
      success: false,
      message: "Approval required for this action",
      approvalRequired: true,
    };
  }

  // Log the action
  logExperimentAction({
    type: `water_${scene.name}`,
    status: "executed",
  });

  return {
    success: true,
    message: `Executed ${scene.name} - ${scene.description}`,
  };
}

/**
 * Get experiment devices
 */
export function getExperimentDevices() {
  return LEMON_DEVICES;
}

/**
 * Get available scenes
 */
export function getExperimentScenes() {
  return LEMON_SCENES;
}

/**
 * Format experiment status for display
 */
export function formatExperimentStatus(status: ExperimentStatus): string {
  const lines: string[] = [];

  lines.push(`EXPERIMENT: ${status.name}`);
  lines.push(`ID: ${status.id}`);
  lines.push(`Started: ${status.startDate}`);
  lines.push(`Days Active: ${status.daysActive}`);
  lines.push(`Phase: ${status.currentPhase}`);
  lines.push("");
  lines.push("LATEST READINGS:");
  if (status.latestReadings.moisture !== undefined) {
    lines.push(`  Moisture: ${status.latestReadings.moisture}%`);
  }
  if (status.latestReadings.temperature !== undefined) {
    lines.push(`  Temperature: ${status.latestReadings.temperature}°F`);
  }
  if (status.latestReadings.ec !== undefined) {
    lines.push(`  EC: ${status.latestReadings.ec} mS/cm`);
  }
  if (status.latestReadings.battery !== undefined) {
    lines.push(`  Battery: ${status.latestReadings.battery}%`);
  }
  lines.push("");
  lines.push("ROI SUMMARY:");
  lines.push(`  Water Saved: ${status.roiSummary.totalWaterSavedGallons.toFixed(1)} gallons`);
  lines.push(`  Time Saved: ${status.roiSummary.totalTimeSavedHours.toFixed(1)} hours`);
  lines.push(`  Estimated Value: $${status.roiSummary.estimatedValueDollars.toFixed(2)}`);

  if (status.alerts.length > 0) {
    lines.push("");
    lines.push("RECENT ALERTS:");
    for (const alert of status.alerts.slice(-5)) {
      lines.push(`  [${alert.severity.toUpperCase()}] ${alert.message}`);
    }
  }

  return lines.join("\n");
}

/**
 * Reset experiment data (for testing)
 */
export function resetExperimentData(): void {
  experimentReadings = [...SEED_READINGS];
  experimentAlerts = [];
  experimentActions = [];
  experimentRoiSnapshots = [];
}
