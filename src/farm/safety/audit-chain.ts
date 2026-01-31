/**
 * Audit Chain - Tamper-Evident Action Log
 *
 * SHA256 hash chain for all farm actions, providing immutable audit trail.
 */

import { z } from "zod";
import { createHash } from "crypto";

// Audit entry types
export const AuditEntryTypeSchema = z.union([
  z.literal("action_proposed"),
  z.literal("action_approved"),
  z.literal("action_rejected"),
  z.literal("action_executed"),
  z.literal("action_failed"),
  z.literal("jidoka_triggered"),
  z.literal("jidoka_resolved"),
  z.literal("config_changed"),
  z.literal("sensor_reading"),
  z.literal("manual_log"),
  z.literal("system_event"),
]);

export type AuditEntryType = z.infer<typeof AuditEntryTypeSchema>;

// Audit entry
export const AuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  entryType: AuditEntryTypeSchema,
  actor: z.string().describe("Who/what performed the action"),
  target: z.string().optional().describe("What was acted upon"),
  action: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  previousHash: z.string(),
  hash: z.string(),
  signature: z.string().optional().describe("Optional cryptographic signature"),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

// Audit chain state
export interface AuditChainState {
  entries: AuditEntry[];
  lastHash: string;
  chainValid: boolean;
}

// Genesis hash (starting point for chain)
const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Calculate hash for an audit entry
 */
export function calculateEntryHash(entry: Omit<AuditEntry, "hash">): string {
  const data = JSON.stringify({
    id: entry.id,
    timestamp: entry.timestamp,
    entryType: entry.entryType,
    actor: entry.actor,
    target: entry.target,
    action: entry.action,
    details: entry.details,
    previousHash: entry.previousHash,
  });

  return createHash("sha256").update(data).digest("hex");
}

/**
 * Create a new audit entry
 */
export function createAuditEntry(params: {
  entryType: AuditEntryType;
  actor: string;
  action: string;
  target?: string;
  details?: Record<string, unknown>;
  previousHash?: string;
}): AuditEntry {
  const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();
  const previousHash = params.previousHash || GENESIS_HASH;

  const entryWithoutHash = {
    id,
    timestamp,
    entryType: params.entryType,
    actor: params.actor,
    target: params.target,
    action: params.action,
    details: params.details,
    previousHash,
  };

  const hash = calculateEntryHash(entryWithoutHash);

  return {
    ...entryWithoutHash,
    hash,
  };
}

/**
 * Verify an audit entry's hash
 */
export function verifyEntryHash(entry: AuditEntry): boolean {
  const expectedHash = calculateEntryHash(entry);
  return entry.hash === expectedHash;
}

/**
 * Verify the entire audit chain
 */
export function verifyAuditChain(entries: AuditEntry[]): {
  valid: boolean;
  invalidAt?: number;
  reason?: string;
} {
  if (entries.length === 0) {
    return { valid: true };
  }

  // Check first entry links to genesis
  if (entries[0].previousHash !== GENESIS_HASH) {
    return { valid: false, invalidAt: 0, reason: "First entry does not link to genesis hash" };
  }

  // Verify each entry
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Verify entry's own hash
    if (!verifyEntryHash(entry)) {
      return {
        valid: false,
        invalidAt: i,
        reason: `Entry ${i} hash is invalid (data may be tampered)`,
      };
    }

    // Verify chain link (except first entry)
    if (i > 0 && entry.previousHash !== entries[i - 1].hash) {
      return { valid: false, invalidAt: i, reason: `Entry ${i} does not link to previous entry` };
    }
  }

  return { valid: true };
}

/**
 * Append an entry to the chain
 */
export function appendToChain(
  chain: AuditEntry[],
  entry: Omit<AuditEntry, "hash" | "previousHash" | "id" | "timestamp">,
): AuditEntry {
  const lastHash = chain.length > 0 ? chain[chain.length - 1].hash : GENESIS_HASH;

  return createAuditEntry({
    ...entry,
    previousHash: lastHash,
  });
}

/**
 * Create chain state from entries
 */
export function createChainState(entries: AuditEntry[]): AuditChainState {
  const verification = verifyAuditChain(entries);
  return {
    entries,
    lastHash: entries.length > 0 ? entries[entries.length - 1].hash : GENESIS_HASH,
    chainValid: verification.valid,
  };
}

/**
 * Filter audit entries by type
 */
export function filterEntriesByType(entries: AuditEntry[], types: AuditEntryType[]): AuditEntry[] {
  return entries.filter((e) => types.includes(e.entryType));
}

/**
 * Filter audit entries by time range
 */
export function filterEntriesByTime(entries: AuditEntry[], start: Date, end: Date): AuditEntry[] {
  return entries.filter((e) => {
    const time = new Date(e.timestamp).getTime();
    return time >= start.getTime() && time <= end.getTime();
  });
}

/**
 * Format audit entry for display
 */
export function formatAuditEntry(entry: AuditEntry): string {
  const lines: string[] = [];

  lines.push(`[${entry.timestamp}] ${entry.entryType.toUpperCase()}`);
  lines.push(`  Actor: ${entry.actor}`);
  if (entry.target) {
    lines.push(`  Target: ${entry.target}`);
  }
  lines.push(`  Action: ${entry.action}`);
  lines.push(`  Hash: ${entry.hash.substring(0, 16)}...`);

  return lines.join("\n");
}

/**
 * Format audit chain summary
 */
export function formatChainSummary(state: AuditChainState): string {
  const lines: string[] = [];

  lines.push(`AUDIT CHAIN SUMMARY`);
  lines.push(`===================`);
  lines.push(`Total entries: ${state.entries.length}`);
  lines.push(`Chain valid: ${state.chainValid ? "YES ✓" : "NO ✗ - TAMPERING DETECTED"}`);
  lines.push(`Last hash: ${state.lastHash.substring(0, 16)}...`);

  if (state.entries.length > 0) {
    const firstEntry = state.entries[0];
    const lastEntry = state.entries[state.entries.length - 1];
    lines.push(`First entry: ${firstEntry.timestamp}`);
    lines.push(`Last entry: ${lastEntry.timestamp}`);

    // Count by type
    const typeCounts: Record<string, number> = {};
    for (const entry of state.entries) {
      typeCounts[entry.entryType] = (typeCounts[entry.entryType] || 0) + 1;
    }
    lines.push(`\nBy type:`);
    for (const [type, count] of Object.entries(typeCounts)) {
      lines.push(`  ${type}: ${count}`);
    }
  }

  return lines.join("\n");
}

/**
 * Export chain for backup/verification
 */
export function exportChain(entries: AuditEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

/**
 * Import and verify chain from export
 */
export function importChain(json: string): {
  entries: AuditEntry[];
  valid: boolean;
  error?: string;
} {
  try {
    const entries = JSON.parse(json) as AuditEntry[];
    const verification = verifyAuditChain(entries);
    return { entries, valid: verification.valid, error: verification.reason };
  } catch (err) {
    return { entries: [], valid: false, error: `Parse error: ${err}` };
  }
}
