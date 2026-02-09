/**
 * Farm Soil View - Soil health and fertility management
 */

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("farm-soil-view")
export class FarmSoilView extends LitElement {
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
    
    .section {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    
    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 1rem;
    }
    
    .reading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    
    .reading-card {
      padding: 1rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
      text-align: center;
    }
    
    .reading-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    .reading-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-strong, #fafafa);
    }
    
    .reading-label {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
    }
    
    .reading-status {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      margin-top: 0.5rem;
      display: inline-block;
    }
    
    .reading-status.warning {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      color: var(--warn, #f59e0b);
    }
    
    .reading-status.ok {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
    }
    
    .amendment-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .amendment {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
    }
    
    .amendment-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .amendment-name {
      font-size: 0.9rem;
      color: var(--text, #e4e4e7);
    }
    
    .amendment-date {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
  `;

  override render() {
    return html`
      <div class="container">
        <h1>🌱 Soil & Fertility</h1>
        <p class="subtitle">Monitor soil health, EC, and track amendments</p>
      
        <div class="section">
          <div class="section-title">Current Readings - Meyer Lemon</div>
          <div class="reading-grid">
            <div class="reading-card">
              <div class="reading-icon">💧</div>
              <div class="reading-value">17%</div>
              <div class="reading-label">Moisture</div>
              <div class="reading-status warning">Low</div>
            </div>
            <div class="reading-card">
              <div class="reading-icon">⚡</div>
              <div class="reading-value">0.001</div>
              <div class="reading-label">EC (mS/cm)</div>
              <div class="reading-status warning">Low Nutrients</div>
            </div>
            <div class="reading-card">
              <div class="reading-icon">🌡️</div>
              <div class="reading-value">54.5°F</div>
              <div class="reading-label">Soil Temp</div>
              <div class="reading-status ok">Good</div>
            </div>
            <div class="reading-card">
              <div class="reading-icon">📊</div>
              <div class="reading-value">6.5</div>
              <div class="reading-label">pH (est.)</div>
              <div class="reading-status ok">Optimal</div>
            </div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Fertility Schedule</div>
          <div class="amendment-list">
            <div class="amendment">
              <div class="amendment-info">
                <span>🌿</span>
                <div>
                  <div class="amendment-name">Citrus fertilizer (Spring application)</div>
                  <div class="amendment-date">Next: March 2026</div>
                </div>
              </div>
            </div>
            <div class="amendment">
              <div class="amendment-info">
                <span>🪱</span>
                <div>
                  <div class="amendment-name">Compost top-dress</div>
                  <div class="amendment-date">Last: January 2026</div>
                </div>
              </div>
            </div>
            <div class="amendment">
              <div class="amendment-info">
                <span>🍂</span>
                <div>
                  <div class="amendment-name">Mulch refresh</div>
                  <div class="amendment-date">Next: April 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Recommendations</div>
          <div style="color: var(--muted); font-size: 0.9rem">
            <p>• EC reading is low - consider light fertilization when watering next</p>
            <p>• Soil temperature is cool - citrus growth may be slow until spring warming</p>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-soil-view": FarmSoilView;
  }
}
