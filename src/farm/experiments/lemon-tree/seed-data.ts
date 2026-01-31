/**
 * Lemon Tree Experiment - Seed Data
 *
 * Initial readings and configuration for the Santa Teresa lemon tree experiment.
 */

import type { SensorReading } from "../../schemas/sensor-readings.js";
import type { FarmProfile } from "../../schemas/farm-profile.js";
import type { WaterAsset } from "../../schemas/water-assets.js";

// Day 1 seed readings (January 31, 2025)
export const SEED_READINGS: SensorReading[] = [
  {
    timestamp: "2025-01-31T08:00:00Z",
    sensor_id: "tuya_lemon_sensor_1",
    reading_type: "moisture",
    value: 17,
    unit: "percent",
    battery_pct: 57,
  },
  {
    timestamp: "2025-01-31T08:00:00Z",
    sensor_id: "tuya_lemon_sensor_1",
    reading_type: "temperature",
    value: 54.5,
    unit: "fahrenheit",
    battery_pct: 57,
  },
  {
    timestamp: "2025-01-31T08:00:00Z",
    sensor_id: "tuya_lemon_sensor_1",
    reading_type: "ec",
    value: 0.001,
    unit: "mS/cm",
    battery_pct: 57,
  },
];

// Farm profile for the lemon tree experiment
export const LEMON_EXPERIMENT_PROFILE: FarmProfile = {
  name: "Santa Teresa Lemon Tree Biodome",
  location: {
    latitude: 37.2441,
    longitude: -121.8825,
    elevation_m: 200,
    timezone: "America/Los_Angeles",
  },
  climate: {
    zone: "9b",
    avg_rainfall_mm: 380,
    frost_free_days: 280,
    last_frost: "02-15",
    first_frost: "11-30",
  },
  constraints: {
    water_source: "municipal",
    water_cost_per_gallon: 0.008,
    max_daily_gallons: 10,
    power_available: true,
    internet_available: true,
  },
  scale: {
    type: "container",
    area_sqft: 4,
    plant_count: 1,
  },
  owner: {
    name: "Rahul",
    experience_years: 1,
    goals: [
      "Learn container citrus care",
      "Minimize water waste with smart monitoring",
      "Track ROI of home automation",
      "Demonstrate farm_clawed capabilities",
    ],
  },
};

// Water assets for the experiment
export const LEMON_EXPERIMENT_ASSETS: WaterAsset[] = [
  {
    asset_id: "WS001",
    asset_type: "source",
    name: "House Spigot",
    location: "backyard",
    capacity_gpm: 5.0,
    smart_enabled: false,
  },
  {
    asset_id: "V001",
    asset_type: "valve",
    name: "Lemon Tree Valve",
    location: "lemon-container",
    capacity_gpm: 2.0,
    connected_to: "WS001",
    smart_enabled: true,
    device_id: "tuya_valve_lemon_1",
    device_platform: "tuya",
  },
  {
    asset_id: "S001",
    asset_type: "sensor",
    name: "Lemon Soil Sensor",
    location: "lemon-container",
    connected_to: "V001",
    smart_enabled: true,
    device_id: "tuya_lemon_sensor_1",
    device_platform: "tuya",
    notes: "Tuya Solar Soil Sensor - Moisture + Temp + EC",
  },
];

// ROI tracking inputs for the experiment
export const LEMON_EXPERIMENT_ROI_INPUTS = {
  tracking_period: "monthly" as const,
  costs: {
    water: {
      rate_per_gallon: 0.008,
      baseline_monthly_gallons: 30, // Estimate without monitoring
    },
    inputs: {
      fertilizer_monthly: 3.0,
    },
    time: {
      hourly_value: 25.0,
      baseline_hours_per_week: 0.5, // 30 min/week checking manually
    },
    equipment: {
      sensor_cost: 35.0,
      valve_cost: 45.0,
      hub_cost: 25.0,
    },
  },
  values: {
    harvest: {
      expected_units_per_year: 50,
      value_per_unit: 0.5, // Per lemon
      unit_name: "lemons",
    },
    avoided_loss: {
      plant_replacement_cost: 75.0,
      probability_without_monitoring: 0.15,
      probability_with_monitoring: 0.02,
    },
  },
  goals: {
    target_water_savings_percent: 20,
    target_time_savings_percent: 50,
    payback_target_months: 12,
  },
};

// Initial analysis for Day 1
export const DAY_1_ANALYSIS = {
  timestamp: "2025-01-31T08:00:00Z",
  summary: "Initial assessment of Meyer Lemon in container",
  observations: [
    {
      metric: "Soil Moisture",
      value: "17%",
      status: "low",
      concern: "Below optimal range (30-60%)",
      action: "Schedule watering today",
    },
    {
      metric: "Soil Temperature",
      value: "54.5°F",
      status: "cool",
      concern: "Within safe range but soil biology is slow",
      action: "Monitor overnight temps for frost risk",
    },
    {
      metric: "EC",
      value: "0.001 mS/cm",
      status: "very_low",
      concern: "Indicates minimal dissolved nutrients",
      action: "Plan light fertilization for spring",
    },
    {
      metric: "Battery",
      value: "57%",
      status: "ok",
      concern: "Solar charging should maintain",
      action: "Monitor if drops below 30%",
    },
  ],
  recommendations: [
    {
      priority: "high",
      action: "Water lemon tree with 0.5-1.0 gallons",
      reasoning: "Moisture at 17% is below stress threshold for citrus",
      timing: "Today, morning preferred",
    },
    {
      priority: "medium",
      action: "Monitor overnight temperature",
      reasoning: "54°F soil temp with winter conditions warrants watch",
      timing: "Check forecast tonight",
    },
    {
      priority: "low",
      action: "Plan spring fertilization",
      reasoning: "EC very low but winter dormancy means no urgency",
      timing: "February-March",
    },
  ],
  sources_used: [
    "sensor_readings (tuya_lemon_sensor_1)",
    "farm_profile (zone 9b, citrus)",
    "season_calendar (winter)",
    "irrigation-policy skill",
  ],
};

/**
 * Get seed data for the experiment
 */
export function getLemonExperimentSeedData() {
  return {
    profile: LEMON_EXPERIMENT_PROFILE,
    assets: LEMON_EXPERIMENT_ASSETS,
    readings: SEED_READINGS,
    roiInputs: LEMON_EXPERIMENT_ROI_INPUTS,
    day1Analysis: DAY_1_ANALYSIS,
  };
}

/**
 * Validate experiment setup
 */
export function validateExperimentSetup(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check profile
  if (!LEMON_EXPERIMENT_PROFILE.name) {
    issues.push("Missing experiment name");
  }

  // Check assets
  const sensors = LEMON_EXPERIMENT_ASSETS.filter(
    (a) => a.asset_type === "sensor" && a.smart_enabled,
  );
  if (sensors.length === 0) {
    issues.push("No smart sensors configured");
  }

  // Check seed readings
  if (SEED_READINGS.length === 0) {
    issues.push("No seed readings provided");
  }

  const hasRequired = ["moisture", "temperature"].every((type) =>
    SEED_READINGS.some((r) => r.reading_type === type),
  );
  if (!hasRequired) {
    issues.push("Missing required reading types (moisture, temperature)");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
