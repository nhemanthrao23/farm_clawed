/**
 * Farm Chat Cards
 *
 * Rich inline card components for the chat-first farm interface.
 * These cards render within the conversation thread.
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { FarmMapContext, FarmAsset, MapLayer } from "./farm-map.js";
import "./farm-map.js";

// Sensor reading data
export interface SensorReading {
  id: string;
  label: string;
  value: string;
  unit?: string;
  status?: "normal" | "warning" | "critical";
  icon?: string;
}

// Automation proposal
export interface AutomationProposal {
  id: string;
  type: "water" | "fertilize" | "climate" | "maintenance";
  action: string;
  target: string;
  reason: string;
  confidence: number;
  estimatedImpact: string;
  expiresIn?: string;
  status?: "pending" | "approved" | "rejected" | "executed";
  iftttEvent?: string; // IFTTT webhook event name
}

// Equipment item
export interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "warning";
  metric?: string;
}

// Daily briefing data
export interface DailyBriefingData {
  date: string;
  summary: string;
  priorities: Array<{
    icon: string;
    title: string;
    subtitle: string;
    action?: string;
    command?: string;
  }>;
}

// Weather forecast data
export interface WeatherForecastData {
  current: number;
  high: number;
  low: number;
  condition: string;
  rain: number;
  wind: number;
  humidity: number;
  sunrise: string;
  sunset: string;
  hourly?: Array<{ hour: string; temp: number; icon: string }>;
}

// Task list data
export interface TaskListData {
  tasks: Array<{
    id: string;
    title: string;
    priority: "high" | "medium" | "low";
    category: string;
    reason: string;
    completed: boolean;
    command?: string;
  }>;
}

// Card union type
export type FarmCard =
  | { type: "sensor"; data: SensorReading[]; assetName?: string }
  | { type: "map"; context: FarmMapContext; assets: FarmAsset[] }
  | { type: "automation"; proposal: AutomationProposal }
  | { type: "equipment"; devices: EquipmentItem[] }
  | { type: "alert"; severity: "info" | "warning" | "critical"; title: string; message: string }
  | { type: "daily-briefing"; data: DailyBriefingData }
  | { type: "weather-forecast"; data: WeatherForecastData }
  | { type: "task-list"; data: TaskListData };

/**
 * Sensor Card - Shows sensor readings with optional actions
 */
@customElement("farm-chat-sensor-card")
export class FarmChatSensorCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    
    .sensor-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }
    
    .sensor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .sensor-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-strong, #fafafa);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .sensor-badge {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .sensor-badge.warning {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      color: var(--warn, #f59e0b);
    }
    
    .sensor-badge.critical {
      background: var(--danger-subtle, rgba(239, 68, 68, 0.12));
      color: var(--danger, #ef4444);
    }
    
    .sensor-badge.normal {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
    }
    
    .readings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1px;
      background: var(--border, #27272a);
    }
    
    .reading {
      background: var(--card, #181b22);
      padding: 1rem;
      text-align: center;
    }
    
    .reading-icon {
      font-size: 1.25rem;
      margin-bottom: 0.375rem;
    }
    
    .reading-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.25rem;
    }
    
    .reading-value.warning {
      color: var(--warn, #f59e0b);
    }
    
    .reading-value.critical {
      color: var(--danger, #ef4444);
    }
    
    .reading-label {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .sensor-actions {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border, #27272a);
    }
    
    .action-btn {
      flex: 1;
      padding: 0.625rem 1rem;
      border-radius: var(--radius-md, 8px);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
    }
    
    .action-btn.primary {
      background: var(--ok, #22c55e);
      border: none;
      color: white;
    }
    
    .action-btn.primary:hover {
      background: #16a34a;
    }
    
    .action-btn.secondary {
      background: transparent;
      border: 1px solid var(--border, #27272a);
      color: var(--muted, #71717a);
    }
    
    .action-btn.secondary:hover {
      border-color: var(--border-hover, #52525b);
      color: var(--text, #e4e4e7);
    }
  `;

  @property({ type: Array })
  readings: SensorReading[] = [];

  @property({ type: String })
  assetName = "";

  @property({ type: Boolean })
  showActions = true;

  private getOverallStatus(): "normal" | "warning" | "critical" {
    if (this.readings.some((r) => r.status === "critical")) return "critical";
    if (this.readings.some((r) => r.status === "warning")) return "warning";
    return "normal";
  }

  private getDefaultIcon(label: string): string {
    const lower = label.toLowerCase();
    if (lower.includes("moisture") || lower.includes("water")) return "💧";
    if (lower.includes("temp")) return "🌡️";
    if (lower.includes("ec") || lower.includes("fertil")) return "🌱";
    if (lower.includes("battery")) return "🔋";
    if (lower.includes("humid")) return "💨";
    return "📊";
  }

  override render() {
    const status = this.getOverallStatus();

    return html`
      <div class="sensor-card">
        <div class="sensor-header">
          <span class="sensor-title">
            📊 ${this.assetName || "Sensor Readings"}
          </span>
          <span class="sensor-badge ${status}">
            ${status === "critical" ? "⚠️ Critical" : status === "warning" ? "⚡ Attention" : "✓ Normal"}
          </span>
        </div>
        <div class="readings-grid">
          ${this.readings.map(
            (r) => html`
            <div class="reading">
              <div class="reading-icon">${r.icon || this.getDefaultIcon(r.label)}</div>
              <div class="reading-value ${r.status || ""}">${r.value}${r.unit || ""}</div>
              <div class="reading-label">${r.label}</div>
            </div>
          `,
          )}
        </div>
        ${
          this.showActions && status !== "normal"
            ? html`
          <div class="sensor-actions">
            <button class="action-btn primary" @click=${() => this.dispatchEvent(new CustomEvent("water-request"))}>
              💧 Water Now
            </button>
            <button class="action-btn secondary" @click=${() => this.dispatchEvent(new CustomEvent("dismiss"))}>
              Dismiss
            </button>
          </div>
        `
            : nothing
        }
      </div>
    `;
  }
}

/**
 * Map Card - Embedded interactive map
 */
@customElement("farm-chat-map-card")
export class FarmChatMapCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    
    .map-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }
    
    .map-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .map-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-strong, #fafafa);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .layer-controls {
      display: flex;
      gap: 0.25rem;
    }
    
    .layer-btn {
      padding: 0.25rem 0.5rem;
      background: transparent;
      border: 1px solid var(--border, #27272a);
      border-radius: 4px;
      color: var(--muted, #71717a);
      font-size: 0.65rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .layer-btn:hover {
      border-color: var(--border-hover, #52525b);
      color: var(--text, #e4e4e7);
    }
    
    .layer-btn.active {
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      border-color: var(--accent, #ff5c5c);
      color: var(--accent, #ff5c5c);
    }
    
    .map-container {
      height: 240px;
    }
    
    .map-container farm-map-view {
      height: 100%;
    }
    
    .map-legend {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--border, #27272a);
      font-size: 0.7rem;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--muted, #71717a);
    }
    
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .legend-dot.healthy {
      background: var(--ok, #22c55e);
    }
    .legend-dot.warning {
      background: var(--warn, #f59e0b);
    }
    .legend-dot.offline {
      background: var(--danger, #ef4444);
    }
  `;

  @property({ type: Object })
  context: FarmMapContext = {
    hasZones: false,
    hasSectors: false,
    assetCount: 1,
    boundingBox: null,
    center: null,
  };

  @property({ type: Array })
  assets: FarmAsset[] = [];

  @property({ type: String })
  layer: MapLayer = "default";

  override render() {
    return html`
      <div class="map-card">
        <div class="map-header">
          <span class="map-title">🗺️ Farm Map</span>
          <div class="layer-controls">
            <button class="layer-btn ${this.layer === "default" ? "active" : ""}" 
                    @click=${() => (this.layer = "default")}>Default</button>
            <button class="layer-btn ${this.layer === "satellite" ? "active" : ""}" 
                    @click=${() => (this.layer = "satellite")}>Satellite</button>
          </div>
        </div>
        <div class="map-container">
          <farm-map-view
            .context=${this.context}
            .assets=${this.assets}
            .forceMap=${true}
            .layer=${this.layer}
          ></farm-map-view>
        </div>
        <div class="map-legend">
          <div class="legend-item"><span class="legend-dot healthy"></span> Healthy</div>
          <div class="legend-item"><span class="legend-dot warning"></span> Attention</div>
          <div class="legend-item"><span class="legend-dot offline"></span> Offline</div>
        </div>
      </div>
    `;
  }
}

/**
 * Automation Card - Approve/reject automation proposals
 */
@customElement("farm-chat-automation-card")
export class FarmChatAutomationCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    
    .automation-card {
      background: var(--card, #181b22);
      border: 1px solid var(--accent, #ff5c5c);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
      box-shadow: 0 0 20px rgba(255, 92, 92, 0.08);
    }
    
    .automation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1.25rem;
      background: var(--accent-subtle, rgba(255, 92, 92, 0.08));
    }
    
    .automation-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--accent, #ff5c5c);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    
    .automation-expires {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .automation-body {
      padding: 1.25rem;
    }
    
    .automation-action {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.5rem;
    }
    
    .automation-reason {
      font-size: 0.85rem;
      color: var(--muted, #71717a);
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    
    .automation-meta {
      display: flex;
      gap: 1.5rem;
      padding: 0.875rem 0;
      border-top: 1px solid var(--border, #27272a);
      border-bottom: 1px solid var(--border, #27272a);
      margin-bottom: 1rem;
    }
    
    .meta-item {
      font-size: 0.75rem;
    }
    
    .meta-label {
      color: var(--muted, #71717a);
    }
    
    .meta-value {
      color: var(--text, #e4e4e7);
      font-weight: 500;
    }
    
    .automation-buttons {
      display: flex;
      gap: 0.75rem;
    }
    
    .btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md, 8px);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
    }
    
    .btn-approve {
      background: var(--ok, #22c55e);
      border: none;
      color: white;
    }
    
    .btn-approve:hover {
      background: #16a34a;
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
    }
    
    .btn-reject {
      background: transparent;
      border: 1px solid var(--border, #27272a);
      color: var(--muted, #71717a);
    }
    
    .btn-reject:hover {
      border-color: var(--danger, #ef4444);
      color: var(--danger, #ef4444);
    }
    
    .btn-modify {
      background: transparent;
      border: 1px solid var(--border, #27272a);
      color: var(--muted, #71717a);
    }
    
    .btn-modify:hover {
      border-color: var(--info, #3b82f6);
      color: var(--info, #3b82f6);
    }
    
    .btn-ifttt {
      background: linear-gradient(135deg, #00d1b2 0%, #00c4a7 100%);
      border: none;
      color: white;
    }
    
    .btn-ifttt:hover {
      background: linear-gradient(135deg, #00c4a7 0%, #00b89c 100%);
      box-shadow: 0 0 20px rgba(0, 209, 178, 0.4);
    }
    
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border, #27272a);
      color: var(--muted, #71717a);
    }
    
    .btn-secondary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    /* Automation status states */
    .automation-card.approved {
      border-color: var(--ok, #22c55e);
    }
    
    .automation-card.approved .automation-header {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.08));
    }
    
    .automation-card.approved .automation-badge {
      color: var(--ok, #22c55e);
    }
    
    .automation-card.rejected {
      border-color: var(--muted, #71717a);
      opacity: 0.6;
    }
    
    .automation-card.executed {
      border-color: var(--info, #3b82f6);
    }
    
    .automation-card.executed .automation-header {
      background: rgba(59, 130, 246, 0.08);
    }
    
    .automation-card.executed .automation-badge {
      color: var(--info, #3b82f6);
    }
  `;

  @property({ type: Object })
  proposal: AutomationProposal | null = null;

  @property({ type: Boolean })
  iftttEnabled = false;

  @property({ type: String })
  iftttKey = "";

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      water: "💧",
      fertilize: "🌱",
      climate: "🌡️",
      maintenance: "🔧",
    };
    return icons[type] || "⚙️";
  }

  private getStatusBadge(status: string | undefined): string {
    switch (status) {
      case "approved":
        return "✓ Approved";
      case "rejected":
        return "✕ Rejected";
      case "executed":
        return "▶ Executed";
      default:
        return "⏳ Pending";
    }
  }

  private async executeIfttt() {
    if (!this.proposal || !this.iftttKey) return;

    const eventName =
      this.proposal.iftttEvent ||
      `FARM_${this.proposal.target.toUpperCase().replace(/\s+/g, "_")}_${this.proposal.type.toUpperCase()}`;

    this.dispatchEvent(
      new CustomEvent("ifttt-execute", {
        detail: {
          id: this.proposal.id,
          eventName,
          values: {
            value1: this.proposal.action,
            value2: this.proposal.target,
            value3: new Date().toISOString(),
          },
        },
      }),
    );
  }

  override render() {
    if (!this.proposal) return nothing;
    const p = this.proposal;
    const isApproved = p.status === "approved";
    const isExecuted = p.status === "executed";
    const isPending = !p.status || p.status === "pending";

    return html`
      <div class="automation-card ${p.status || "pending"}">
        <div class="automation-header">
          <span class="automation-badge">
            ${this.getTypeIcon(p.type)} ${isPending ? "Automation Proposal" : this.getStatusBadge(p.status)}
          </span>
          ${
            p.expiresIn && isPending
              ? html`
            <span class="automation-expires">Expires in ${p.expiresIn}</span>
          `
              : nothing
          }
        </div>
        <div class="automation-body">
          <div class="automation-action">${p.action}</div>
          <div class="automation-reason">${p.reason}</div>
          <div class="automation-meta">
            <div class="meta-item">
              <span class="meta-label">Confidence: </span>
              <span class="meta-value">${p.confidence}%</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Impact: </span>
              <span class="meta-value">${p.estimatedImpact}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Target: </span>
              <span class="meta-value">${p.target}</span>
            </div>
          </div>
          <div class="automation-buttons">
            ${
              isPending
                ? html`
              <button class="btn btn-approve" @click=${() => this.dispatchEvent(new CustomEvent("approve", { detail: { id: p.id } }))}>
                ✓ Approve
              </button>
              <button class="btn btn-reject" @click=${() => this.dispatchEvent(new CustomEvent("reject", { detail: { id: p.id } }))}>
                ✕ Reject
              </button>
              <button class="btn btn-modify" @click=${() => this.dispatchEvent(new CustomEvent("modify", { detail: { id: p.id } }))}>
                ✏️ Modify
              </button>
            `
                : isApproved && !isExecuted
                  ? html`
              ${
                this.iftttEnabled && this.iftttKey
                  ? html`
                <button class="btn btn-ifttt" @click=${this.executeIfttt}>
                  ⚡ Execute via IFTTT
                </button>
              `
                  : nothing
              }
              <button class="btn btn-reject" @click=${() => this.dispatchEvent(new CustomEvent("reject", { detail: { id: p.id } }))}>
                ✕ Cancel
              </button>
            `
                  : isExecuted
                    ? html`
              <button class="btn btn-secondary" disabled>
                ✓ Executed at ${new Date().toLocaleTimeString()}
              </button>
            `
                    : nothing
            }
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Equipment Card - Shows equipment status
 */
@customElement("farm-chat-equipment-card")
export class FarmChatEquipmentCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    
    .equipment-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }
    
    .equipment-header {
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--border, #27272a);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-strong, #fafafa);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .equipment-list {
      padding: 0.5rem 0;
    }
    
    .equipment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.25rem;
      transition: background 0.15s ease;
    }
    
    .equipment-item:hover {
      background: var(--bg-hover, #262a35);
    }
    
    .equipment-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .equipment-icon {
      font-size: 1.25rem;
    }
    
    .equipment-name {
      font-size: 0.9rem;
      color: var(--text, #e4e4e7);
    }
    
    .equipment-type {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .equipment-status {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .status-dot.online {
      background: var(--ok, #22c55e);
      box-shadow: 0 0 8px var(--ok, #22c55e);
    }
    
    .status-dot.offline {
      background: var(--danger, #ef4444);
    }
    
    .status-dot.warning {
      background: var(--warn, #f59e0b);
    }
    
    .equipment-footer {
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--border, #27272a);
    }
    
    .view-all-btn {
      width: 100%;
      padding: 0.5rem;
      background: transparent;
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-md, 8px);
      color: var(--muted, #71717a);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .view-all-btn:hover {
      border-color: var(--border-hover, #52525b);
      color: var(--text, #e4e4e7);
    }
  `;

  @property({ type: Array })
  devices: EquipmentItem[] = [];

  private getIcon(type: string): string {
    const icons: Record<string, string> = {
      hub: "📡",
      sensor: "🌡️",
      valve: "🚿",
      controller: "🎛️",
    };
    return icons[type] || "📦";
  }

  override render() {
    return html`
      <div class="equipment-card">
        <div class="equipment-header">⚙️ Equipment Status</div>
        <div class="equipment-list">
          ${this.devices.map(
            (d) => html`
            <div class="equipment-item">
              <div class="equipment-info">
                <span class="equipment-icon">${this.getIcon(d.type)}</span>
                <div>
                  <div class="equipment-name">${d.name}</div>
                  <div class="equipment-type">${d.type}</div>
                </div>
              </div>
              <div class="equipment-status">
                <span class="status-dot ${d.status}"></span>
                ${d.metric || d.status}
              </div>
            </div>
          `,
          )}
        </div>
        <div class="equipment-footer">
          <button class="view-all-btn" @click=${() => this.dispatchEvent(new CustomEvent("view-all"))}>
            View All Equipment →
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Alert Card - Urgent notifications
 */
@customElement("farm-chat-alert-card")
export class FarmChatAlertCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    
    .alert-card {
      border-radius: var(--radius-lg, 12px);
      padding: 1rem 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .alert-card.info {
      background: var(--info, #3b82f6);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    .alert-card.warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .alert-card.critical {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .alert-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    
    .alert-content {
      flex: 1;
    }
    
    .alert-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .alert-card.info .alert-title {
      color: var(--info, #3b82f6);
    }
    .alert-card.warning .alert-title {
      color: var(--warn, #f59e0b);
    }
    .alert-card.critical .alert-title {
      color: var(--danger, #ef4444);
    }
    
    .alert-message {
      font-size: 0.85rem;
      color: var(--text, #e4e4e7);
      line-height: 1.5;
    }
    
    .alert-dismiss {
      background: transparent;
      border: none;
      color: var(--muted, #71717a);
      cursor: pointer;
      padding: 0.25rem;
      font-size: 1rem;
      line-height: 1;
    }
    
    .alert-dismiss:hover {
      color: var(--text, #e4e4e7);
    }
  `;

  @property({ type: String })
  severity: "info" | "warning" | "critical" = "info";

  @property({ type: String })
  alertTitle = "";

  @property({ type: String })
  message = "";

  private getIcon(): string {
    switch (this.severity) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚡";
      default:
        return "ℹ️";
    }
  }

  override render() {
    return html`
      <div class="alert-card ${this.severity}">
        <span class="alert-icon">${this.getIcon()}</span>
        <div class="alert-content">
          <div class="alert-title">${this.alertTitle}</div>
          <div class="alert-message">${this.message}</div>
        </div>
        <button class="alert-dismiss" @click=${() => this.dispatchEvent(new CustomEvent("dismiss"))}>✕</button>
      </div>
    `;
  }
}

/**
 * Daily Briefing Card - Morning briefing with priorities
 */
@customElement("farm-chat-briefing-card")
export class FarmChatBriefingCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    
    .briefing-card {
      background: linear-gradient(135deg, var(--card, #181b22) 0%, rgba(255, 92, 92, 0.05) 100%);
      border: 1px solid var(--accent, #ff5c5c);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }
    
    .briefing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: var(--accent-subtle, rgba(255, 92, 92, 0.08));
    }
    
    .briefing-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .briefing-date {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .briefing-body {
      padding: 1.25rem;
    }
    
    .briefing-summary {
      font-size: 0.9rem;
      color: var(--text, #e4e4e7);
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .briefing-priorities {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .priority-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .priority-item:hover {
      background: var(--bg-hover, #262a35);
      transform: translateX(4px);
    }
    
    .priority-icon {
      font-size: 1.25rem;
    }
    
    .priority-text {
      flex: 1;
    }
    
    .priority-title {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .priority-subtitle {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .priority-action {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      background: var(--accent, #ff5c5c);
      color: white;
      border-radius: 4px;
    }
  `;

  @property({ type: Object })
  data: DailyBriefingData | null = null;

  override render() {
    if (!this.data) return nothing;

    return html`
      <div class="briefing-card">
        <div class="briefing-header">
          <span class="briefing-title">
            ☀️ Daily Briefing
          </span>
          <span class="briefing-date">${this.data.date}</span>
        </div>
        <div class="briefing-body">
          <div class="briefing-summary">${this.data.summary}</div>
          <div class="briefing-priorities">
            ${this.data.priorities.map(
              (p) => html`
              <div 
                class="priority-item" 
                @click=${() => p.command && this.dispatchEvent(new CustomEvent("command", { detail: { command: p.command } }))}
              >
                <span class="priority-icon">${p.icon}</span>
                <div class="priority-text">
                  <div class="priority-title">${p.title}</div>
                  <div class="priority-subtitle">${p.subtitle}</div>
                </div>
                ${p.action ? html`<span class="priority-action">${p.action}</span>` : nothing}
              </div>
            `,
            )}
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Weather Forecast Card - Detailed weather information
 */
@customElement("farm-chat-weather-card")
export class FarmChatWeatherCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    
    .weather-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }
    
    .weather-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .weather-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-strong, #fafafa);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .weather-body {
      padding: 1.25rem;
    }
    
    .weather-main {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .weather-icon {
      font-size: 3rem;
    }
    
    .weather-temp-main {
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .weather-condition {
      font-size: 1rem;
      color: var(--text, #e4e4e7);
    }
    
    .weather-range {
      font-size: 0.85rem;
      color: var(--muted, #71717a);
    }
    
    .weather-details {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }
    
    .weather-detail {
      text-align: center;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: var(--radius-md, 8px);
    }
    
    .detail-icon {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }
    
    .detail-value {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .detail-label {
      font-size: 0.65rem;
      color: var(--muted, #71717a);
      text-transform: uppercase;
    }
    
    .hourly-forecast {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--border, #27272a);
      margin-top: 1rem;
    }
    
    .hourly-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem;
      min-width: 50px;
    }
    
    .hourly-time {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .hourly-icon {
      font-size: 1.25rem;
      margin: 0.25rem 0;
    }
    
    .hourly-temp {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
  `;

  @property({ type: Object })
  data: WeatherForecastData | null = null;

  private getWeatherIcon(condition: string): string {
    const lower = condition.toLowerCase();
    if (lower.includes("rain")) return "🌧️";
    if (lower.includes("cloud")) return "⛅";
    if (lower.includes("sun") || lower.includes("clear")) return "☀️";
    if (lower.includes("storm")) return "⛈️";
    if (lower.includes("snow")) return "❄️";
    if (lower.includes("fog")) return "🌫️";
    return "🌤️";
  }

  override render() {
    if (!this.data) return nothing;

    return html`
      <div class="weather-card">
        <div class="weather-header">
          <span class="weather-title">🌤️ Weather Forecast</span>
        </div>
        <div class="weather-body">
          <div class="weather-main">
            <span class="weather-icon">${this.getWeatherIcon(this.data.condition)}</span>
            <div>
              <div class="weather-temp-main">${this.data.current}°F</div>
              <div class="weather-condition">${this.data.condition}</div>
              <div class="weather-range">H: ${this.data.high}° L: ${this.data.low}°</div>
            </div>
          </div>
          <div class="weather-details">
            <div class="weather-detail">
              <div class="detail-icon">💧</div>
              <div class="detail-value">${this.data.rain}%</div>
              <div class="detail-label">Rain</div>
            </div>
            <div class="weather-detail">
              <div class="detail-icon">💨</div>
              <div class="detail-value">${this.data.wind} mph</div>
              <div class="detail-label">Wind</div>
            </div>
            <div class="weather-detail">
              <div class="detail-icon">💦</div>
              <div class="detail-value">${this.data.humidity}%</div>
              <div class="detail-label">Humidity</div>
            </div>
            <div class="weather-detail">
              <div class="detail-icon">🌅</div>
              <div class="detail-value">${this.data.sunrise}</div>
              <div class="detail-label">Sunrise</div>
            </div>
          </div>
          ${
            this.data.hourly?.length
              ? html`
            <div class="hourly-forecast">
              ${this.data.hourly.map(
                (h) => html`
                <div class="hourly-item">
                  <span class="hourly-time">${h.hour}</span>
                  <span class="hourly-icon">${h.icon}</span>
                  <span class="hourly-temp">${h.temp}°</span>
                </div>
              `,
              )}
            </div>
          `
              : nothing
          }
        </div>
      </div>
    `;
  }
}

/**
 * Task List Card - Interactive task list
 */
@customElement("farm-chat-task-list-card")
export class FarmChatTaskListCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    
    .task-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
    }
    
    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .task-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-strong, #fafafa);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .task-count {
      font-size: 0.7rem;
      padding: 0.125rem 0.5rem;
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      color: var(--accent, #ff5c5c);
      border-radius: 9999px;
    }
    
    .task-list {
      padding: 0.5rem 0;
    }
    
    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .task-item:hover {
      background: var(--bg-hover, #262a35);
    }
    
    .task-item.completed {
      opacity: 0.5;
    }
    
    .task-checkbox {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--border, #27272a);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 2px;
      transition: all 0.15s ease;
    }
    
    .task-item:hover .task-checkbox {
      border-color: var(--accent, #ff5c5c);
    }
    
    .task-item.completed .task-checkbox {
      background: var(--ok, #22c55e);
      border-color: var(--ok, #22c55e);
    }
    
    .task-content {
      flex: 1;
      min-width: 0;
    }
    
    .task-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
      margin-bottom: 0.25rem;
    }
    
    .task-item.completed .task-name {
      text-decoration: line-through;
    }
    
    .task-reason {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      line-height: 1.4;
    }
    
    .task-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .task-priority {
      font-size: 0.6rem;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 500;
    }
    
    .task-priority.high {
      background: var(--danger-subtle, rgba(239, 68, 68, 0.12));
      color: var(--danger, #ef4444);
    }
    
    .task-priority.medium {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      color: var(--warn, #f59e0b);
    }
    
    .task-priority.low {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
    }
    
    .task-category {
      font-size: 1rem;
    }
  `;

  @property({ type: Object })
  data: TaskListData | null = null;

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      water: "💧",
      soil: "🌱",
      ipm: "🐛",
      harvest: "🍋",
      maintenance: "🔧",
      observation: "👁️",
    };
    return icons[category] || "📋";
  }

  private handleTaskClick(task: TaskListData["tasks"][0]) {
    this.dispatchEvent(
      new CustomEvent("task-click", {
        detail: { task },
      }),
    );
  }

  override render() {
    if (!this.data) return nothing;

    const pendingCount = this.data.tasks.filter((t) => !t.completed).length;

    return html`
      <div class="task-card">
        <div class="task-header">
          <span class="task-title">✅ Today's Tasks</span>
          <span class="task-count">${pendingCount} pending</span>
        </div>
        <div class="task-list">
          ${this.data.tasks.map(
            (task) => html`
            <div 
              class="task-item ${task.completed ? "completed" : ""}" 
              @click=${() => this.handleTaskClick(task)}
            >
              <div class="task-checkbox">
                ${task.completed ? html`<span style="color: white; font-size: 0.7rem;">✓</span>` : nothing}
              </div>
              <div class="task-content">
                <div class="task-name">${task.title}</div>
                <div class="task-reason">${task.reason}</div>
              </div>
              <div class="task-meta">
                <span class="task-priority ${task.priority}">${task.priority}</span>
                <span class="task-category">${this.getCategoryIcon(task.category)}</span>
              </div>
            </div>
          `,
          )}
        </div>
      </div>
    `;
  }
}

// Export all card components
declare global {
  interface HTMLElementTagNameMap {
    "farm-chat-sensor-card": FarmChatSensorCard;
    "farm-chat-map-card": FarmChatMapCard;
    "farm-chat-automation-card": FarmChatAutomationCard;
    "farm-chat-equipment-card": FarmChatEquipmentCard;
    "farm-chat-alert-card": FarmChatAlertCard;
    "farm-chat-briefing-card": FarmChatBriefingCard;
    "farm-chat-weather-card": FarmChatWeatherCard;
    "farm-chat-task-list-card": FarmChatTaskListCard;
  }
}
