/**
 * Farm Setup View - 5-Step Onboarding Wizard
 *
 * Guides users through setting up farm_clawed:
 * Step 1: Farm Type Selection + Farm Context Pack
 * Step 2: Permaculture Depth + Automation Level
 * Step 3: Data Sources (Manual/CSV/FMIS)
 * Step 4: IFTTT Actuator Setup
 * Step 5: First AI Plan
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

type FarmType = "garden" | "orchard" | "ranch" | "row-crop";
type DataSource = "manual" | "csv" | "home-assistant" | "deere" | "fieldview";

interface SetupState {
  farmType: FarmType | null;
  permacultureDepth: number;
  automationLevel: number;
  dataSource: DataSource;
  iftttKey: string;
  iftttTested: boolean;
  aiPlanGenerated: boolean;
}

@customElement("farm-setup-view")
export class FarmSetupView extends LitElement {
  static override styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      background: var(--bg, #12141a);
    }
    
    .container {
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin: 0 0 0.5rem 0;
      text-align: center;
    }
    
    .subtitle {
      color: var(--muted, #71717a);
      font-size: 0.9rem;
      text-align: center;
      margin-bottom: 2rem;
    }
    
    /* No Secrets Banner */
    .security-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: var(--info-subtle, rgba(59, 130, 246, 0.12));
      border: 1px solid var(--info, #3b82f6);
      border-radius: 8px;
      margin-bottom: 2rem;
      font-size: 0.85rem;
      color: var(--info, #3b82f6);
    }
    
    .security-banner.warning {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      border-color: var(--warn, #f59e0b);
      color: var(--warn, #f59e0b);
    }
    
    /* Progress Steps */
    .progress-steps {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2rem;
      position: relative;
    }
    
    .progress-steps::before {
      content: "";
      position: absolute;
      top: 16px;
      left: 32px;
      right: 32px;
      height: 2px;
      background: var(--border, #27272a);
      z-index: 0;
    }
    
    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      z-index: 1;
    }
    
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--card, #181b22);
      border: 2px solid var(--border, #27272a);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted, #71717a);
      transition: all 0.2s ease;
    }
    
    .step-indicator.active .step-circle {
      background: var(--accent, #ff5c5c);
      border-color: var(--accent, #ff5c5c);
      color: white;
    }
    
    .step-indicator.completed .step-circle {
      background: var(--ok, #22c55e);
      border-color: var(--ok, #22c55e);
      color: white;
    }
    
    .step-label {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      text-align: center;
      max-width: 60px;
    }
    
    .step-indicator.active .step-label {
      color: var(--text, #e4e4e7);
    }
    
    /* Step Content */
    .step-content {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .step-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.5rem;
    }
    
    .step-description {
      font-size: 0.9rem;
      color: var(--muted, #71717a);
      margin-bottom: 1.5rem;
    }
    
    /* Farm Type Selection */
    .type-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .type-card {
      padding: 1.25rem;
      background: var(--bg, #12141a);
      border: 2px solid var(--border, #27272a);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
    }
    
    .type-card:hover {
      border-color: var(--accent, #ff5c5c);
    }
    
    .type-card.selected {
      border-color: var(--accent, #ff5c5c);
      background: var(--accent-subtle, rgba(255, 92, 92, 0.1));
    }
    
    .type-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .type-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .type-desc {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
    }
    
    /* Sliders */
    .slider-section {
      margin-bottom: 1.5rem;
    }
    
    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    
    .slider-label {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .slider-value {
      font-size: 0.85rem;
      color: var(--accent, #ff5c5c);
      font-weight: 600;
    }
    
    input[type="range"] {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: var(--bg, #12141a);
      outline: none;
      -webkit-appearance: none;
    }
    
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--accent, #ff5c5c);
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .slider-description {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: 6px;
    }
    
    /* Data Source Options */
    .source-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .source-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg, #12141a);
      border: 2px solid var(--border, #27272a);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .source-option:hover {
      border-color: var(--accent, #ff5c5c);
    }
    
    .source-option.selected {
      border-color: var(--accent, #ff5c5c);
      background: var(--accent-subtle, rgba(255, 92, 92, 0.1));
    }
    
    .source-icon {
      font-size: 1.5rem;
    }
    
    .source-info {
      flex: 1;
    }
    
    .source-name {
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .source-desc {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .source-badge {
      padding: 0.25rem 0.5rem;
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
      font-size: 0.7rem;
      border-radius: 4px;
    }
    
    /* IFTTT Setup */
    .input-group {
      margin-bottom: 1rem;
    }
    
    .input-label {
      display: block;
      font-size: 0.85rem;
      color: var(--text, #e4e4e7);
      margin-bottom: 0.5rem;
    }
    
    .input-field {
      width: 100%;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border: 1px solid var(--border, #27272a);
      border-radius: 6px;
      color: var(--text, #e4e4e7);
      font-size: 0.9rem;
    }
    
    .input-field:focus {
      outline: none;
      border-color: var(--accent, #ff5c5c);
    }
    
    .input-hint {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      margin-top: 0.5rem;
    }
    
    .input-hint a {
      color: var(--accent, #ff5c5c);
      text-decoration: none;
    }
    
    .test-btn {
      padding: 0.5rem 1rem;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 6px;
      color: var(--text, #e4e4e7);
      font-size: 0.85rem;
      cursor: pointer;
      margin-top: 0.5rem;
    }
    
    .test-btn:hover {
      border-color: var(--accent, #ff5c5c);
    }
    
    .test-success {
      color: var(--ok, #22c55e);
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }
    
    /* Safety Checklist */
    .checklist {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .checklist-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      font-size: 0.85rem;
      color: var(--text, #e4e4e7);
    }
    
    .checklist-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: var(--ok, #22c55e);
    }
    
    /* Navigation Buttons */
    .nav-buttons {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    
    .btn {
      padding: 0.875rem 1.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border, #27272a);
      color: var(--muted, #71717a);
    }
    
    .btn-secondary:hover {
      border-color: var(--text, #e4e4e7);
      color: var(--text, #e4e4e7);
    }
    
    .btn-primary {
      background: var(--accent, #ff5c5c);
      border: none;
      color: white;
      flex: 1;
    }
    
    .btn-primary:hover {
      background: var(--accent-hover, #ff7070);
      box-shadow: 0 0 20px rgba(255, 92, 92, 0.3);
    }
    
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* AI Plan */
    .ai-plan {
      padding: 1.25rem;
      background: var(--bg, #12141a);
      border-radius: 8px;
      border-left: 3px solid var(--accent, #ff5c5c);
    }
    
    .ai-plan-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.75rem;
    }
    
    .ai-plan-content {
      font-size: 0.9rem;
      color: var(--text, #e4e4e7);
      line-height: 1.6;
    }
    
    .ai-plan-content p {
      margin: 0.5rem 0;
    }
  `;

  @state()
  private currentStep = 1;

  @state()
  private setupState: SetupState = {
    farmType: null,
    permacultureDepth: 1,
    automationLevel: 2,
    dataSource: "manual",
    iftttKey: "",
    iftttTested: false,
    aiPlanGenerated: false,
  };

  @state()
  private envValid = true;

  @state()
  private safetyChecked = false;

  private getPermacultureDescription(level: number): string {
    const descriptions: Record<number, string> = {
      0: "Standard farm ops - fields, blocks, and irrigation zones",
      1: "Regen-friendly - soil health focus, water conservation, IPM basics",
      2: "Permaculture-lite - optional zones/sectors, guild guidance",
      3: "Full permaculture - zones 0-5, sectors, guilds, succession planning",
    };
    return descriptions[level] || "";
  }

  private getAutomationDescription(level: number): string {
    const descriptions: Record<number, string> = {
      0: "Observe only - dashboards and logs, no automation",
      1: "Assist - AI recommendations and checklists",
      2: "Propose + Approve - human-in-loop approvals (recommended)",
      3: "Auto-within-guardrails - automatic with safety limits",
      4: "Full Ops - hardware integration with Jidoka safety",
    };
    return descriptions[level] || "";
  }

  private canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.setupState.farmType !== null;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return this.setupState.dataSource !== "manual"
          ? true
          : this.safetyChecked || !this.setupState.iftttKey;
      case 5:
        return true;
      default:
        return false;
    }
  }

  private handleNext() {
    if (this.currentStep < 5) {
      this.currentStep++;
    }
  }

  private handleBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  private handleFarmTypeSelect(type: FarmType) {
    this.setupState = { ...this.setupState, farmType: type };
  }

  private handleDataSourceSelect(source: DataSource) {
    this.setupState = { ...this.setupState, dataSource: source };
  }

  private async handleTestIfttt() {
    // Simulate test (in real app, would make a test webhook call)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.setupState = { ...this.setupState, iftttTested: true };
  }

  private handleGenerateAIPlan() {
    this.setupState = { ...this.setupState, aiPlanGenerated: true };
  }

  private handleFinish() {
    // Save setup state and navigate to dashboard
    localStorage.setItem("farm_clawed_setup", JSON.stringify(this.setupState));
    this.dispatchEvent(new CustomEvent("setup-complete", { detail: this.setupState }));
  }

  private renderStep1() {
    return html`
      <div class="step-title">Choose Your Farm Type</div>
      <div class="step-description">
        Select the type that best describes your operation. This helps us configure
        the right templates and recommendations.
      </div>

      <div class="type-grid">
        <div
          class="type-card ${this.setupState.farmType === "garden" ? "selected" : ""}"
          @click=${() => this.handleFarmTypeSelect("garden")}
        >
          <div class="type-icon">🌱</div>
          <div class="type-name">Home Garden</div>
          <div class="type-desc">Containers, raised beds, small plots</div>
        </div>
        <div
          class="type-card ${this.setupState.farmType === "orchard" ? "selected" : ""}"
          @click=${() => this.handleFarmTypeSelect("orchard")}
        >
          <div class="type-icon">🍎</div>
          <div class="type-name">Orchard</div>
          <div class="type-desc">Fruit trees, berries, vines</div>
        </div>
        <div
          class="type-card ${this.setupState.farmType === "ranch" ? "selected" : ""}"
          @click=${() => this.handleFarmTypeSelect("ranch")}
        >
          <div class="type-icon">🐄</div>
          <div class="type-name">Ranch / Livestock</div>
          <div class="type-desc">Pastures, paddocks, animals</div>
        </div>
        <div
          class="type-card ${this.setupState.farmType === "row-crop" ? "selected" : ""}"
          @click=${() => this.handleFarmTypeSelect("row-crop")}
        >
          <div class="type-icon">🌾</div>
          <div class="type-name">Row Crop</div>
          <div class="type-desc">Vegetables, grains, commercial</div>
        </div>
      </div>
    `;
  }

  private renderStep2() {
    return html`
      <div class="step-title">Configure Your Preferences</div>
      <div class="step-description">
        Adjust these dials to match your farming philosophy and comfort with automation.
        You can change these anytime in Settings.
      </div>

      <div class="slider-section">
        <div class="slider-header">
          <span class="slider-label">Permaculture Depth</span>
          <span class="slider-value">Level ${this.setupState.permacultureDepth}</span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          .value=${String(this.setupState.permacultureDepth)}
          @input=${(e: Event) => {
            this.setupState = {
              ...this.setupState,
              permacultureDepth: parseInt((e.target as HTMLInputElement).value, 10),
            };
          }}
        />
        <div class="slider-description">
          ${this.getPermacultureDescription(this.setupState.permacultureDepth)}
        </div>
      </div>

      <div class="slider-section">
        <div class="slider-header">
          <span class="slider-label">Automation Level</span>
          <span class="slider-value">Level ${this.setupState.automationLevel}</span>
        </div>
        <input
          type="range"
          min="0"
          max="4"
          .value=${String(this.setupState.automationLevel)}
          @input=${(e: Event) => {
            this.setupState = {
              ...this.setupState,
              automationLevel: parseInt((e.target as HTMLInputElement).value, 10),
            };
          }}
        />
        <div class="slider-description">
          ${this.getAutomationDescription(this.setupState.automationLevel)}
        </div>
      </div>
    `;
  }

  private renderStep3() {
    return html`
      <div class="step-title">Connect Data Sources</div>
      <div class="step-description">
        Choose how you'll input farm data. You can start with manual entry and
        add integrations later.
      </div>

      <div class="source-list">
        <div
          class="source-option ${this.setupState.dataSource === "manual" ? "selected" : ""}"
          @click=${() => this.handleDataSourceSelect("manual")}
        >
          <span class="source-icon">📝</span>
          <div class="source-info">
            <div class="source-name">Manual / CSV Upload</div>
            <div class="source-desc">Enter data manually or import from spreadsheets</div>
          </div>
          <span class="source-badge">Works Day 1</span>
        </div>

        <div
          class="source-option ${this.setupState.dataSource === "home-assistant" ? "selected" : ""}"
          @click=${() => this.handleDataSourceSelect("home-assistant")}
        >
          <span class="source-icon">🏠</span>
          <div class="source-info">
            <div class="source-name">Home Assistant</div>
            <div class="source-desc">Connect sensors and automations via HA</div>
          </div>
        </div>

        <div
          class="source-option ${this.setupState.dataSource === "deere" ? "selected" : ""}"
          @click=${() => this.handleDataSourceSelect("deere")}
        >
          <span class="source-icon">🚜</span>
          <div class="source-info">
            <div class="source-name">John Deere Operations Center</div>
            <div class="source-desc">Import fields and operations via Deere API</div>
          </div>
        </div>

        <div
          class="source-option ${this.setupState.dataSource === "fieldview" ? "selected" : ""}"
          @click=${() => this.handleDataSourceSelect("fieldview")}
        >
          <span class="source-icon">🌍</span>
          <div class="source-info">
            <div class="source-name">Climate FieldView</div>
            <div class="source-desc">Sync field boundaries and data</div>
          </div>
        </div>
      </div>

      ${
        this.setupState.dataSource === "deere" || this.setupState.dataSource === "fieldview"
          ? html`
            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
              <p style="font-size: 0.85rem; color: var(--muted); margin: 0;">
                📋 You'll need to register an application at the
                ${
                  this.setupState.dataSource === "deere"
                    ? "John Deere Developer Portal"
                    : "Climate Developer Portal"
                }
                and configure OAuth credentials in your .env file. See the
                <a href="#" style="color: var(--accent);">setup guide</a> for details.
              </p>
            </div>
          `
          : nothing
      }
    `;
  }

  private renderStep4() {
    return html`
      <div class="step-title">Connect Actuators (IFTTT)</div>
      <div class="step-description">
        farm_clawed uses IFTTT Webhooks as a generic actuator layer. Connect IFTTT
        to control SmartLife devices, relays, or trigger any IFTTT action.
      </div>

      <div class="input-group">
        <label class="input-label">IFTTT Webhook Key</label>
        <input
          type="password"
          class="input-field"
          placeholder="Your IFTTT Maker Webhooks key"
          .value=${this.setupState.iftttKey}
          @input=${(e: Event) => {
            this.setupState = {
              ...this.setupState,
              iftttKey: (e.target as HTMLInputElement).value,
              iftttTested: false,
            };
          }}
        />
        <p class="input-hint">
          Get your key from
          <a href="https://ifttt.com/maker_webhooks" target="_blank">ifttt.com/maker_webhooks</a>
          → Documentation
        </p>
        ${
          this.setupState.iftttKey
            ? html`
              <button class="test-btn" @click=${this.handleTestIfttt}>
                🧪 Test Connection
              </button>
              ${
                this.setupState.iftttTested
                  ? html`
                      <p class="test-success">✓ Connection successful!</p>
                    `
                  : nothing
              }
            `
            : nothing
        }
      </div>

      <div style="margin-top: 1.5rem;">
        <div style="font-size: 0.9rem; font-weight: 500; color: var(--text); margin-bottom: 0.75rem;">
          ⚠️ Safety Acknowledgment
        </div>
        <div class="checklist">
          <label class="checklist-item">
            <input
              type="checkbox"
              .checked=${this.safetyChecked}
              @change=${(e: Event) => {
                this.safetyChecked = (e.target as HTMLInputElement).checked;
              }}
            />
            <span>
              I understand that automations require approval by default, and I will
              configure appropriate guardrails before enabling auto-execution.
            </span>
          </label>
        </div>
      </div>

      <div style="margin-top: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
        <p style="font-size: 0.85rem; color: var(--muted); margin: 0;">
          💡 <strong>Skip for now?</strong> You can run farm_clawed in observation
          mode without IFTTT. AI recommendations will still work - you just won't
          have automated actuation.
        </p>
      </div>
    `;
  }

  private renderStep5() {
    return html`
      <div class="step-title">Your First AI Plan</div>
      <div class="step-description">
        Let's generate your first AI-powered farm analysis. This will help you
        understand what farm_clawed can do for you.
      </div>

      ${
        !this.setupState.aiPlanGenerated
          ? html`
            <div style="text-align: center; padding: 2rem;">
              <p style="color: var(--muted); margin-bottom: 1.5rem;">
                Click below to generate a personalized Day 1 plan based on your setup.
              </p>
              <button class="btn btn-primary" @click=${this.handleGenerateAIPlan}>
                🌱 Generate My Day 1 Plan
              </button>
            </div>
          `
          : html`
            <div class="ai-plan">
              <div class="ai-plan-title">🌱 Your Day 1 Plan</div>
              <div class="ai-plan-content">
                <p>
                  <strong>Farm Type:</strong>
                  ${
                    this.setupState.farmType === "garden"
                      ? "Home Garden"
                      : this.setupState.farmType === "orchard"
                        ? "Orchard"
                        : this.setupState.farmType === "ranch"
                          ? "Ranch"
                          : "Row Crop"
                  }
                </p>
                <p>
                  <strong>Configuration:</strong> Permaculture Level
                  ${this.setupState.permacultureDepth}, Automation Level
                  ${this.setupState.automationLevel}
                </p>
                <p style="margin-top: 1rem;">
                  <strong>Recommended First Steps:</strong>
                </p>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                  <li>Add your first plant or area to the farm map</li>
                  <li>Log initial soil moisture and temperature readings</li>
                  <li>Set up a simple automation template (e.g., "Water when moisture &lt; 30%")</li>
                  <li>Review the AI's first recommendations in the Chat tab</li>
                </ul>
                <p style="margin-top: 1rem; color: var(--ok);">
                  ✓ You're all set! Head to the Dashboard to start chatting with farm_clawed.
                </p>
              </div>
            </div>
          `
      }
    `;
  }

  override render() {
    const steps = [
      { num: 1, label: "Farm Type" },
      { num: 2, label: "Settings" },
      { num: 3, label: "Data" },
      { num: 4, label: "Actuators" },
      { num: 5, label: "AI Plan" },
    ];

    return html`
      <div class="container">
        <h1>🌱 Welcome to farm_clawed</h1>
        <p class="subtitle">Let's set up your autonomous farming assistant</p>

        <div class="security-banner ${this.envValid ? "" : "warning"}">
          🔒 <strong>No Secrets Policy:</strong> Credentials are stored locally
          in your .env file, never in the codebase.
        </div>

        <div class="progress-steps">
          ${steps.map(
            (step) => html`
              <div
                class="step-indicator ${
                  step.num === this.currentStep
                    ? "active"
                    : step.num < this.currentStep
                      ? "completed"
                      : ""
                }"
              >
                <div class="step-circle">
                  ${step.num < this.currentStep ? "✓" : step.num}
                </div>
                <div class="step-label">${step.label}</div>
              </div>
            `,
          )}
        </div>

        <div class="step-content">
          ${
            this.currentStep === 1
              ? this.renderStep1()
              : this.currentStep === 2
                ? this.renderStep2()
                : this.currentStep === 3
                  ? this.renderStep3()
                  : this.currentStep === 4
                    ? this.renderStep4()
                    : this.renderStep5()
          }
        </div>

        <div class="nav-buttons">
          ${
            this.currentStep > 1
              ? html`
                <button class="btn btn-secondary" @click=${this.handleBack}>
                  ← Back
                </button>
              `
              : html`
                  <div></div>
                `
          }

          ${
            this.currentStep < 5
              ? html`
                <button
                  class="btn btn-primary"
                  ?disabled=${!this.canProceed()}
                  @click=${this.handleNext}
                >
                  Continue →
                </button>
              `
              : html`
                <button
                  class="btn btn-primary"
                  ?disabled=${!this.setupState.aiPlanGenerated}
                  @click=${this.handleFinish}
                >
                  🎉 Go to Dashboard
                </button>
              `
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-setup-view": FarmSetupView;
  }
}
