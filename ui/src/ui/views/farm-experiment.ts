/**
 * Farm Experiment View
 *
 * Lemon tree biodome experiment display.
 */

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement("farm-experiment-view")
export class FarmExperimentView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 1rem;
      font-family:
        system-ui,
        -apple-system,
        sans-serif;
    }
    
    .header {
      margin-bottom: 1.5rem;
    }
    
    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }
    
    .subtitle {
      color: var(--color-text-secondary, #6b7280);
    }
    
    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
      padding-bottom: 0.5rem;
    }
    
    .tab {
      padding: 0.5rem 1rem;
      border: none;
      background: none;
      cursor: pointer;
      font-weight: 500;
      color: var(--color-text-secondary, #6b7280);
      border-radius: 0.375rem;
    }
    
    .tab.active {
      background: var(--color-bg-secondary, #f3f4f6);
      color: var(--color-text-primary, #1a1a1a);
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    
    .card {
      background: var(--color-bg-card, #fff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: 0.5rem;
      padding: 1rem;
    }
    
    .card-title {
      font-weight: 600;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }
    
    .metric:last-child {
      border-bottom: none;
    }
    
    .metric-value {
      font-weight: 600;
    }
    
    .metric-value.warning {
      color: #f59e0b;
    }
    
    .metric-value.good {
      color: #22c55e;
    }
    
    .analysis-box {
      background: var(--color-bg-secondary, #f3f4f6);
      border-radius: 0.375rem;
      padding: 1rem;
      margin-top: 1rem;
    }
    
    .analysis-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .recommendation-item {
      padding: 0.5rem;
      margin: 0.5rem 0;
      border-radius: 0.25rem;
    }
    
    .recommendation-item.high {
      background: #fef2f2;
      border-left: 3px solid #ef4444;
    }
    
    .recommendation-item.medium {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
    }
    
    .recommendation-item.low {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
    }
    
    .scale-section {
      margin-top: 1.5rem;
      padding: 1rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 0.5rem;
    }
    
    .scale-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  `;

  @state()
  private activeTab = "overview";

  @state()
  private experimentData = {
    name: "Santa Teresa Lemon Tree Biodome",
    startDate: "2025-01-31",
    daysActive: 1,
    phase: "Initial Assessment",
  };

  @state()
  private readings = {
    moisture: { value: 17, unit: "%", status: "warning" },
    temperature: { value: 54.5, unit: "°F", status: "normal" },
    ec: { value: 0.001, unit: "mS/cm", status: "warning" },
    battery: { value: 57, unit: "%", status: "normal" },
  };

  @state()
  private roi = {
    waterSaved: 0,
    timeSaved: 0,
    estimatedValue: 0,
    equipmentCost: 105,
    paybackMonths: null as number | null,
  };

  override render() {
    return html`
      <div class="header">
        <h1>🍋 ${this.experimentData.name}</h1>
        <div class="subtitle">Day ${this.experimentData.daysActive} • ${this.experimentData.phase}</div>
      </div>

      <div class="tabs">
        <button class="tab ${this.activeTab === "overview" ? "active" : ""}" @click=${() => (this.activeTab = "overview")}>
          Overview
        </button>
        <button class="tab ${this.activeTab === "water" ? "active" : ""}" @click=${() => (this.activeTab = "water")}>
          Water
        </button>
        <button class="tab ${this.activeTab === "soil" ? "active" : ""}" @click=${() => (this.activeTab = "soil")}>
          Soil & Fertility
        </button>
        <button class="tab ${this.activeTab === "climate" ? "active" : ""}" @click=${() => (this.activeTab = "climate")}>
          Microclimate
        </button>
        <button class="tab ${this.activeTab === "roi" ? "active" : ""}" @click=${() => (this.activeTab = "roi")}>
          ROI
        </button>
      </div>

      ${this.activeTab === "overview" ? this.renderOverview() : ""}
      ${this.activeTab === "water" ? this.renderWater() : ""}
      ${this.activeTab === "soil" ? this.renderSoil() : ""}
      ${this.activeTab === "climate" ? this.renderClimate() : ""}
      ${this.activeTab === "roi" ? this.renderRoi() : ""}

      <div class="scale-section">
        <div class="scale-title">🌳 How This Scales</div>
        <p>
          This single container plant demonstrates the full farm_clawed system. The same sensors, AI analysis, safety
          guardrails, and approval workflows scale to:
        </p>
        <ul>
          <li><strong>10 containers</strong> → Same setup, multiple zones</li>
          <li><strong>Backyard orchard</strong> → Add drip irrigation, more sensors</li>
          <li><strong>Small farm</strong> → Zone-based management, scheduling</li>
          <li><strong>Commercial operation</strong> → Full automation with Jidoka safety</li>
        </ul>
      </div>
    `;
  }

  private renderOverview() {
    return html`
      <div class="grid">
        <div class="card">
          <div class="card-title">📊 Latest Readings</div>
          <div class="metric">
            <span>Soil Moisture</span>
            <span class="metric-value ${this.readings.moisture.status}">${this.readings.moisture.value}${this.readings.moisture.unit}</span>
          </div>
          <div class="metric">
            <span>Soil Temperature</span>
            <span class="metric-value">${this.readings.temperature.value}${this.readings.temperature.unit}</span>
          </div>
          <div class="metric">
            <span>EC</span>
            <span class="metric-value ${this.readings.ec.status}">${this.readings.ec.value} ${this.readings.ec.unit}</span>
          </div>
          <div class="metric">
            <span>Sensor Battery</span>
            <span class="metric-value">${this.readings.battery.value}${this.readings.battery.unit}</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">🤖 AI Analysis</div>
          <div class="analysis-box">
            <div class="analysis-title">Current Status: Action Needed</div>
            <p>Soil moisture is below optimal. Water recommended today.</p>
          </div>
          <div class="recommendation-item high">
            <strong>High:</strong> Water 0.5-1.0 gallons
          </div>
          <div class="recommendation-item medium">
            <strong>Medium:</strong> Monitor overnight temps
          </div>
          <div class="recommendation-item low">
            <strong>Low:</strong> Plan spring fertilization
          </div>
        </div>

        <div class="card">
          <div class="card-title">🔧 Devices</div>
          <div class="metric">
            <span>Soil Sensor</span>
            <span class="metric-value good">Online</span>
          </div>
          <div class="metric">
            <span>Water Valve</span>
            <span class="metric-value">Disabled</span>
          </div>
          <div class="metric">
            <span>SmartLife Hub</span>
            <span class="metric-value good">Connected</span>
          </div>
        </div>

        <div class="card">
          <div class="card-title">📈 ROI Summary</div>
          <div class="metric">
            <span>Water Saved</span>
            <span class="metric-value">${this.roi.waterSaved} gal</span>
          </div>
          <div class="metric">
            <span>Time Saved</span>
            <span class="metric-value">${this.roi.timeSaved} hrs</span>
          </div>
          <div class="metric">
            <span>Estimated Value</span>
            <span class="metric-value">$${this.roi.estimatedValue.toFixed(2)}</span>
          </div>
          <div class="metric">
            <span>Equipment Cost</span>
            <span class="metric-value">$${this.roi.equipmentCost}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderWater() {
    return html`
      <div class="card">
        <div class="card-title">💧 Water Module</div>
        <p>Current soil moisture: <strong>${this.readings.moisture.value}%</strong></p>
        <p>Status: <span style="color: #f59e0b">Below optimal (30-60%)</span></p>

        <div class="analysis-box">
          <div class="analysis-title">Recommendation</div>
          <p>Water with 0.5-1.0 gallons today. Deep watering encourages root growth.</p>
          <p>Best time: Early morning (before 9 AM)</p>
        </div>
      </div>
    `;
  }

  private renderSoil() {
    return html`
      <div class="card">
        <div class="card-title">🌱 Soil & Fertility Module</div>
        <p>Current EC: <strong>${this.readings.ec.value} mS/cm</strong></p>
        <p>Status: <span style="color: #f59e0b">Very low - indicates minimal dissolved nutrients</span></p>

        <div class="analysis-box">
          <div class="analysis-title">Assessment</div>
          <p>
            Low EC in winter is less critical as the plant is dormant. Plan to address with light fertilization as
            growth resumes in spring (February-March).
          </p>
        </div>
      </div>
    `;
  }

  private renderClimate() {
    return html`
      <div class="card">
        <div class="card-title">🌡️ Microclimate Module</div>
        <p>Soil temperature: <strong>${this.readings.temperature.value}°F</strong></p>
        <p>Status: <span style="color: #22c55e">Safe range, but monitor for frost</span></p>

        <div class="analysis-box">
          <div class="analysis-title">Frost Watch</div>
          <p>Zone 9b with average last frost February 15. Monitor overnight temps through mid-February.</p>
          <p>If temps drop below 35°F: cover plant, water for thermal mass, consider moving near house.</p>
        </div>
      </div>
    `;
  }

  private renderRoi() {
    return html`
      <div class="card">
        <div class="card-title">📊 ROI Dashboard</div>
      
        <div class="grid" style="margin-top: 1rem">
          <div>
            <h3>Investment</h3>
            <div class="metric">
              <span>Soil Sensor</span>
              <span class="metric-value">$35</span>
            </div>
            <div class="metric">
              <span>Valve Controller</span>
              <span class="metric-value">$45</span>
            </div>
            <div class="metric">
              <span>Hub</span>
              <span class="metric-value">$25</span>
            </div>
            <div class="metric">
              <span><strong>Total</strong></span>
              <span class="metric-value"><strong>$105</strong></span>
            </div>
          </div>
      
          <div>
            <h3>Expected Returns (Monthly)</h3>
            <div class="metric">
              <span>Water Savings</span>
              <span class="metric-value">$0.12</span>
            </div>
            <div class="metric">
              <span>Time Savings</span>
              <span class="metric-value">$37.50</span>
            </div>
            <div class="metric">
              <span>Avoided Loss</span>
              <span class="metric-value">$9.75</span>
            </div>
            <div class="metric">
              <span><strong>Total</strong></span>
              <span class="metric-value"><strong>$47.37</strong></span>
            </div>
          </div>
        </div>
      
        <div class="analysis-box">
          <div class="analysis-title">Payback Analysis</div>
          <p>At ~$47/month benefit, equipment pays for itself in <strong>2.2 months</strong>.</p>
          <p>After payback, all savings are pure benefit.</p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-experiment-view": FarmExperimentView;
  }
}
