/**
 * Farm Approvals View - Pending automation approvals
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

export interface PendingApproval {
  id: string;
  type: "water" | "fertilize" | "climate" | "maintenance";
  action: string;
  target: string;
  reason: string;
  confidence: number;
  createdAt: string;
  expiresAt: string;
  automationId?: string;
  estimatedImpact?: string;
}

@customElement("farm-approvals-view")
export class FarmApprovalsView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--bg, #12141a);
      padding: 1.5rem;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin: 0 0 0.5rem 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .badge {
      font-size: 0.8rem;
      padding: 0.25rem 0.75rem;
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      color: var(--accent, #ff5c5c);
      border-radius: 9999px;
    }
    
    .subtitle {
      color: var(--muted, #71717a);
      font-size: 0.9rem;
      margin-bottom: 2rem;
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
    
    .approval-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .approval-card {
      background: var(--card, #181b22);
      border: 1px solid var(--accent, #ff5c5c);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      box-shadow: 0 0 20px rgba(255, 92, 92, 0.1);
    }
    
    .approval-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    
    .approval-type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--accent, #ff5c5c);
    }
    
    .approval-time {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .approval-action {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.5rem;
    }
    
    .approval-reason {
      font-size: 0.9rem;
      color: var(--muted, #71717a);
      margin-bottom: 1rem;
    }
    
    .approval-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .meta-item span {
      color: var(--text, #e4e4e7);
      font-weight: 500;
    }
    
    .approval-buttons {
      display: flex;
      gap: 0.75rem;
    }
    
    .btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md, 8px);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
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

  @property({ type: Array })
  approvals: PendingApproval[] = [
    {
      id: "1",
      type: "water",
      action: "Water Meyer Lemon Tree for 2 minutes",
      target: "Meyer Lemon Tree",
      reason: "Soil moisture at 17% is below the optimal 30-60% range",
      confidence: 92,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      estimatedImpact: "~1.0 gallon",
    },
  ];

  private getTypeIcon(type: PendingApproval["type"]): string {
    const icons: Record<string, string> = {
      water: "💧",
      fertilize: "🌱",
      climate: "🌡️",
      maintenance: "🔧",
    };
    return icons[type] || "⚙️";
  }

  private formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private getExpiresIn(expiresAt: string): string {
    const ms = new Date(expiresAt).getTime() - Date.now();
    const minutes = Math.floor(ms / 60000);
    if (minutes <= 0) return "Expired";
    return `${minutes} min`;
  }

  private handleApprove(id: string) {
    this.dispatchEvent(new CustomEvent("approve", { detail: { id } }));
  }

  private handleReject(id: string) {
    this.dispatchEvent(new CustomEvent("reject", { detail: { id } }));
  }

  private handleModify(id: string) {
    this.dispatchEvent(new CustomEvent("modify", { detail: { id } }));
  }

  override render() {
    const pendingCount = this.approvals.length;

    return html`
      <div class="container">
        <h1>
          ✓ Approvals
          ${pendingCount > 0 ? html`<span class="badge">${pendingCount} pending</span>` : nothing}
        </h1>
        <p class="subtitle">Review and approve pending automation actions</p>

        ${
          this.approvals.length === 0
            ? html`
                <div class="empty-state">
                  <div class="empty-icon">✓</div>
                  <div class="empty-title">All caught up!</div>
                  <div>No pending approvals at this time.</div>
                </div>
              `
            : html`
              <div class="approval-list">
                ${this.approvals.map(
                  (approval) => html`
                    <div class="approval-card">
                      <div class="approval-header">
                        <div class="approval-type">
                          ${this.getTypeIcon(approval.type)}
                          Pending Review
                        </div>
                        <span class="approval-time">
                          Expires in ${this.getExpiresIn(approval.expiresAt)}
                        </span>
                      </div>

                      <div class="approval-action">${approval.action}</div>
                      <div class="approval-reason">${approval.reason}</div>

                      <div class="approval-meta">
                        <div class="meta-item">
                          Target: <span>${approval.target}</span>
                        </div>
                        <div class="meta-item">
                          Confidence: <span>${approval.confidence}%</span>
                        </div>
                        ${
                          approval.estimatedImpact
                            ? html`
                              <div class="meta-item">
                                Impact: <span>${approval.estimatedImpact}</span>
                              </div>
                            `
                            : nothing
                        }
                      </div>

                      <div class="approval-buttons">
                        <button
                          class="btn btn-approve"
                          @click=${() => this.handleApprove(approval.id)}
                        >
                          ✓ Approve
                        </button>
                        <button
                          class="btn btn-reject"
                          @click=${() => this.handleReject(approval.id)}
                        >
                          ✕ Reject
                        </button>
                        <button
                          class="btn btn-modify"
                          @click=${() => this.handleModify(approval.id)}
                        >
                          ✏️ Modify
                        </button>
                      </div>
                    </div>
                  `,
                )}
              </div>
            `
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-approvals-view": FarmApprovalsView;
  }
}
