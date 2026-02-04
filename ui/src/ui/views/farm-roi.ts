/**
 * Farm ROI View - Return on investment tracking
 */

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("farm-roi-view")
export class FarmRoiView extends LitElement {
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
    
    .roi-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .roi-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
    }
    
    .roi-card.highlight {
      border-color: var(--ok, #22c55e);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
    }
    
    .roi-label {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.5rem;
    }
    
    .roi-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-strong, #fafafa);
    }
    
    .roi-value.positive {
      color: var(--ok, #22c55e);
    }
    
    .roi-trend {
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }
    
    .roi-trend.positive {
      color: var(--ok, #22c55e);
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
    
    .savings-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .savings-row:last-child {
      border-bottom: none;
    }
    
    .savings-label {
      color: var(--text, #e4e4e7);
      font-size: 0.9rem;
    }
    
    .savings-value {
      font-weight: 600;
      color: var(--ok, #22c55e);
    }
    
    .equipment-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .equipment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
    }
    
    .equipment-name {
      color: var(--text, #e4e4e7);
      font-size: 0.9rem;
    }
    
    .equipment-cost {
      color: var(--muted, #71717a);
      font-size: 0.85rem;
    }
    
    .payback-bar {
      height: 8px;
      background: var(--bg-elevated, #1a1d25);
      border-radius: 4px;
      overflow: hidden;
      margin-top: 1rem;
    }
    
    .payback-fill {
      height: 100%;
      background: var(--ok, #22c55e);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .payback-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      margin-top: 0.5rem;
    }
  `;

  override render() {
    return html`
      <div class="container">
        <h1>📊 ROI Tracking</h1>
        <p class="subtitle">Track your return on investment from farm automation</p>
      
        <div class="roi-summary">
          <div class="roi-card highlight">
            <div class="roi-label">Total Savings</div>
            <div class="roi-value positive">$47</div>
            <div class="roi-trend positive">Since starting farm_clawed</div>
          </div>
          <div class="roi-card">
            <div class="roi-label">Water Saved</div>
            <div class="roi-value">12.5 gal</div>
            <div class="roi-trend positive">↓ 25% vs manual</div>
          </div>
          <div class="roi-card">
            <div class="roi-label">Time Saved</div>
            <div class="roi-value">3.2 hrs</div>
            <div class="roi-trend positive">This month</div>
          </div>
          <div class="roi-card">
            <div class="roi-label">Payback Progress</div>
            <div class="roi-value">45%</div>
            <div class="roi-trend">~6 months to go</div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Monthly Savings Breakdown</div>
          <div class="savings-row">
            <span class="savings-label">💧 Water Savings</span>
            <span class="savings-value">$2.50</span>
          </div>
          <div class="savings-row">
            <span class="savings-label">⏱️ Time Savings (@ $25/hr)</span>
            <span class="savings-value">$12.50</span>
          </div>
          <div class="savings-row">
            <span class="savings-label">🌱 Avoided Plant Loss</span>
            <span class="savings-value">$15.00</span>
          </div>
          <div class="savings-row">
            <span class="savings-label">📉 Reduced Input Waste</span>
            <span class="savings-value">$5.00</span>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Equipment Investment</div>
          <div class="equipment-list">
            <div class="equipment-item">
              <span class="equipment-name">🔌 SmartLife Hub</span>
              <span class="equipment-cost">$25</span>
            </div>
            <div class="equipment-item">
              <span class="equipment-name">📡 Soil Sensor</span>
              <span class="equipment-cost">$35</span>
            </div>
            <div class="equipment-item">
              <span class="equipment-name">🚰 Valve Controller</span>
              <span class="equipment-cost">$45</span>
            </div>
          </div>
          <div style="padding-top: 1rem; border-top: 1px solid var(--border); margin-top: 1rem">
            <div style="display: flex; justify-content: space-between; color: var(--text-strong)">
              <span>Total Equipment Cost</span>
              <span style="font-weight: 600">$105</span>
            </div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Payback Timeline</div>
          <div class="payback-bar">
            <div class="payback-fill" style="width: 45%"></div>
          </div>
          <div class="payback-label">
            <span>$47 recovered</span>
            <span>$105 total</span>
          </div>
          <p style="color: var(--muted); font-size: 0.85rem; margin-top: 1rem">
            At current savings rate of ~$35/month, equipment payback in approximately 6 months.
          </p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-roi-view": FarmRoiView;
  }
}
