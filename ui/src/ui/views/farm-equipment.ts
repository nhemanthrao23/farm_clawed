/**
 * Farm Equipment Insights View
 *
 * Equipment management panel focused on autonomous tool adoption.
 * Uses app's dark theme CSS variables.
 */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// Equipment insight data model
export interface EquipmentInsight {
  deviceId: string;
  name: string;
  type: "hub" | "sensor" | "valve" | "controller" | "weather-station";
  platform: "tuya" | "smartlife" | "ifttt" | "zigbee" | "wifi";
  status: "online" | "offline" | "maintenance";
  usageHours: number;
  activationCount: number;
  lastMaintenance: string | null;
  nextMaintenanceDue: string | null;
  efficiency: number; // 0-100%
  batteryLevel?: number; // 0-100%
  lastSeen: string;
  recommendations: string[];
  capabilities: string[];
}

// Equipment category filter
type EquipmentFilter = "all" | "sensors" | "actuators" | "hubs";

@customElement("farm-equipment-view")
export class FarmEquipmentView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--bg, #12141a);
    }
    
    .equipment-container {
      padding: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .filter-tabs {
      display: flex;
      gap: 0.25rem;
      background: var(--bg-elevated, #1a1d25);
      padding: 0.25rem;
      border-radius: var(--radius-md, 8px);
    }
    
    .filter-tab {
      padding: 0.5rem 0.875rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .filter-tab:hover {
      color: var(--text, #e4e4e7);
    }
    
    .filter-tab.active {
      background: var(--card, #181b22);
      color: var(--text-strong, #fafafa);
    }
    
    .equipment-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .equipment-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      transition: all 0.15s ease;
    }
    
    .equipment-card:hover {
      border-color: var(--border-hover, #52525b);
    }
    
    .equipment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    
    .equipment-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .equipment-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md, 8px);
      background: var(--bg-elevated, #1a1d25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .equipment-name {
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .equipment-type {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      text-transform: capitalize;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
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
    
    .status-dot.maintenance {
      background: var(--warn, #f59e0b);
    }
    
    .equipment-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      padding: 0.875rem;
      background: var(--bg-elevated, #1a1d25);
      border-radius: var(--radius-md, 8px);
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .stat-value.warning {
      color: var(--warn, #f59e0b);
    }
    
    .stat-value.good {
      color: var(--ok, #22c55e);
    }
    
    .stat-label {
      font-size: 0.65rem;
      color: var(--muted, #71717a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .equipment-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.75rem;
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .recommendations {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      border-left: 3px solid var(--warn, #f59e0b);
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      border-radius: 0 var(--radius-md, 8px) var(--radius-md, 8px) 0;
    }
    
    .recommendations-title {
      font-weight: 500;
      font-size: 0.8rem;
      color: var(--warn, #f59e0b);
      margin-bottom: 0.375rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .recommendations-list {
      color: var(--text, #e4e4e7);
      margin: 0;
      padding-left: 1rem;
      font-size: 0.8rem;
    }
    
    .recommendations-list li {
      margin-bottom: 0.25rem;
    }
    
    .equipment-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .action-btn {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-md, 8px);
      background: var(--card, #181b22);
      color: var(--text, #e4e4e7);
      font-size: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.15s ease;
    }
    
    .action-btn:hover {
      background: var(--bg-hover, #262a35);
      border-color: var(--border-hover, #52525b);
    }
    
    .action-btn.troubleshoot {
      border-color: var(--warn, #f59e0b);
      color: var(--warn, #f59e0b);
    }
    
    .add-equipment {
      border: 2px dashed var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .add-equipment:hover {
      border-color: var(--ok, #22c55e);
      background: var(--card, #181b22);
    }
    
    .add-equipment-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }
    
    .add-equipment-title {
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.25rem;
    }
    
    .add-equipment-subtitle {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
    }
    
    .qa-section {
      margin-top: 1.5rem;
      padding: 1rem;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
    }
    
    .qa-input-wrapper {
      display: flex;
      gap: 0.5rem;
    }
    
    .qa-input {
      flex: 1;
      padding: 0.875rem 1rem;
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-md, 8px);
      font-size: 0.875rem;
      background: var(--bg-elevated, #1a1d25);
      color: var(--text, #e4e4e7);
      font-family: inherit;
    }
    
    .qa-input::placeholder {
      color: var(--muted, #71717a);
    }
    
    .qa-input:focus {
      outline: none;
      border-color: var(--accent, #ff5c5c);
    }
    
    .qa-btn {
      padding: 0.875rem 1.25rem;
      background: var(--accent, #ff5c5c);
      color: white;
      border: none;
      border-radius: var(--radius-md, 8px);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .qa-btn:hover {
      background: var(--accent-hover, #ff7070);
    }
    
    .qa-suggestions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }
    
    .qa-suggestion {
      padding: 0.375rem 0.75rem;
      background: var(--bg-elevated, #1a1d25);
      border: 1px solid var(--border, #27272a);
      border-radius: 9999px;
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .qa-suggestion:hover {
      border-color: var(--accent, #ff5c5c);
      color: var(--accent, #ff5c5c);
    }
  `;

  @property({ type: Array })
  equipment: EquipmentInsight[] = [
    {
      deviceId: "hub-1",
      name: "SmartLife Hub",
      type: "hub",
      platform: "tuya",
      status: "online",
      usageHours: 72,
      activationCount: 0,
      lastMaintenance: null,
      nextMaintenanceDue: null,
      efficiency: 98,
      lastSeen: "Just now",
      recommendations: [],
      capabilities: ["zigbee_bridge", "wifi_relay"],
    },
    {
      deviceId: "sensor-lemon-1",
      name: "Lemon Soil Sensor",
      type: "sensor",
      platform: "tuya",
      status: "online",
      usageHours: 168,
      activationCount: 1240,
      lastMaintenance: "2025-12-01",
      nextMaintenanceDue: "2026-02-15",
      efficiency: 95,
      batteryLevel: 57,
      lastSeen: "5 min ago",
      recommendations: ["Battery at 57% - replace within 2 months"],
      capabilities: ["moisture", "temperature", "ec", "battery"],
    },
    {
      deviceId: "valve-lemon-1",
      name: "Lemon Water Valve",
      type: "valve",
      platform: "tuya",
      status: "offline",
      usageHours: 24,
      activationCount: 45,
      lastMaintenance: "2025-11-15",
      nextMaintenanceDue: "2026-05-15",
      efficiency: 92,
      lastSeen: "2 hours ago",
      recommendations: ["Device offline - check power", "Clean filter before spring"],
      capabilities: ["on_off", "timer", "flow_sensor"],
    },
  ];

  @state()
  private activeFilter: EquipmentFilter = "all";

  @state()
  private qaQuestion = "";

  private getFilteredEquipment(): EquipmentInsight[] {
    if (this.activeFilter === "all") return this.equipment;
    if (this.activeFilter === "sensors") {
      return this.equipment.filter((e) => e.type === "sensor" || e.type === "weather-station");
    }
    if (this.activeFilter === "actuators") {
      return this.equipment.filter((e) => e.type === "valve" || e.type === "controller");
    }
    if (this.activeFilter === "hubs") {
      return this.equipment.filter((e) => e.type === "hub");
    }
    return this.equipment;
  }

  private getEquipmentIcon(type: EquipmentInsight["type"]): string {
    const icons: Record<string, string> = {
      hub: "📡",
      sensor: "🌡️",
      valve: "🚿",
      controller: "🎛️",
      "weather-station": "🌤️",
    };
    return icons[type] || "📦";
  }

  private handleAskQuestion() {
    if (!this.qaQuestion.trim()) return;
    this.dispatchEvent(
      new CustomEvent("equipment-question", {
        detail: { question: this.qaQuestion },
      }),
    );
    this.qaQuestion = "";
  }

  private handleSuggestionClick(question: string) {
    this.qaQuestion = question;
    this.handleAskQuestion();
  }

  override render() {
    const filteredEquipment = this.getFilteredEquipment();

    return html`
      <div class="equipment-container">
        <div class="header">
          <h1>⚙️ Equipment</h1>
          <div class="filter-tabs">
            ${(["all", "sensors", "actuators", "hubs"] as EquipmentFilter[]).map(
              (filter) => html`
                <button
                  class="filter-tab ${this.activeFilter === filter ? "active" : ""}"
                  @click=${() => (this.activeFilter = filter)}
                >
                  ${filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              `,
            )}
          </div>
        </div>

        <div class="equipment-list">
          ${filteredEquipment.map(
            (eq) => html`
              <div class="equipment-card">
                <div class="equipment-header">
                  <div class="equipment-info">
                    <div class="equipment-icon">${this.getEquipmentIcon(eq.type)}</div>
                    <div>
                      <div class="equipment-name">${eq.name}</div>
                      <div class="equipment-type">${eq.type} · ${eq.platform}</div>
                    </div>
                  </div>
                  <div class="status-indicator">
                    <span class="status-dot ${eq.status}"></span>
                    ${eq.status}
                  </div>
                </div>

                <div class="equipment-stats">
                  <div class="stat">
                    <div class="stat-value">${eq.usageHours}h</div>
                    <div class="stat-label">Uptime</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value ${eq.efficiency < 90 ? "warning" : "good"}">${eq.efficiency}%</div>
                    <div class="stat-label">Efficiency</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${eq.activationCount.toLocaleString()}</div>
                    <div class="stat-label">Readings</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value ${eq.batteryLevel && eq.batteryLevel < 30 ? "warning" : ""}">
                      ${eq.batteryLevel !== undefined ? `${eq.batteryLevel}%` : "N/A"}
                    </div>
                    <div class="stat-label">Battery</div>
                  </div>
                </div>

                <div class="equipment-meta">
                  <span class="meta-item">📍 Last seen: ${eq.lastSeen}</span>
                  ${
                    eq.nextMaintenanceDue
                      ? html`<span class="meta-item">🔧 Maintenance: ${eq.nextMaintenanceDue}</span>`
                      : null
                  }
                </div>

                ${
                  eq.recommendations.length > 0
                    ? html`
                      <div class="recommendations">
                        <div class="recommendations-title">💡 AI Recommendations</div>
                        <ul class="recommendations-list">
                          ${eq.recommendations.map((r) => html`<li>${r}</li>`)}
                        </ul>
                      </div>
                    `
                    : null
                }

                <div class="equipment-actions">
                  <button
                    class="action-btn"
                    @click=${() =>
                      this.dispatchEvent(
                        new CustomEvent("equipment-qa", { detail: { deviceId: eq.deviceId } }),
                      )}
                  >
                    💬 Q&A
                  </button>
                  <button
                    class="action-btn"
                    @click=${() =>
                      this.dispatchEvent(
                        new CustomEvent("equipment-maintenance", {
                          detail: { deviceId: eq.deviceId },
                        }),
                      )}
                  >
                    🔧 Maintenance
                  </button>
                  <button
                    class="action-btn"
                    @click=${() =>
                      this.dispatchEvent(
                        new CustomEvent("equipment-settings", {
                          detail: { deviceId: eq.deviceId },
                        }),
                      )}
                  >
                    ⚙️ Settings
                  </button>
                  ${
                    eq.status === "offline"
                      ? html`
                        <button
                          class="action-btn troubleshoot"
                          @click=${() =>
                            this.dispatchEvent(
                              new CustomEvent("equipment-troubleshoot", {
                                detail: { deviceId: eq.deviceId },
                              }),
                            )}
                        >
                          🔍 Troubleshoot
                        </button>
                      `
                      : null
                  }
                </div>
              </div>
            `,
          )}

          <div class="add-equipment" @click=${() => this.dispatchEvent(new CustomEvent("add-equipment"))}>
            <div class="add-equipment-icon">➕</div>
            <div class="add-equipment-title">Add Equipment</div>
            <div class="add-equipment-subtitle">Connect a new sensor, valve, or hub</div>
          </div>
        </div>

        <div class="qa-section">
          <div class="qa-input-wrapper">
            <input
              class="qa-input"
              type="text"
              placeholder="Ask about equipment..."
              .value=${this.qaQuestion}
              @input=${(e: Event) => (this.qaQuestion = (e.target as HTMLInputElement).value)}
              @keypress=${(e: KeyboardEvent) => e.key === "Enter" && this.handleAskQuestion()}
            />
            <button class="qa-btn" @click=${this.handleAskQuestion}>Ask AI</button>
          </div>
          <div class="qa-suggestions">
            <button class="qa-suggestion" @click=${() => this.handleSuggestionClick("What equipment do I need?")}>
              What equipment do I need?
            </button>
            <button class="qa-suggestion" @click=${() => this.handleSuggestionClick("How to calibrate sensor?")}>
              How to calibrate?
            </button>
            <button class="qa-suggestion" @click=${() => this.handleSuggestionClick("When to replace valve?")}>
              When to replace?
            </button>
            <button class="qa-suggestion" @click=${() => this.handleSuggestionClick("Connect new device")}>
              Connect device
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-equipment-view": FarmEquipmentView;
  }
}
