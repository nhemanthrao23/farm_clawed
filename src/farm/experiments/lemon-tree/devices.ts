/**
 * Lemon Tree Experiment - Device Configuration
 *
 * SmartLife/Tuya device setup and scene definitions.
 */

import { z } from "zod";

// Device configuration
export const DeviceConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.union([z.literal("sensor"), z.literal("valve"), z.literal("hub")]),
  platform: z.union([z.literal("tuya"), z.literal("smartlife"), z.literal("ifttt")]),
  deviceId: z.string(),
  capabilities: z.array(z.string()),
  lastSeen: z.string().optional(),
  online: z.boolean().default(false),
});

export type DeviceConfig = z.infer<typeof DeviceConfigSchema>;

// Scene definition for IFTTT
export const IftttSceneSchema = z.object({
  name: z.string(),
  eventName: z.string(),
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  safetyChecks: z.array(z.string()),
});

export type IftttScene = z.infer<typeof IftttSceneSchema>;

// Device configurations for the lemon tree experiment
export const LEMON_DEVICES: DeviceConfig[] = [
  {
    id: "hub-1",
    name: "SmartLife Hub",
    type: "hub",
    platform: "tuya",
    deviceId: "tuya_hub_001",
    capabilities: ["zigbee_bridge", "wifi_relay"],
    online: false,
  },
  {
    id: "sensor-lemon-1",
    name: "Lemon Soil Sensor",
    type: "sensor",
    platform: "tuya",
    deviceId: "tuya_lemon_sensor_1",
    capabilities: ["moisture", "temperature", "ec", "battery"],
    online: false,
  },
  {
    id: "valve-lemon-1",
    name: "Lemon Water Valve",
    type: "valve",
    platform: "tuya",
    deviceId: "tuya_valve_lemon_1",
    capabilities: ["on_off", "timer", "flow_sensor"],
    online: false,
  },
];

// IFTTT scenes for automated watering
export const LEMON_SCENES: IftttScene[] = [
  {
    name: "FARM_LEMON_WATER_1MIN",
    eventName: "farm_lemon_water_1min",
    description: "Water lemon tree for 1 minute (~0.5 gallons)",
    parameters: {
      duration_seconds: 60,
      estimated_gallons: 0.5,
    },
    safetyChecks: ["moisture_below_70", "no_recent_watering_4h", "daily_limit_not_exceeded"],
  },
  {
    name: "FARM_LEMON_WATER_2MIN",
    eventName: "farm_lemon_water_2min",
    description: "Water lemon tree for 2 minutes (~1.0 gallons)",
    parameters: {
      duration_seconds: 120,
      estimated_gallons: 1.0,
    },
    safetyChecks: ["moisture_below_60", "no_recent_watering_4h", "daily_limit_not_exceeded"],
  },
  {
    name: "FARM_LEMON_WATER_5MIN",
    eventName: "farm_lemon_water_5min",
    description: "Deep water lemon tree for 5 minutes (~2.5 gallons)",
    parameters: {
      duration_seconds: 300,
      estimated_gallons: 2.5,
    },
    safetyChecks: [
      "moisture_below_40",
      "no_recent_watering_8h",
      "daily_limit_not_exceeded",
      "requires_approval_level_2",
    ],
  },
  {
    name: "FARM_LEMON_STOP",
    eventName: "farm_lemon_stop",
    description: "Emergency stop - close valve immediately",
    parameters: {},
    safetyChecks: [], // No checks for emergency stop
  },
  {
    name: "FARM_ALL_OFF",
    eventName: "farm_all_off",
    description: "Emergency stop all - close all valves",
    parameters: {},
    safetyChecks: [],
  },
];

/**
 * Get device by ID
 */
export function getDevice(deviceId: string): DeviceConfig | undefined {
  return LEMON_DEVICES.find((d) => d.id === deviceId || d.deviceId === deviceId);
}

/**
 * Get scene by name
 */
export function getScene(sceneName: string): IftttScene | undefined {
  return LEMON_SCENES.find((s) => s.name === sceneName || s.eventName === sceneName);
}

/**
 * Get all scenes for a device type
 */
export function getScenesForDevice(deviceType: DeviceConfig["type"]): IftttScene[] {
  // For now, all scenes are for the valve
  if (deviceType === "valve") {
    return LEMON_SCENES;
  }
  return [];
}

/**
 * Validate scene safety checks
 */
export function validateSceneSafetyChecks(
  scene: IftttScene,
  context: {
    currentMoisture?: number;
    lastWateredMinutesAgo?: number;
    dailyWaterUsed?: number;
    dailyLimit?: number;
    automationLevel?: number;
  },
): { valid: boolean; failedChecks: string[] } {
  const failedChecks: string[] = [];

  for (const check of scene.safetyChecks) {
    switch (check) {
      case "moisture_below_70":
        if (context.currentMoisture !== undefined && context.currentMoisture >= 70) {
          failedChecks.push(`Moisture ${context.currentMoisture}% >= 70%`);
        }
        break;

      case "moisture_below_60":
        if (context.currentMoisture !== undefined && context.currentMoisture >= 60) {
          failedChecks.push(`Moisture ${context.currentMoisture}% >= 60%`);
        }
        break;

      case "moisture_below_40":
        if (context.currentMoisture !== undefined && context.currentMoisture >= 40) {
          failedChecks.push(`Moisture ${context.currentMoisture}% >= 40%`);
        }
        break;

      case "no_recent_watering_4h":
        if (context.lastWateredMinutesAgo !== undefined && context.lastWateredMinutesAgo < 240) {
          failedChecks.push(`Watered ${context.lastWateredMinutesAgo} min ago (< 4h)`);
        }
        break;

      case "no_recent_watering_8h":
        if (context.lastWateredMinutesAgo !== undefined && context.lastWateredMinutesAgo < 480) {
          failedChecks.push(`Watered ${context.lastWateredMinutesAgo} min ago (< 8h)`);
        }
        break;

      case "daily_limit_not_exceeded":
        if (context.dailyWaterUsed !== undefined && context.dailyLimit !== undefined) {
          const sceneGallons = (scene.parameters?.estimated_gallons as number) || 0;
          if (context.dailyWaterUsed + sceneGallons > context.dailyLimit) {
            failedChecks.push(
              `Would exceed daily limit (${context.dailyWaterUsed} + ${sceneGallons} > ${context.dailyLimit})`,
            );
          }
        }
        break;

      case "requires_approval_level_2":
        if (context.automationLevel !== undefined && context.automationLevel < 2) {
          failedChecks.push(`Requires automation level 2+ (current: ${context.automationLevel})`);
        }
        break;
    }
  }

  return {
    valid: failedChecks.length === 0,
    failedChecks,
  };
}

/**
 * Format device status for display
 */
export function formatDeviceStatus(device: DeviceConfig): string {
  const lines: string[] = [];
  lines.push(`${device.name} (${device.id})`);
  lines.push(`  Type: ${device.type}`);
  lines.push(`  Platform: ${device.platform}`);
  lines.push(`  Device ID: ${device.deviceId}`);
  lines.push(`  Capabilities: ${device.capabilities.join(", ")}`);
  lines.push(`  Status: ${device.online ? "Online" : "Offline"}`);
  if (device.lastSeen) {
    lines.push(`  Last Seen: ${device.lastSeen}`);
  }
  return lines.join("\n");
}
