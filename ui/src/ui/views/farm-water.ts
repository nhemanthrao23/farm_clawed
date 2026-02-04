/**
 * Farm Water View - Water management and irrigation
 */

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("farm-water-view")
export class FarmWaterView extends LitElement {
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
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.5rem;
    }
    
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-strong, #fafafa);
    }
    
    .stat-unit {
      font-size: 0.9rem;
      color: var(--muted, #71717a);
      margin-left: 0.25rem;
    }
    
    .stat-change {
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }
    
    .stat-change.positive {
      color: var(--ok, #22c55e);
    }
    
    .stat-change.negative {
      color: var(--danger, #ef4444);
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
    
    .zone-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .zone {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
    }
    
    .zone-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .zone-icon {
      font-size: 1.5rem;
    }
    
    .zone-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .zone-status {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .moisture-bar {
      width: 120px;
      height: 8px;
      background: var(--bg-elevated, #1a1d25);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .moisture-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .moisture-fill.low {
      background: var(--danger, #ef4444);
    }
    
    .moisture-fill.ok {
      background: var(--ok, #22c55e);
    }
    
    .moisture-fill.high {
      background: var(--info, #3b82f6);
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .btn-primary {
      background: var(--accent, #ff5c5c);
      border: none;
      color: white;
    }
    
    .btn-primary:hover {
      background: var(--accent-hover, #ff7070);
    }
  `;

  override render() {
    return html`
      <div class="container">
        <h1>💧 Water Management</h1>
        <p class="subtitle">Monitor moisture levels and manage irrigation</p>
      
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Water Used Today</div>
            <div class="stat-value">0.5<span class="stat-unit">gal</span></div>
            <div class="stat-change positive">↓ 25% vs yesterday</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Water Used This Week</div>
            <div class="stat-value">3.2<span class="stat-unit">gal</span></div>
            <div class="stat-change positive">↓ 15% vs last week</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Est. Monthly</div>
            <div class="stat-value">12.8<span class="stat-unit">gal</span></div>
            <div class="stat-change positive">$0.10 est. cost</div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Irrigation Zones</div>
          <div class="zone-list">
            <div class="zone">
              <div class="zone-info">
                <span class="zone-icon">🍋</span>
                <div>
                  <div class="zone-name">Meyer Lemon Tree</div>
                  <div class="zone-status">Last watered: Yesterday 6:00 PM</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem">
                <div>
                  <div style="font-size: 0.75rem; color: var(--muted); margin-bottom: 0.25rem">17%</div>
                  <div class="moisture-bar">
                    <div class="moisture-fill low" style="width: 17%"></div>
                  </div>
                </div>
                <button class="btn btn-primary">Water Now</button>
              </div>
            </div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Water Budget</div>
          <div style="color: var(--muted); font-size: 0.9rem">
            <p>Daily budget: 10 gal • Weekly budget: 70 gal</p>
            <p>Drought stage: Normal (0) - Full allocation</p>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-water-view": FarmWaterView;
  }
}
