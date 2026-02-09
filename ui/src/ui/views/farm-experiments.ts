/**
 * Farm Experiments View - Run experiments and A/B tests
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "completed" | "paused";
  startDate?: string;
  endDate?: string;
  hypothesis: string;
  metrics: string[];
  results?: string;
}

@customElement("farm-experiments-view")
export class FarmExperimentsView extends LitElement {
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
    }
    
    .subtitle {
      color: var(--muted, #71717a);
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    
    .experiment-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .experiment-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
    }
    
    .experiment-card.running {
      border-color: var(--info, #3b82f6);
    }
    
    .experiment-card.completed {
      border-color: var(--ok, #22c55e);
    }
    
    .experiment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }
    
    .experiment-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    
    .status-badge.draft {
      background: var(--bg-elevated, #1a1d25);
      color: var(--muted, #71717a);
    }
    
    .status-badge.running {
      background: var(--info-subtle, rgba(59, 130, 246, 0.12));
      color: var(--info, #3b82f6);
    }
    
    .status-badge.completed {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
    }
    
    .status-badge.paused {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      color: var(--warn, #f59e0b);
    }
    
    .experiment-description {
      color: var(--muted, #71717a);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    
    .experiment-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
      font-size: 0.85rem;
    }
    
    .meta-row {
      display: flex;
      gap: 0.5rem;
    }
    
    .meta-label {
      color: var(--muted, #71717a);
      min-width: 80px;
    }
    
    .meta-value {
      color: var(--text, #e4e4e7);
    }
    
    .metrics-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .metric-tag {
      padding: 0.25rem 0.5rem;
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      color: var(--accent, #ff5c5c);
      border-radius: 4px;
      font-size: 0.75rem;
    }
    
    .create-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--card, #181b22);
      border: 2px dashed var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      color: var(--muted, #71717a);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .create-btn:hover {
      border-color: var(--accent, #ff5c5c);
      color: var(--accent, #ff5c5c);
    }
  `;

  @property({ type: Array })
  experiments: Experiment[] = [
    {
      id: "lemon-tree",
      name: "Santa Teresa Lemon Tree",
      description:
        "Flagship experiment demonstrating farm_clawed capabilities with a containerized Meyer Lemon",
      status: "running",
      startDate: "2025-01-31",
      hypothesis:
        "AI-driven irrigation can reduce water usage by 25% while maintaining plant health",
      metrics: ["Water usage", "Soil moisture", "Plant health score", "Time saved"],
    },
    {
      id: "guild-test",
      name: "Citrus Guild Companion Planting",
      description: "Test the effect of adding comfrey and white clover as companion plants",
      status: "draft",
      hypothesis: "Guild plantings will reduce irrigation needs and improve soil fertility",
      metrics: ["Irrigation frequency", "EC readings", "Plant vigor"],
    },
  ];

  override render() {
    return html`
      <div class="container">
        <h1>🧪 Experiments</h1>
        <p class="subtitle">Run controlled experiments and track results</p>

        <div class="experiment-list">
          ${this.experiments.map(
            (exp) => html`
              <div class="experiment-card ${exp.status}">
                <div class="experiment-header">
                  <div class="experiment-name">${exp.name}</div>
                  <span class="status-badge ${exp.status}">
                    ${exp.status.charAt(0).toUpperCase() + exp.status.slice(1)}
                  </span>
                </div>

                <div class="experiment-description">${exp.description}</div>

                <div class="experiment-meta">
                  <div class="meta-row">
                    <span class="meta-label">Hypothesis:</span>
                    <span class="meta-value">${exp.hypothesis}</span>
                  </div>
                  ${
                    exp.startDate
                      ? html`
                        <div class="meta-row">
                          <span class="meta-label">Started:</span>
                          <span class="meta-value">${exp.startDate}</span>
                        </div>
                      `
                      : nothing
                  }
                  <div class="meta-row">
                    <span class="meta-label">Metrics:</span>
                    <div class="metrics-list">
                      ${exp.metrics.map((m) => html`<span class="metric-tag">${m}</span>`)}
                    </div>
                  </div>
                </div>
              </div>
            `,
          )}

          <button class="create-btn">
            ➕ Create New Experiment
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-experiments-view": FarmExperimentsView;
  }
}
