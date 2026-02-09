/**
 * Farm Automations View - Automation Builder
 *
 * Build and manage IFTTT-powered automations with safety guardrails.
 * Features:
 * - View/toggle existing automations
 * - Create new automations with builder wizard
 * - Template gallery
 * - Dry-run/simulation mode
 * - Approval policy integration
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// Trigger types for automations
type TriggerType = "schedule" | "sensor" | "forecast" | "manual" | "webhook";

// Condition types
type ConditionType = "moisture" | "temperature" | "time" | "forecast" | "guardrail";

// Automation definition
export interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: {
    type: TriggerType;
    config: Record<string, unknown>;
  };
  conditions: Array<{
    type: ConditionType;
    operator: "lt" | "gt" | "eq" | "between";
    value: number | string | [number, number];
    unit?: string;
  }>;
  action: {
    iftttEvent: string;
    payload?: {
      value1?: string;
      value2?: string;
      value3?: string;
    };
  };
  approvalPolicy: "always" | "auto-within-guardrails" | "auto";
  dryRunMode: boolean;
  lastRun?: string;
  nextRun?: string;
  rollbackGuidance?: string;
}

// Automation record (history)
export interface AutomationRecord {
  id: string;
  type: "water" | "fertilize" | "climate" | "maintenance";
  action: string;
  target: string;
  reason: string;
  confidence: number;
  status: "pending" | "approved" | "rejected" | "expired" | "running" | "completed";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: "user" | "auto" | "timeout";
  executedAt?: string;
  simulated?: boolean;
}

// Automation template
interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger: Automation["trigger"];
  conditions: Automation["conditions"];
  action: Automation["action"];
}

const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "water-low-moisture",
    name: "Water when moisture low",
    description: "Water 2 minutes if moisture < 30% and temp > 50°F",
    icon: "💧",
    trigger: { type: "sensor", config: { sensor: "moisture", interval: "15m" } },
    conditions: [
      { type: "moisture", operator: "lt", value: 30, unit: "%" },
      { type: "temperature", operator: "gt", value: 50, unit: "°F" },
    ],
    action: {
      iftttEvent: "water_2min",
      payload: { value1: "zone1", value2: "120" },
    },
  },
  {
    id: "fertility-reminder",
    name: "Fertility reminder",
    description: "Alert if EC too low for 3+ days",
    icon: "🌱",
    trigger: { type: "schedule", config: { cron: "0 9 * * *" } },
    conditions: [{ type: "guardrail", operator: "eq", value: "ec_low_3days" }],
    action: {
      iftttEvent: "fertility_alert",
      payload: { value1: "EC low for 3 days - consider fertilizing" },
    },
  },
  {
    id: "frost-checklist",
    name: "Frost night checklist",
    description: "Trigger checklist if forecast < 35°F tonight",
    icon: "❄️",
    trigger: { type: "forecast", config: { checkTime: "16:00", horizon: "tonight" } },
    conditions: [{ type: "forecast", operator: "lt", value: 35, unit: "°F" }],
    action: {
      iftttEvent: "frost_alert",
      payload: { value1: "Frost warning - cover sensitive plants" },
    },
  },
  {
    id: "ipm-walk-reminder",
    name: "Weekly IPM walk",
    description: "Reminder every Sunday at 9am",
    icon: "🐛",
    trigger: { type: "schedule", config: { cron: "0 9 * * 0" } },
    conditions: [],
    action: {
      iftttEvent: "ipm_reminder",
      payload: { value1: "Time for weekly IPM inspection" },
    },
  },
];

@customElement("farm-automations-view")
export class FarmAutomationsView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--bg, #12141a);
    }
    
    .container {
      padding: 1.5rem;
      max-width: 1000px;
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
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .subtitle {
      color: var(--muted, #71717a);
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    
    .btn {
      padding: 0.625rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    
    .btn-primary {
      background: var(--accent, #ff5c5c);
      border: none;
      color: white;
    }
    
    .btn-primary:hover {
      background: var(--accent-hover, #ff7070);
      box-shadow: 0 0 20px rgba(255, 92, 92, 0.3);
    }
    
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border, #27272a);
      color: var(--text, #e4e4e7);
    }
    
    .btn-secondary:hover {
      border-color: var(--accent, #ff5c5c);
    }
    
    /* Tabs */
    .tabs {
      display: flex;
      gap: 0.25rem;
      background: var(--bg-elevated, #1a1d25);
      padding: 0.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }
    
    .tab {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-size: 0.85rem;
      color: var(--muted, #71717a);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .tab:hover {
      color: var(--text, #e4e4e7);
    }
    
    .tab.active {
      background: var(--card, #181b22);
      color: var(--text-strong, #fafafa);
    }
    
    /* Automation Cards */
    .automations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .automation-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 12px;
      padding: 1.25rem;
      transition: all 0.15s ease;
    }
    
    .automation-card:hover {
      border-color: var(--accent, #ff5c5c);
    }
    
    .automation-card.disabled {
      opacity: 0.6;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    
    .card-icon {
      font-size: 1.5rem;
    }
    
    .card-toggle {
      position: relative;
      width: 40px;
      height: 22px;
    }
    
    .card-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: var(--bg-elevated, #1a1d25);
      border-radius: 22px;
      transition: 0.2s;
    }
    
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.2s;
    }
    
    input:checked + .toggle-slider {
      background: var(--ok, #22c55e);
    }
    
    input:checked + .toggle-slider:before {
      transform: translateX(18px);
    }
    
    .card-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.25rem;
    }
    
    .card-description {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.75rem;
    }
    
    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.7rem;
    }
    
    .meta-tag {
      padding: 0.25rem 0.5rem;
      background: var(--bg, #12141a);
      border-radius: 4px;
      color: var(--muted, #71717a);
    }
    
    .meta-tag.dry-run {
      background: var(--info-subtle, rgba(59, 130, 246, 0.12));
      color: var(--info, #3b82f6);
    }
    
    /* Templates */
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
    
    .template-card {
      background: var(--card, #181b22);
      border: 2px dashed var(--border, #27272a);
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .template-card:hover {
      border-color: var(--accent, #ff5c5c);
      border-style: solid;
    }
    
    .template-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .template-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.25rem;
    }
    
    .template-desc {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
    }
    
    /* History */
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .history-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 12px;
      padding: 1.25rem;
    }
    
    .history-card.pending {
      border-color: var(--accent, #ff5c5c);
      box-shadow: 0 0 20px rgba(255, 92, 92, 0.1);
    }
    
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    
    .history-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    
    .history-badge.pending {
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      color: var(--accent, #ff5c5c);
    }
    
    .history-badge.approved,
    .history-badge.completed {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
    }
    
    .history-badge.rejected {
      background: var(--danger-subtle, rgba(239, 68, 68, 0.12));
      color: var(--danger, #ef4444);
    }
    
    .history-badge.simulated {
      background: var(--info-subtle, rgba(59, 130, 246, 0.12));
      color: var(--info, #3b82f6);
    }
    
    .history-time {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .history-action {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.25rem;
    }
    
    .history-reason {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.75rem;
    }
    
    .history-buttons {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn-small {
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
    }
    
    .btn-approve {
      background: var(--ok, #22c55e);
      border: none;
      color: white;
    }
    
    .btn-approve:hover {
      background: #16a34a;
    }
    
    .btn-reject {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--muted);
    }
    
    .btn-reject:hover {
      border-color: var(--danger);
      color: var(--danger);
    }
    
    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
      color: var(--muted, #71717a);
    }
    
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
    
    .empty-title {
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
      margin-bottom: 0.5rem;
    }
    
    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 16px;
      padding: 1.5rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .modal-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: var(--muted);
      cursor: pointer;
    }
    
    .form-group {
      margin-bottom: 1.25rem;
    }
    
    .form-label {
      display: block;
      font-size: 0.85rem;
      color: var(--text, #e4e4e7);
      margin-bottom: 0.5rem;
    }
    
    .form-input {
      width: 100%;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      color: var(--text, #e4e4e7);
      font-size: 0.9rem;
    }
    
    .form-input:focus {
      outline: none;
      border-color: var(--accent, #ff5c5c);
    }
    
    .form-select {
      width: 100%;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      color: var(--text, #e4e4e7);
      font-size: 0.9rem;
    }
    
    .form-hint {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
    }
    
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .checkbox-group input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent, #ff5c5c);
    }
    
    .modal-footer {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    
    .modal-footer .btn {
      flex: 1;
    }
  `;

  @property({ type: Array })
  automations: Automation[] = [
    {
      id: "1",
      name: "Meyer Lemon Watering",
      description: "Water 2 min when moisture < 30%",
      enabled: true,
      trigger: { type: "sensor", config: { sensor: "moisture", interval: "15m" } },
      conditions: [{ type: "moisture", operator: "lt", value: 30, unit: "%" }],
      action: { iftttEvent: "lemon_water_2min", payload: { value1: "zone1", value2: "120" } },
      approvalPolicy: "always",
      dryRunMode: false,
      lastRun: new Date(Date.now() - 86400000).toISOString(),
      nextRun: new Date(Date.now() + 3600000).toISOString(),
      rollbackGuidance: "Check for pooling water; disable if overwatering detected",
    },
  ];

  @property({ type: Array })
  history: AutomationRecord[] = [
    {
      id: "h1",
      type: "water",
      action: "Water lemon tree for 2 minutes",
      target: "Meyer Lemon Tree",
      reason: "Soil moisture 17% below 30% threshold",
      confidence: 92,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ];

  @state()
  private activeTab: "automations" | "templates" | "history" = "automations";

  @state()
  private showCreateModal = false;

  @state()
  private selectedTemplate: AutomationTemplate | null = null;

  @state()
  private newAutomation: Partial<Automation> = {};

  private getTypeIcon(type: AutomationRecord["type"]): string {
    const icons: Record<string, string> = {
      water: "💧",
      fertilize: "🌱",
      climate: "🌡️",
      maintenance: "🔧",
    };
    return icons[type] || "⚙️";
  }

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private handleToggleAutomation(id: string, enabled: boolean) {
    this.automations = this.automations.map((a) => (a.id === id ? { ...a, enabled } : a));
    this.dispatchEvent(new CustomEvent("toggle-automation", { detail: { id, enabled } }));
  }

  private handleSelectTemplate(template: AutomationTemplate) {
    this.selectedTemplate = template;
    this.newAutomation = {
      name: template.name,
      description: template.description,
      trigger: { ...template.trigger },
      conditions: [...template.conditions],
      action: { ...template.action },
      approvalPolicy: "always",
      dryRunMode: true,
    };
    this.showCreateModal = true;
  }

  private handleCreateAutomation() {
    const automation: Automation = {
      id: `auto_${Date.now()}`,
      name: this.newAutomation.name || "New Automation",
      description: this.newAutomation.description || "",
      enabled: false,
      trigger: this.newAutomation.trigger || { type: "manual", config: {} },
      conditions: this.newAutomation.conditions || [],
      action: this.newAutomation.action || { iftttEvent: "test" },
      approvalPolicy: this.newAutomation.approvalPolicy || "always",
      dryRunMode: this.newAutomation.dryRunMode ?? true,
    };

    this.automations = [...this.automations, automation];
    this.showCreateModal = false;
    this.newAutomation = {};
    this.selectedTemplate = null;
    this.dispatchEvent(new CustomEvent("create-automation", { detail: automation }));
  }

  private handleApprove(id: string) {
    this.dispatchEvent(new CustomEvent("approve-automation", { detail: { id } }));
  }

  private handleReject(id: string) {
    this.dispatchEvent(new CustomEvent("reject-automation", { detail: { id } }));
  }

  private renderAutomationsTab() {
    return html`
      <div class="automations-grid">
        ${this.automations.map(
          (auto) => html`
            <div class="automation-card ${auto.enabled ? "" : "disabled"}">
              <div class="card-header">
                <span class="card-icon">${auto.trigger.type === "sensor" ? "📡" : auto.trigger.type === "schedule" ? "⏰" : "🔔"}</span>
                <label class="card-toggle">
                  <input
                    type="checkbox"
                    ?checked=${auto.enabled}
                    @change=${(e: Event) =>
                      this.handleToggleAutomation(auto.id, (e.target as HTMLInputElement).checked)}
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="card-name">${auto.name}</div>
              <div class="card-description">${auto.description}</div>
              <div class="card-meta">
                <span class="meta-tag">IFTTT: ${auto.action.iftttEvent}</span>
                ${
                  auto.dryRunMode
                    ? html`
                        <span class="meta-tag dry-run">Dry Run</span>
                      `
                    : nothing
                }
                ${
                  auto.lastRun
                    ? html`<span class="meta-tag">Last: ${this.formatTime(auto.lastRun)}</span>`
                    : nothing
                }
              </div>
            </div>
          `,
        )}

        <div
          class="template-card"
          @click=${() => {
            this.activeTab = "templates";
          }}
        >
          <div class="template-icon">➕</div>
          <div class="template-name">New Automation</div>
          <div class="template-desc">Create from template or scratch</div>
        </div>
      </div>
    `;
  }

  private renderTemplatesTab() {
    return html`
      <div class="templates-grid">
        ${AUTOMATION_TEMPLATES.map(
          (template) => html`
            <div class="template-card" @click=${() => this.handleSelectTemplate(template)}>
              <div class="template-icon">${template.icon}</div>
              <div class="template-name">${template.name}</div>
              <div class="template-desc">${template.description}</div>
            </div>
          `,
        )}

        <div
          class="template-card"
          @click=${() => {
            this.selectedTemplate = null;
            this.newAutomation = {
              name: "",
              description: "",
              approvalPolicy: "always",
              dryRunMode: true,
            };
            this.showCreateModal = true;
          }}
        >
          <div class="template-icon">🛠️</div>
          <div class="template-name">Custom Automation</div>
          <div class="template-desc">Build from scratch</div>
        </div>
      </div>
    `;
  }

  private renderHistoryTab() {
    const pendingCount = this.history.filter((h) => h.status === "pending").length;

    return html`
      ${
        pendingCount > 0
          ? html`
            <div
              style="padding: 1rem; background: var(--accent-subtle); border: 1px solid var(--accent); border-radius: 8px; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;"
            >
              <span style="font-size: 1.25rem;">⚠️</span>
              <span style="color: var(--accent); font-size: 0.9rem; font-weight: 500;">
                ${pendingCount} automation${pendingCount > 1 ? "s" : ""} pending approval
              </span>
            </div>
          `
          : nothing
      }

      <div class="history-list">
        ${
          this.history.length === 0
            ? html`
                <div class="empty-state">
                  <div class="empty-icon">📋</div>
                  <div class="empty-title">No automation history yet</div>
                  <div>Actions will appear here when automations run.</div>
                </div>
              `
            : this.history.map(
                (record) => html`
                <div class="history-card ${record.status}">
                  <div class="history-header">
                    <span class="history-badge ${record.status} ${record.simulated ? "simulated" : ""}">
                      ${this.getTypeIcon(record.type)}
                      ${record.simulated ? "Simulated" : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                    <span class="history-time">${this.formatTime(record.createdAt)}</span>
                        </div>
                  <div class="history-action">${record.action}</div>
                  <div class="history-reason">${record.reason}</div>

                  ${
                    record.status === "pending"
                      ? html`
                        <div class="history-buttons">
                          <button
                            class="btn btn-small btn-approve"
                            @click=${() => this.handleApprove(record.id)}
                          >
                                ✓ Approve
                              </button>
                          <button
                            class="btn btn-small btn-reject"
                            @click=${() => this.handleReject(record.id)}
                          >
                                ✕ Reject
                              </button>
                            </div>
                          `
                      : nothing
                  }
                    </div>
                  `,
              )
        }
              </div>
    `;
  }

  private renderCreateModal() {
    return html`
      <div class="modal-backdrop" @click=${() => (this.showCreateModal = false)}>
        <div class="modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <div class="modal-title">
              ${this.selectedTemplate ? `Create: ${this.selectedTemplate.name}` : "New Automation"}
            </div>
            <button class="modal-close" @click=${() => (this.showCreateModal = false)}>×</button>
          </div>

          <div class="form-group">
            <label class="form-label">Name</label>
            <input
              type="text"
              class="form-input"
              .value=${this.newAutomation.name || ""}
              @input=${(e: Event) => {
                this.newAutomation = {
                  ...this.newAutomation,
                  name: (e.target as HTMLInputElement).value,
                };
              }}
              placeholder="My Automation"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <input
              type="text"
              class="form-input"
              .value=${this.newAutomation.description || ""}
              @input=${(e: Event) => {
                this.newAutomation = {
                  ...this.newAutomation,
                  description: (e.target as HTMLInputElement).value,
                };
              }}
              placeholder="What does this automation do?"
            />
          </div>

          <div class="form-group">
            <label class="form-label">IFTTT Event Name</label>
            <input
              type="text"
              class="form-input"
              .value=${this.newAutomation.action?.iftttEvent || ""}
              @input=${(e: Event) => {
                this.newAutomation = {
                  ...this.newAutomation,
                  action: {
                    ...this.newAutomation.action,
                    iftttEvent: (e.target as HTMLInputElement).value,
                  },
                };
              }}
              placeholder="farm_clawed_my_event"
            />
            <div class="form-hint">The IFTTT webhook event to trigger</div>
          </div>

          <div class="form-group">
            <label class="form-label">Approval Policy</label>
            <select
              class="form-select"
              .value=${this.newAutomation.approvalPolicy || "always"}
              @change=${(e: Event) => {
                this.newAutomation = {
                  ...this.newAutomation,
                  approvalPolicy: (e.target as HTMLSelectElement)
                    .value as Automation["approvalPolicy"],
                };
              }}
            >
              <option value="always">Always require approval</option>
              <option value="auto-within-guardrails">Auto within guardrails</option>
              <option value="auto">Fully automatic (not recommended)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-group">
              <input
                type="checkbox"
                ?checked=${this.newAutomation.dryRunMode ?? true}
                @change=${(e: Event) => {
                  this.newAutomation = {
                    ...this.newAutomation,
                    dryRunMode: (e.target as HTMLInputElement).checked,
                  };
                }}
              />
              <span>Enable Dry Run Mode (simulation only)</span>
            </label>
            <div class="form-hint">
              Dry run mode logs what would happen without actually triggering IFTTT
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click=${() => (this.showCreateModal = false)}>
              Cancel
            </button>
            <button class="btn btn-primary" @click=${this.handleCreateAutomation}>
              Create Automation
            </button>
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    const pendingCount = this.history.filter((h) => h.status === "pending").length;

    return html`
      <div class="container">
        <div class="header">
          <div>
            <h1>⚡ Automations</h1>
            <div class="subtitle">Build and manage IFTTT-powered automations with safety guardrails</div>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" @click=${() => (this.activeTab = "history")}>
              📋 History ${pendingCount > 0 ? `(${pendingCount})` : ""}
            </button>
            <button
              class="btn btn-primary"
              @click=${() => {
                this.activeTab = "templates";
              }}
            >
              ➕ New Automation
            </button>
          </div>
        </div>

        <div class="tabs">
          <button
            class="tab ${this.activeTab === "automations" ? "active" : ""}"
            @click=${() => (this.activeTab = "automations")}
          >
            My Automations
          </button>
          <button
            class="tab ${this.activeTab === "templates" ? "active" : ""}"
            @click=${() => (this.activeTab = "templates")}
          >
            Templates
          </button>
          <button
            class="tab ${this.activeTab === "history" ? "active" : ""}"
            @click=${() => (this.activeTab = "history")}
          >
            History ${pendingCount > 0 ? `(${pendingCount})` : ""}
          </button>
        </div>

        ${
          this.activeTab === "automations"
            ? this.renderAutomationsTab()
            : this.activeTab === "templates"
              ? this.renderTemplatesTab()
              : this.renderHistoryTab()
        }
      </div>

      ${this.showCreateModal ? this.renderCreateModal() : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-automations-view": FarmAutomationsView;
  }
}
