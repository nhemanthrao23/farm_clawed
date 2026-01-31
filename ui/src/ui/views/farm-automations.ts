/**
 * Farm Automations View
 *
 * Historical view of automation history and pending actions.
 * Uses app's dark theme CSS variables.
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

// Automation record
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
}

@customElement("farm-automations-view")
export class FarmAutomationsView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--bg, #12141a);
    }

    .automations-container {
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

    .automations-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .automation-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      transition: all 0.15s ease;
    }

    .automation-card.pending {
      border-color: var(--accent, #ff5c5c);
      box-shadow: 0 0 20px rgba(255, 92, 92, 0.1);
    }

    .automation-card.running {
      border-color: var(--info, #3b82f6);
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
    }

    .automation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .automation-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .automation-badge.pending {
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      color: var(--accent, #ff5c5c);
    }

    .automation-badge.approved,
    .automation-badge.completed {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
    }

    .automation-badge.rejected {
      background: var(--danger-subtle, rgba(239, 68, 68, 0.12));
      color: var(--danger, #ef4444);
    }

    .automation-badge.expired {
      background: var(--bg-elevated, #1a1d25);
      color: var(--muted, #71717a);
    }

    .automation-badge.running {
      background: var(--info-subtle, rgba(59, 130, 246, 0.12));
      color: var(--info, #3b82f6);
    }

    .automation-time {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }

    .automation-action {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.375rem;
    }

    .automation-reason {
      font-size: 0.85rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.75rem;
    }

    .automation-meta {
      display: flex;
      gap: 1.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border, #27272a);
      font-size: 0.75rem;
    }

    .meta-item {
      color: var(--muted, #71717a);
    }

    .meta-value {
      color: var(--text, #e4e4e7);
      font-weight: 500;
    }

    .automation-buttons {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md, 8px);
      font-size: 0.875rem;
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

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
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

    .empty-subtitle {
      font-size: 0.875rem;
    }
  `;

  @property({ type: Array })
  automations: AutomationRecord[] = [
    {
      id: "1",
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
  private filter: "all" | "pending" | "approved" | "rejected" | "completed" = "all";

  private getTypeIcon(type: AutomationRecord["type"]): string {
    const icons: Record<string, string> = { water: "💧", fertilize: "🌱", climate: "🌡️", maintenance: "🔧" };
    return icons[type] || "⚙️";
  }

  private getStatusLabel(status: AutomationRecord["status"]): string {
    const labels: Record<string, string> = {
      pending: "Pending Review",
      approved: "Approved",
      rejected: "Rejected",
      expired: "Expired",
      running: "Running",
      completed: "Completed",
    };
    return labels[status] || status;
  }

  private getFilteredAutomations(): AutomationRecord[] {
    if (this.filter === "all") return this.automations;
    return this.automations.filter((a) => a.status === this.filter);
  }

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  private handleApprove(id: string) {
    this.dispatchEvent(new CustomEvent("approve-automation", { detail: { id } }));
  }

  private handleReject(id: string) {
    this.dispatchEvent(new CustomEvent("reject-automation", { detail: { id } }));
  }

  private handleModify(id: string) {
    this.dispatchEvent(new CustomEvent("modify-automation", { detail: { id } }));
  }

  override render() {
    const filtered = this.getFilteredAutomations();
    const pendingCount = this.automations.filter((a) => a.status === "pending").length;

    return html`
      <div class="automations-container">
        <div class="header">
          <h1>
            ⚡ Automations
            ${pendingCount > 0 ? html`<span style="font-size: 0.8rem; color: var(--accent)">(${pendingCount} pending)</span>` : nothing}
          </h1>
          <div class="filter-tabs">
            ${(["all", "pending", "approved", "rejected", "completed"] as const).map(
              (f) => html`
                <button
                  class="filter-tab ${this.filter === f ? "active" : ""}"
                  @click=${() => (this.filter = f)}
                >
                  ${f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              `
            )}
          </div>
        </div>

        ${filtered.length === 0
          ? html`
              <div class="empty-state">
                <div class="empty-icon">⚡</div>
                <div class="empty-title">No ${this.filter === "all" ? "" : this.filter} automations</div>
                <div class="empty-subtitle">
                  ${this.filter === "pending"
                    ? "All automation proposals have been reviewed."
                    : "Automation proposals will appear here when AI recommends actions."}
                </div>
              </div>
            `
          : html`
              <div class="automations-list">
                ${filtered.map(
                  (automation) => html`
                    <div class="automation-card ${automation.status}">
                      <div class="automation-header">
                        <div class="automation-badge ${automation.status}">
                          ${this.getTypeIcon(automation.type)}
                          ${this.getStatusLabel(automation.status)}
                        </div>
                        <span class="automation-time">${this.formatTime(automation.createdAt)}</span>
                      </div>

                      <div class="automation-action">${automation.action}</div>
                      <div class="automation-reason">${automation.reason}</div>

                      <div class="automation-meta">
                        <div class="meta-item">
                          <span>Target: </span>
                          <span class="meta-value">${automation.target}</span>
                        </div>
                        <div class="meta-item">
                          <span>Confidence: </span>
                          <span class="meta-value">${automation.confidence}%</span>
                        </div>
                        ${automation.decidedAt
                          ? html`
                              <div class="meta-item">
                                <span>Decided: </span>
                                <span class="meta-value">${this.formatTime(automation.decidedAt)}</span>
                              </div>
                            `
                          : nothing}
                        ${automation.executedAt
                          ? html`
                              <div class="meta-item">
                                <span>Executed: </span>
                                <span class="meta-value">${this.formatTime(automation.executedAt)}</span>
                              </div>
                            `
                          : nothing}
                      </div>

                      ${automation.status === "pending"
                        ? html`
                            <div class="automation-buttons">
                              <button class="btn btn-approve" @click=${() => this.handleApprove(automation.id)}>
                                ✓ Approve
                              </button>
                              <button class="btn btn-reject" @click=${() => this.handleReject(automation.id)}>
                                ✕ Reject
                              </button>
                              <button class="btn btn-modify" @click=${() => this.handleModify(automation.id)}>
                                ✏️ Modify
                              </button>
                            </div>
                          `
                        : nothing}
                    </div>
                  `
                )}
              </div>
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-automations-view": FarmAutomationsView;
  }
}

