/**
 * IFTTT Webhooks Connector
 *
 * Generic actuator layer for farm_clawed. Uses IFTTT Webhooks to trigger
 * any downstream action - SmartLife devices, relays, email, SMS, etc.
 *
 * Key features:
 * - Proposal/Approval workflow (actions don't execute without approval)
 * - Simulation mode (test automations without side effects)
 * - Rate limiting and idempotency
 * - Event-based architecture for integration with audit system
 *
 * Usage:
 * ```typescript
 * import { IftttConnector, createIftttConnectorFromEnv } from "./connectors/ifttt-webhooks";
 *
 * // From environment
 * const connector = createIftttConnectorFromEnv();
 *
 * // Or manual config
 * const connector = new IftttConnector({
 *   webhookKey: "your_key",
 *   eventPrefix: "farm_clawed_",
 *   simulationMode: false,
 * });
 *
 * // Propose an action (creates approval entry)
 * const action = connector.proposeAction({
 *   event: "lemon_water_2min",
 *   payload: { value1: "zone1", value2: "120" },
 *   metadata: {
 *     reason: "Moisture below 20%",
 *     source: "automation:water-schedule",
 *     target: "Meyer Lemon Tree",
 *     confidence: 92,
 *   },
 * });
 *
 * // Approve the action
 * connector.approveAction(action.id);
 *
 * // Execute (fires webhook)
 * const result = await connector.executeAction(action.id);
 *
 * // Or simulate without side effects
 * const simResult = await connector.simulateAction({
 *   event: "lemon_water_2min",
 *   payload: { value1: "zone1" },
 *   metadata: { reason: "Test", source: "manual" },
 * });
 * ```
 */

export * from "./types.js";
export * from "./webhook.js";
export * from "./connector.js";
