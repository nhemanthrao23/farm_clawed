/**
 * Farm IPM View - Integrated Pest Management
 */

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("farm-ipm-view")
export class FarmIpmView extends LitElement {
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
    
    .status-banner {
      padding: 1rem;
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      border: 1px solid var(--ok, #22c55e);
      border-radius: 8px;
      color: var(--ok, #22c55e);
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .pest-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .pest-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
    }
    
    .pest-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .pest-icon {
      font-size: 1.5rem;
    }
    
    .pest-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .pest-status {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .pest-risk {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    
    .pest-risk.low {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
    }
    
    .pest-risk.medium {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      color: var(--warn, #f59e0b);
    }
    
    .beneficial-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    
    .beneficial-card {
      padding: 1rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
      text-align: center;
    }
    
    .beneficial-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .beneficial-name {
      font-size: 0.85rem;
      color: var(--text, #e4e4e7);
      font-weight: 500;
    }
    
    .beneficial-role {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
    }
    
    .checklist {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      font-size: 0.9rem;
      color: var(--text, #e4e4e7);
    }
    
    .checklist-item input {
      width: 18px;
      height: 18px;
      accent-color: var(--ok, #22c55e);
    }
  `;

  override render() {
    return html`
      <div class="container">
        <h1>🐛 Integrated Pest Management</h1>
        <p class="subtitle">Monitor pests and beneficial insects for healthy plants</p>
      
        <div class="status-banner">✓ No active pest alerts</div>
      
        <div class="section">
          <div class="section-title">Common Citrus Pests to Watch</div>
          <div class="pest-list">
            <div class="pest-item">
              <div class="pest-info">
                <span class="pest-icon">🦟</span>
                <div>
                  <div class="pest-name">Aphids</div>
                  <div class="pest-status">Check new growth and leaf undersides</div>
                </div>
              </div>
              <span class="pest-risk low">Low Risk</span>
            </div>
            <div class="pest-item">
              <div class="pest-info">
                <span class="pest-icon">🐚</span>
                <div>
                  <div class="pest-name">Scale Insects</div>
                  <div class="pest-status">Inspect stems and leaf joints</div>
                </div>
              </div>
              <span class="pest-risk low">Low Risk</span>
            </div>
            <div class="pest-item">
              <div class="pest-info">
                <span class="pest-icon">🕷️</span>
                <div>
                  <div class="pest-name">Spider Mites</div>
                  <div class="pest-status">Look for fine webbing on leaves</div>
                </div>
              </div>
              <span class="pest-risk low">Low Risk</span>
            </div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Beneficial Insects</div>
          <div class="beneficial-grid">
            <div class="beneficial-card">
              <div class="beneficial-icon">🐞</div>
              <div class="beneficial-name">Ladybugs</div>
              <div class="beneficial-role">Aphid predator</div>
            </div>
            <div class="beneficial-card">
              <div class="beneficial-icon">🐝</div>
              <div class="beneficial-name">Bees</div>
              <div class="beneficial-role">Pollinator</div>
            </div>
            <div class="beneficial-card">
              <div class="beneficial-icon">🦗</div>
              <div class="beneficial-name">Lacewings</div>
              <div class="beneficial-role">Pest predator</div>
            </div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Weekly IPM Checklist</div>
          <div class="checklist">
            <label class="checklist-item">
              <input type="checkbox" />
              <span>Inspect leaf undersides for pests</span>
            </label>
            <label class="checklist-item">
              <input type="checkbox" />
              <span>Check new growth for aphids</span>
            </label>
            <label class="checklist-item">
              <input type="checkbox" />
              <span>Look for beneficial insect activity</span>
            </label>
            <label class="checklist-item">
              <input type="checkbox" />
              <span>Remove any damaged or diseased leaves</span>
            </label>
            <label class="checklist-item">
              <input type="checkbox" />
              <span>Check soil surface for fungus gnats</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-ipm-view": FarmIpmView;
  }
}
