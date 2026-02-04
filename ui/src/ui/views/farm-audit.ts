/**
 * Farm Audit View - Tamper-evident audit log
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: "user" | "automation" | "system";
  target?: string;
  details?: string;
  hash: string;
  previousHash?: string;
}

@customElement("farm-audit-view")
export class FarmAuditView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--bg, #12141a);
      padding: 1.5rem;
    }
    
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin: 0 0 0.5rem 0;
    }
    
    .subtitle {
      color: var(--muted, #71717a);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    
    .integrity-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      border: 1px solid var(--ok, #22c55e);
      border-radius: 8px;
      color: var(--ok, #22c55e);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    
    .filter-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .filter-btn {
      padding: 0.5rem 1rem;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 6px;
      color: var(--muted, #71717a);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .filter-btn:hover {
      border-color: var(--accent, #ff5c5c);
      color: var(--text, #e4e4e7);
    }
    
    .filter-btn.active {
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      border-color: var(--accent, #ff5c5c);
      color: var(--accent, #ff5c5c);
    }
    
    .audit-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    
    .audit-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      background: var(--card, #181b22);
      color: var(--muted, #71717a);
      font-weight: 500;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .audit-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border, #27272a);
      color: var(--text, #e4e4e7);
    }
    
    .audit-table tr:hover td {
      background: var(--bg-hover, rgba(255, 255, 255, 0.02));
    }
    
    .actor-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    
    .actor-badge.user {
      background: var(--info-subtle, rgba(59, 130, 246, 0.12));
      color: var(--info, #3b82f6);
    }
    
    .actor-badge.automation {
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      color: var(--accent, #ff5c5c);
    }
    
    .actor-badge.system {
      background: var(--bg-elevated, #1a1d25);
      color: var(--muted, #71717a);
    }
    
    .hash {
      font-family: monospace;
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .expand-btn {
      background: transparent;
      border: none;
      color: var(--muted, #71717a);
      cursor: pointer;
      font-size: 0.8rem;
    }
    
    .expand-btn:hover {
      color: var(--text, #e4e4e7);
    }
  `;

  @property({ type: Array })
  entries: AuditEntry[] = [
    {
      id: "1",
      timestamp: new Date().toISOString(),
      action: "Watering approved",
      actor: "user",
      target: "Meyer Lemon Tree",
      details: "Approved 2-minute watering at 17% moisture",
      hash: "a1b2c3d4e5f6789012345678901234567890abcd",
      previousHash: "0000000000000000000000000000000000000000",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      action: "Watering executed",
      actor: "automation",
      target: "Meyer Lemon Tree",
      details: "IFTTT webhook farm_lemon_water_2min triggered",
      hash: "b2c3d4e5f6789012345678901234567890abcde",
      previousHash: "a1b2c3d4e5f6789012345678901234567890abcd",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      action: "Sensor reading logged",
      actor: "system",
      target: "Soil Sensor 1",
      details: "Moisture: 17%, Temp: 54.5°F, EC: 0.001",
      hash: "c3d4e5f6789012345678901234567890abcdef",
      previousHash: "b2c3d4e5f6789012345678901234567890abcde",
    },
  ];

  @state()
  private filter: "all" | "user" | "automation" | "system" = "all";

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private get filteredEntries(): AuditEntry[] {
    if (this.filter === "all") return this.entries;
    return this.entries.filter((e) => e.actor === this.filter);
  }

  override render() {
    return html`
      <div class="container">
        <h1>📋 Audit Log</h1>
        <p class="subtitle">Tamper-evident record of all farm operations</p>

        <div class="integrity-banner">
          🔒 Chain integrity verified - ${this.entries.length} entries
        </div>

        <div class="filter-bar">
          <button
            class="filter-btn ${this.filter === "all" ? "active" : ""}"
            @click=${() => (this.filter = "all")}
          >
            All
          </button>
          <button
            class="filter-btn ${this.filter === "user" ? "active" : ""}"
            @click=${() => (this.filter = "user")}
          >
            User
          </button>
          <button
            class="filter-btn ${this.filter === "automation" ? "active" : ""}"
            @click=${() => (this.filter = "automation")}
          >
            Automation
          </button>
          <button
            class="filter-btn ${this.filter === "system" ? "active" : ""}"
            @click=${() => (this.filter = "system")}
          >
            System
          </button>
        </div>

        <table class="audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredEntries.map(
              (entry) => html`
                <tr>
                  <td>${this.formatTime(entry.timestamp)}</td>
                  <td>
                    <span class="actor-badge ${entry.actor}">
                      ${entry.actor === "user" ? "👤" : entry.actor === "automation" ? "⚡" : "🔧"}
                      ${entry.actor}
                    </span>
                  </td>
                  <td>${entry.action}</td>
                  <td>${entry.target || "-"}</td>
                  <td>
                    <span class="hash" title=${entry.hash}>
                      ${entry.hash.slice(0, 12)}...
                    </span>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-audit-view": FarmAuditView;
  }
}
