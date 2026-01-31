/**
 * Farm Console View
 *
 * Primary AI output feed and recommendations display.
 */

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("farm-console-view")
export class FarmConsoleView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
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
      color: var(--color-text-primary, #1a1a1a);
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.ok {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge.warning {
      background: #fef3c7;
      color: #92400e;
    }

    .grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: var(--color-bg-card, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 0.5rem;
      padding: 1rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .card-title {
      font-weight: 600;
      color: var(--color-text-primary, #1a1a1a);
    }

    .recommendation {
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin-bottom: 0.5rem;
    }

    .recommendation.high {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
    }

    .recommendation.medium {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
    }

    .recommendation.low {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
    }

    .recommendation-priority {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .recommendation-action {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .recommendation-reason {
      font-size: 0.875rem;
      color: var(--color-text-secondary, #6b7280);
    }

    .reading {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .reading:last-child {
      border-bottom: none;
    }

    .reading-label {
      color: var(--color-text-secondary, #6b7280);
    }

    .reading-value {
      font-weight: 600;
    }

    .reading-value.warning {
      color: #f59e0b;
    }

    .reading-value.critical {
      color: #ef4444;
    }

    .sources {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .sources-title {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #6b7280);
      margin-bottom: 0.5rem;
    }

    .source-tag {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: var(--color-bg-secondary, #f3f4f6);
      border-radius: 0.25rem;
      font-size: 0.75rem;
      margin-right: 0.25rem;
      margin-bottom: 0.25rem;
    }
  `;

  @state()
  private lastAnalysis = {
    timestamp: "2025-01-31T08:00:00Z",
    summary: "Initial assessment complete. Action required.",
  };

  @state()
  private readings = [
    { label: "Soil Moisture", value: "17%", status: "warning" },
    { label: "Soil Temperature", value: "54.5°F", status: "normal" },
    { label: "EC", value: "0.001 mS/cm", status: "warning" },
    { label: "Battery", value: "57%", status: "normal" },
  ];

  @state()
  private recommendations = [
    {
      priority: "high",
      action: "Water lemon tree with 0.5-1.0 gallons",
      reason: "Moisture at 17% is below stress threshold for citrus",
    },
    {
      priority: "medium",
      action: "Monitor overnight temperature",
      reason: "54°F soil temp with winter conditions warrants watch",
    },
    {
      priority: "low",
      action: "Plan spring fertilization",
      reason: "EC very low but winter dormancy means no urgency",
    },
  ];

  @state()
  private sources = ["sensor_readings.csv", "farm_profile.yaml", "season_calendar.yaml", "irrigation-policy skill"];

  override render() {
    return html`
      <div class="header">
        <h1>🌱 Farm Console</h1>
        <span class="status-badge warning">Action Needed</span>
      </div>

      <div class="grid">
        <div class="main-column">
          <div class="card">
            <div class="card-header">
              <span class="card-title">AI Analysis</span>
              <span style="font-size: 0.75rem; color: #6b7280">
                ${new Date(this.lastAnalysis.timestamp).toLocaleString()}
              </span>
            </div>

            <p style="margin-bottom: 1rem">${this.lastAnalysis.summary}</p>

            ${this.recommendations.map(
              (rec) => html`
                <div class="recommendation ${rec.priority}">
                  <div class="recommendation-priority">${rec.priority} Priority</div>
                  <div class="recommendation-action">${rec.action}</div>
                  <div class="recommendation-reason">${rec.reason}</div>
                </div>
              `,
            )}

            <div class="sources">
              <div class="sources-title">Sources Used</div>
              ${this.sources.map((s) => html`<span class="source-tag">${s}</span>`)}
            </div>
          </div>
        </div>

        <div class="side-column">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Latest Readings</span>
            </div>

            ${this.readings.map(
              (r) => html`
                <div class="reading">
                  <span class="reading-label">${r.label}</span>
                  <span class="reading-value ${r.status}">${r.value}</span>
                </div>
              `,
            )}
          </div>

          <div class="card" style="margin-top: 1rem">
            <div class="card-header">
              <span class="card-title">Quick Actions</span>
            </div>
            <button style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem">Run Analysis</button>
            <button style="width: 100%; padding: 0.5rem">View Audit Log</button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-console-view": FarmConsoleView;
  }
}

