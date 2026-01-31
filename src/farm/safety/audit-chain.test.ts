/**
 * Audit Chain Tests
 */

import { describe, it, expect } from "vitest";
import {
  createAuditEntry,
  verifyEntryHash,
  verifyAuditChain,
  appendToChain,
  createChainState,
} from "./audit-chain.js";

describe("Audit Chain", () => {
  describe("createAuditEntry", () => {
    it("creates entry with hash", () => {
      const entry = createAuditEntry({
        entryType: "action_executed",
        actor: "test_user",
        action: "Water zone 1",
      });

      expect(entry.hash).toBeDefined();
      expect(entry.hash.length).toBe(64); // SHA256 hex
    });

    it("creates entries with different hashes for different data", () => {
      const entry1 = createAuditEntry({
        entryType: "action_executed",
        actor: "user1",
        action: "Action 1",
      });

      const entry2 = createAuditEntry({
        entryType: "action_executed",
        actor: "user2",
        action: "Action 2",
      });

      expect(entry1.hash).not.toBe(entry2.hash);
    });

    it("uses genesis hash for first entry", () => {
      const entry = createAuditEntry({
        entryType: "system_event",
        actor: "system",
        action: "Initialize",
      });

      expect(entry.previousHash).toBe(
        "0000000000000000000000000000000000000000000000000000000000000000",
      );
    });
  });

  describe("verifyEntryHash", () => {
    it("verifies valid entry", () => {
      const entry = createAuditEntry({
        entryType: "action_executed",
        actor: "test",
        action: "Test action",
      });

      expect(verifyEntryHash(entry)).toBe(true);
    });

    it("detects tampered entry", () => {
      const entry = createAuditEntry({
        entryType: "action_executed",
        actor: "test",
        action: "Test action",
      });

      // Tamper with the entry
      const tampered = { ...entry, action: "Tampered action" };

      expect(verifyEntryHash(tampered)).toBe(false);
    });
  });

  describe("verifyAuditChain", () => {
    it("validates empty chain", () => {
      const result = verifyAuditChain([]);
      expect(result.valid).toBe(true);
    });

    it("validates single entry chain", () => {
      const entry = createAuditEntry({
        entryType: "system_event",
        actor: "system",
        action: "Start",
      });

      const result = verifyAuditChain([entry]);
      expect(result.valid).toBe(true);
    });

    it("validates multi-entry chain", () => {
      const entries = [];

      let prevHash = undefined;
      for (let i = 0; i < 5; i++) {
        const entry = createAuditEntry({
          entryType: "system_event",
          actor: "system",
          action: `Event ${i}`,
          previousHash: prevHash,
        });
        entries.push(entry);
        prevHash = entry.hash;
      }

      const result = verifyAuditChain(entries);
      expect(result.valid).toBe(true);
    });

    it("detects broken chain", () => {
      const entry1 = createAuditEntry({
        entryType: "system_event",
        actor: "system",
        action: "Event 1",
      });

      const entry2 = createAuditEntry({
        entryType: "system_event",
        actor: "system",
        action: "Event 2",
        previousHash: "invalid_hash",
      });

      const result = verifyAuditChain([entry1, entry2]);
      expect(result.valid).toBe(false);
      expect(result.invalidAt).toBe(1);
    });
  });

  describe("appendToChain", () => {
    it("appends with correct previous hash", () => {
      const chain = [
        createAuditEntry({
          entryType: "system_event",
          actor: "system",
          action: "Start",
        }),
      ];

      const newEntry = appendToChain(chain, {
        entryType: "action_executed",
        actor: "user",
        action: "New action",
      });

      expect(newEntry.previousHash).toBe(chain[0].hash);
    });
  });

  describe("createChainState", () => {
    it("calculates chain validity", () => {
      const entries = [];
      let prevHash = undefined;

      for (let i = 0; i < 3; i++) {
        const entry = createAuditEntry({
          entryType: "system_event",
          actor: "system",
          action: `Event ${i}`,
          previousHash: prevHash,
        });
        entries.push(entry);
        prevHash = entry.hash;
      }

      const state = createChainState(entries);

      expect(state.chainValid).toBe(true);
      expect(state.entries.length).toBe(3);
      expect(state.lastHash).toBe(entries[2].hash);
    });
  });
});
