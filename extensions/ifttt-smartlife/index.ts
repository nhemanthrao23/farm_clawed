/**
 * IFTTT SmartLife Extension
 *
 * Provides actuator control through IFTTT webhooks for SmartLife/Tuya devices.
 */

export * from "./webhook.js";
export * from "./scenes.js";
export * from "./approval-gate.js";

import type { IftttConfig } from "./webhook.js";

/**
 * Extension entry point
 */
export function createIftttSmartLifeExtension(config: IftttConfig) {
  return {
    name: "ifttt-smartlife",
    version: "1.0.0",
    config,
  };
}

