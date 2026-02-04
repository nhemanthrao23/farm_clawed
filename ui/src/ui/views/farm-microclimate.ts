/**
 * Farm Microclimate View - Temperature, humidity, and frost risk
 */

import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("farm-microclimate-view")
export class FarmMicroclimateView extends LitElement {
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
    
    .temp-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      padding: 2rem;
    }
    
    .temp-main {
      text-align: center;
    }
    
    .temp-value {
      font-size: 4rem;
      font-weight: 700;
      color: var(--text-strong, #fafafa);
    }
    
    .temp-label {
      font-size: 0.9rem;
      color: var(--muted, #71717a);
    }
    
    .temp-secondary {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .temp-item {
      text-align: center;
      padding: 1rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
    }
    
    .temp-item-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text, #e4e4e7);
    }
    
    .temp-item-label {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .alert-banner {
      padding: 1rem;
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      border: 1px solid var(--ok, #22c55e);
      border-radius: 8px;
      color: var(--ok, #22c55e);
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .alert-banner.warning {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      border-color: var(--warn, #f59e0b);
      color: var(--warn, #f59e0b);
    }
    
    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 0.5rem;
    }
    
    .forecast-day {
      text-align: center;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
    }
    
    .forecast-day-name {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.25rem;
    }
    
    .forecast-day-icon {
      font-size: 1.25rem;
      margin-bottom: 0.25rem;
    }
    
    .forecast-day-temps {
      font-size: 0.75rem;
      color: var(--text, #e4e4e7);
    }
  `;

  override render() {
    return html`
      <div class="container">
        <h1>🌡️ Microclimate</h1>
        <p class="subtitle">Temperature monitoring and frost risk assessment</p>
      
        <div class="section">
          <div class="section-title">Current Conditions</div>
          <div class="temp-display">
            <div class="temp-main">
              <div class="temp-value">54°</div>
              <div class="temp-label">Soil Temperature</div>
            </div>
            <div class="temp-secondary">
              <div class="temp-item">
                <div class="temp-item-value">62°F</div>
                <div class="temp-item-label">Air Temp</div>
              </div>
              <div class="temp-item">
                <div class="temp-item-value">45%</div>
                <div class="temp-item-label">Humidity</div>
              </div>
            </div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Frost Risk</div>
          <div class="alert-banner">✓ No frost risk in next 7 days</div>
        </div>
      
        <div class="section">
          <div class="section-title">7-Day Forecast</div>
          <div class="forecast-grid">
            <div class="forecast-day">
              <div class="forecast-day-name">Today</div>
              <div class="forecast-day-icon">☀️</div>
              <div class="forecast-day-temps">72/54</div>
            </div>
            <div class="forecast-day">
              <div class="forecast-day-name">Tue</div>
              <div class="forecast-day-icon">⛅</div>
              <div class="forecast-day-temps">68/52</div>
            </div>
            <div class="forecast-day">
              <div class="forecast-day-name">Wed</div>
              <div class="forecast-day-icon">☀️</div>
              <div class="forecast-day-temps">70/55</div>
            </div>
            <div class="forecast-day">
              <div class="forecast-day-name">Thu</div>
              <div class="forecast-day-icon">☀️</div>
              <div class="forecast-day-temps">74/56</div>
            </div>
            <div class="forecast-day">
              <div class="forecast-day-name">Fri</div>
              <div class="forecast-day-icon">🌧️</div>
              <div class="forecast-day-temps">65/50</div>
            </div>
            <div class="forecast-day">
              <div class="forecast-day-name">Sat</div>
              <div class="forecast-day-icon">⛅</div>
              <div class="forecast-day-temps">68/52</div>
            </div>
            <div class="forecast-day">
              <div class="forecast-day-name">Sun</div>
              <div class="forecast-day-icon">☀️</div>
              <div class="forecast-day-temps">72/54</div>
            </div>
          </div>
        </div>
      
        <div class="section">
          <div class="section-title">Growing Degree Days</div>
          <div style="color: var(--muted); font-size: 0.9rem">
            <p>Accumulated GDD (base 50°F): 145</p>
            <p>Citrus growth optimal above 55°F soil temp</p>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-microclimate-view": FarmMicroclimateView;
  }
}
