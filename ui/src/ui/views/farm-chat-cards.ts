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
}

// Equipment item
export interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "warning";
  metric?: string;
}

// Card union type
export type FarmCard =
  | { type: "sensor"; data: SensorReading[]; assetName?: string }
  | { type: "map"; context: FarmMapContext; assets: FarmAsset[] }
  | { type: "automation"; proposal: AutomationProposal }
  | { type: "equipment"; devices: EquipmentItem[] }
  | { type: "alert"; severity: "info" | "warning" | "critical"; title: string; message: string };

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
    if (this.readings.some(r => r.status === "critical")) return "critical";
    if (this.readings.some(r => r.status === "warning")) return "warning";
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
          ${this.readings.map(r => html`
            <div class="reading">
              <div class="reading-icon">${r.icon || this.getDefaultIcon(r.label)}</div>
              <div class="reading-value ${r.status || ""}">${r.value}${r.unit || ""}</div>
              <div class="reading-label">${r.label}</div>
            </div>
          `)}
        </div>
        ${this.showActions && status !== "normal" ? html`
          <div class="sensor-actions">
            <button class="action-btn primary" @click=${() => this.dispatchEvent(new CustomEvent("water-request"))}>
              💧 Water Now
            </button>
            <button class="action-btn secondary" @click=${() => this.dispatchEvent(new CustomEvent("dismiss"))}>
              Dismiss
            </button>
          </div>
        ` : nothing}
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

    .legend-dot.healthy { background: var(--ok, #22c55e); }
    .legend-dot.warning { background: var(--warn, #f59e0b); }
    .legend-dot.offline { background: var(--danger, #ef4444); }
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
                    @click=${() => this.layer = "default"}>Default</button>
            <button class="layer-btn ${this.layer === "satellite" ? "active" : ""}" 
                    @click=${() => this.layer = "satellite"}>Satellite</button>
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
  `;

  @property({ type: Object })
  proposal: AutomationProposal | null = null;

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      water: "💧",
      fertilize: "🌱",
      climate: "🌡️",
      maintenance: "🔧",
    };
    return icons[type] || "⚙️";
  }

  override render() {
    if (!this.proposal) return nothing;
    const p = this.proposal;

    return html`
      <div class="automation-card">
        <div class="automation-header">
          <span class="automation-badge">
            ${this.getTypeIcon(p.type)} Automation Proposal
          </span>
          ${p.expiresIn ? html`
            <span class="automation-expires">Expires in ${p.expiresIn}</span>
          ` : nothing}
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
            <button class="btn btn-approve" @click=${() => this.dispatchEvent(new CustomEvent("approve", { detail: { id: p.id } }))}>
              ✓ Approve
            </button>
            <button class="btn btn-reject" @click=${() => this.dispatchEvent(new CustomEvent("reject", { detail: { id: p.id } }))}>
              ✕ Reject
            </button>
            <button class="btn btn-modify" @click=${() => this.dispatchEvent(new CustomEvent("modify", { detail: { id: p.id } }))}>
              ✏️ Modify
            </button>
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
          ${this.devices.map(d => html`
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
          `)}
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

    .alert-card.info .alert-title { color: var(--info, #3b82f6); }
    .alert-card.warning .alert-title { color: var(--warn, #f59e0b); }
    .alert-card.critical .alert-title { color: var(--danger, #ef4444); }

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
      case "critical": return "🚨";
      case "warning": return "⚡";
      default: return "ℹ️";
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

// Export all card components
declare global {
  interface HTMLElementTagNameMap {
    "farm-chat-sensor-card": FarmChatSensorCard;
    "farm-chat-map-card": FarmChatMapCard;
    "farm-chat-automation-card": FarmChatAutomationCard;
    "farm-chat-equipment-card": FarmChatEquipmentCard;
    "farm-chat-alert-card": FarmChatAlertCard;
  }
}

