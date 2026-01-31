/**
 * farm_clawed - AI-first Farm Operator
 *
 * This module provides farm automation capabilities with permaculture-ready features.
 */

export * from "./schemas/index.js";
export * from "./safety/index.js";
export * from "./ai/index.js";
export * from "./roi/index.js";
export * from "./photos/index.js";
export * from "./gateway/index.js";
export * from "./cli/index.js";

// Re-export types
export type {
  FarmProfile,
  FarmMap,
  WaterAsset,
  SensorReading,
  SeasonCalendar,
  ZoneDefinition,
  SectorDefinition,
  GuildDefinition,
  SuccessionPlan,
  WaterBudget,
} from "./schemas/index.js";

export type {
  JidokaEvent,
  StopTriggerType,
  GuardrailCheck,
  ApprovalRequest,
  AuditEntry,
} from "./safety/index.js";

export type { ToolTier, RoiMetrics, RoiSnapshot } from "./roi/index.js";

export type { PhotoTag, PhotoMetadata } from "./photos/index.js";

export type { FarmAIConfig, FarmAIResponse, FarmAIContext } from "./ai/index.js";
