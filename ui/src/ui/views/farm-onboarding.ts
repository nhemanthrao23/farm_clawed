/**
 * Farm Onboarding - Multi-Path Setup Wizard
 *
 * Smooth onboarding experience with three distinct paths:
 * - John Deere Operations Center (OAuth2 integration)
 * - Climate FieldView (OAuth2 integration)
 * - Manual/Fresh start (CSV import or manual setup)
 *
 * Features animated transitions, progressive disclosure, and
 * clear guidance for each integration path.
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";

type OnboardingPath = "deere" | "fieldview" | "manual" | null;
type OnboardingStep =
  | "welcome"
  | "path-select"
  | "oauth-connect"
  | "org-select"
  | "field-import"
  | "farm-type"
  | "draw-fields"
  | "configure"
  | "complete";

// Mock data structures for FMIS imports
interface FMISOrganization {
  id: string;
  name: string;
  fieldCount: number;
  area: number;
  areaUnit: string;
}

interface FMISField {
  id: string;
  name: string;
  area: number;
  areaUnit: string;
  cropType?: string;
  selected: boolean;
}

@customElement("farm-onboarding-view")
export class FarmOnboardingView extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg, #0d0f14);
      font-family: var(--font-body, "Space Grotesk", system-ui, sans-serif);
      overflow-y: auto;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      width: 100%;
    }

    /* Animated Background */
    .bg-pattern {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(ellipse at 20% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }

    .content {
      position: relative;
      z-index: 1;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .logo-icon {
      font-size: 2.5rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .logo-text {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #22c55e 0%, #a3e635 50%, #22c55e 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .tagline {
      font-size: 1.1rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.5rem;
    }

    /* Progress Indicator */
    .progress {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin: 2rem 0;
    }

    .progress-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--border, #232830);
      transition: all 0.3s ease;
    }

    .progress-dot.active {
      background: var(--accent, #22c55e);
      box-shadow: 0 0 12px var(--accent, #22c55e);
    }

    .progress-dot.completed {
      background: var(--ok, #22c55e);
    }

    /* Path Selection Cards */
    .path-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin: 2rem 0;
    }

    @media (max-width: 768px) {
      .path-grid {
        grid-template-columns: 1fr;
      }
    }

    .path-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1.5rem;
      background: var(--card, #151821);
      border: 2px solid var(--border, #232830);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.25s ease;
      text-align: center;
    }

    .path-card:hover {
      transform: translateY(-4px);
      border-color: var(--border-hover, #404040);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    }

    .path-card.selected {
      border-color: var(--accent, #22c55e);
      background: var(--accent-subtle, rgba(34, 197, 94, 0.08));
    }

    .path-icon {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      margin-bottom: 1.25rem;
      transition: transform 0.25s ease;
    }

    .path-card:hover .path-icon {
      transform: scale(1.1);
    }

    .path-icon.deere {
      background: linear-gradient(135deg, #367c2b 0%, #ffde00 100%);
    }

    .path-icon.fieldview {
      background: linear-gradient(135deg, #00a3e0 0%, #43b02a 100%);
    }

    .path-icon.manual {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    }

    .path-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
      margin-bottom: 0.5rem;
    }

    .path-desc {
      font-size: 0.85rem;
      color: var(--muted, #71717a);
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .path-features {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text, #e4e4e7);
    }

    .path-feature {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .path-feature-icon {
      color: var(--ok, #22c55e);
    }

    /* OAuth Connect Step */
    .oauth-card {
      max-width: 500px;
      margin: 0 auto;
      padding: 2.5rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 16px;
      text-align: center;
    }

    .oauth-icon {
      width: 100px;
      height: 100px;
      margin: 0 auto 1.5rem;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
    }

    .oauth-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
      margin-bottom: 0.75rem;
    }

    .oauth-desc {
      font-size: 0.95rem;
      color: var(--muted, #71717a);
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .oauth-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .oauth-btn.deere {
      background: linear-gradient(135deg, #367c2b 0%, #4a9c3c 100%);
      color: white;
    }

    .oauth-btn.fieldview {
      background: linear-gradient(135deg, #00a3e0 0%, #43b02a 100%);
      color: white;
    }

    .oauth-btn:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .oauth-note {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-top: 1.5rem;
    }

    /* Organization/Farm Selection */
    .select-card {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 16px;
    }

    .select-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .org-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .org-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--bg-elevated, #1a1e27);
      border: 2px solid var(--border, #232830);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .org-item:hover {
      border-color: var(--border-hover, #404040);
      background: var(--bg-hover, #1f242f);
    }

    .org-item.selected {
      border-color: var(--accent, #22c55e);
      background: var(--accent-subtle, rgba(34, 197, 94, 0.08));
    }

    .org-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .org-info {
      flex: 1;
    }

    .org-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
    }

    .org-meta {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      display: flex;
      gap: 1rem;
      margin-top: 0.25rem;
    }

    .org-check {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid var(--border, #232830);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: transparent;
      transition: all 0.2s ease;
    }

    .org-item.selected .org-check {
      border-color: var(--ok, #22c55e);
      background: var(--ok, #22c55e);
      color: white;
    }

    /* Field Import Preview */
    .import-preview {
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 16px;
    }

    .import-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .import-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
    }

    .import-actions {
      display: flex;
      gap: 0.5rem;
    }

    .import-action {
      padding: 0.5rem 0.75rem;
      background: var(--bg-elevated, #1a1e27);
      border: 1px solid var(--border, #232830);
      border-radius: 6px;
      color: var(--text, #e4e4e7);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .import-action:hover {
      background: var(--bg-hover, #1f242f);
    }

    .field-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .field-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: var(--bg-elevated, #1a1e27);
      border: 1px solid var(--border, #232830);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .field-item:hover {
      background: var(--bg-hover, #1f242f);
    }

    .field-checkbox {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 2px solid var(--border, #232830);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      color: transparent;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .field-item.selected .field-checkbox {
      border-color: var(--ok, #22c55e);
      background: var(--ok, #22c55e);
      color: white;
    }

    .field-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .field-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }

    .field-meta {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
    }

    .import-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: var(--bg-elevated, #1a1e27);
      border-radius: 10px;
      margin-top: 1.5rem;
    }

    .summary-text {
      font-size: 0.9rem;
      color: var(--text, #e4e4e7);
    }

    .summary-count {
      font-weight: 600;
      color: var(--accent, #22c55e);
    }

    /* Farm Type Selection (Manual Path) */
    .farm-type-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin: 1.5rem 0;
    }

    @media (max-width: 640px) {
      .farm-type-grid {
        grid-template-columns: 1fr;
      }
    }

    .farm-type-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
      background: var(--bg-elevated, #1a1e27);
      border: 2px solid var(--border, #232830);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }

    .farm-type-card:hover {
      border-color: var(--border-hover, #404040);
    }

    .farm-type-card.selected {
      border-color: var(--accent, #22c55e);
      background: var(--accent-subtle, rgba(34, 197, 94, 0.08));
    }

    .farm-type-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
    }

    .farm-type-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
    }

    .farm-type-desc {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
    }

    /* Configuration Step */
    .config-card {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 16px;
    }

    .config-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .config-subtitle {
      font-size: 0.9rem;
      color: var(--muted, #71717a);
      text-align: center;
      margin-bottom: 2rem;
    }

    .config-section {
      margin-bottom: 2rem;
    }

    .config-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
      margin-bottom: 0.75rem;
    }

    .config-value {
      font-size: 0.85rem;
      color: var(--accent, #22c55e);
      font-weight: 600;
    }

    .config-slider {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: var(--bg-elevated, #1a1e27);
      -webkit-appearance: none;
      appearance: none;
      cursor: pointer;
    }

    .config-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--accent, #22c55e);
      cursor: pointer;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .config-desc {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: var(--bg-elevated, #1a1e27);
      border-radius: 8px;
      line-height: 1.5;
    }

    /* Skip IFTTT */
    .skip-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--bg-elevated, #1a1e27);
      border-radius: 10px;
      margin-top: 1rem;
    }

    .skip-info {
      font-size: 0.85rem;
      color: var(--muted, #71717a);
    }

    .skip-toggle {
      padding: 0.5rem 1rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 6px;
      color: var(--text, #e4e4e7);
      font-size: 0.8rem;
      cursor: pointer;
    }

    .skip-toggle:hover {
      background: var(--bg-hover, #1f242f);
    }

    /* Completion Step */
    .complete-card {
      max-width: 600px;
      margin: 0 auto;
      padding: 3rem 2rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 16px;
      text-align: center;
    }

    .complete-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      animation: celebrate 0.6s ease-out;
    }

    @keyframes celebrate {
      0% { transform: scale(0.5); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }

    .complete-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-strong, #f4f4f5);
      margin-bottom: 0.75rem;
    }

    .complete-desc {
      font-size: 1rem;
      color: var(--muted, #71717a);
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .complete-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      padding: 1rem;
      background: var(--bg-elevated, #1a1e27);
      border-radius: 10px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent, #22c55e);
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
    }

    /* Navigation Buttons */
    .nav-buttons {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.875rem 1.75rem;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border, #232830);
      color: var(--muted, #71717a);
    }

    .btn-secondary:hover {
      border-color: var(--text, #e4e4e7);
      color: var(--text, #e4e4e7);
    }

    .btn-primary {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      flex: 1;
      max-width: 280px;
    }

    .btn-primary:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Sync Progress */
    .sync-progress {
      max-width: 500px;
      margin: 2rem auto;
      padding: 2rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 16px;
      text-align: center;
    }

    .sync-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid var(--border, #232830);
      border-top-color: var(--accent, #22c55e);
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sync-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
      margin-bottom: 0.5rem;
    }

    .sync-status {
      font-size: 0.9rem;
      color: var(--muted, #71717a);
    }

    .sync-bar {
      height: 4px;
      background: var(--bg-elevated, #1a1e27);
      border-radius: 2px;
      margin-top: 1.5rem;
      overflow: hidden;
    }

    .sync-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e 0%, #a3e635 100%);
      border-radius: 2px;
      transition: width 0.3s ease;
    }
  `;

  @state()
  private currentStep: OnboardingStep = "welcome";

  @state()
  private selectedPath: OnboardingPath = null;

  @state()
  private isConnecting = false;

  @state()
  private isImporting = false;

  @state()
  private syncProgress = 0;

  @state()
  private organizations: FMISOrganization[] = [];

  @state()
  private selectedOrgId: string | null = null;

  @state()
  private fields: FMISField[] = [];

  @state()
  private selectedFarmType: string | null = null;

  @state()
  private permacultureDepth = 1;

  @state()
  private automationLevel = 2;

  @state()
  private skipIfttt = false;

  private getStepIndex(): number {
    const steps: OnboardingStep[] = [
      "welcome",
      "path-select",
      "oauth-connect",
      "org-select",
      "field-import",
      "configure",
      "complete",
    ];
    return steps.indexOf(this.currentStep);
  }

  private getPermacultureDescription(level: number): string {
    const descriptions: Record<number, string> = {
      0: "Standard farm ops - fields, blocks, and irrigation zones only",
      1: "Regen-friendly - soil health focus, water conservation, basic IPM",
      2: "Permaculture-lite - optional zones/sectors, guild guidance available",
      3: "Full permaculture - zones 0-5, sectors, guilds, succession planning",
    };
    return descriptions[level] || "";
  }

  private getAutomationDescription(level: number): string {
    const descriptions: Record<number, string> = {
      0: "Observe only - dashboards and logs, no automated actions",
      1: "Assist - AI recommendations and checklists for manual execution",
      2: "Propose + Approve - human-in-loop approvals required (recommended)",
      3: "Auto-within-guardrails - automatic execution with safety limits",
      4: "Full Ops - hardware integration with Jidoka safety protocols",
    };
    return descriptions[level] || "";
  }

  private handlePathSelect(path: OnboardingPath) {
    this.selectedPath = path;
    if (path === "manual") {
      this.currentStep = "farm-type";
    } else {
      this.currentStep = "oauth-connect";
    }
  }

  private async handleOAuthConnect() {
    this.isConnecting = true;

    // Simulate OAuth connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock organizations data
    if (this.selectedPath === "deere") {
      this.organizations = [
        { id: "org-1", name: "Green Valley Farm", fieldCount: 12, area: 1240, areaUnit: "acres" },
        { id: "org-2", name: "Sunrise Ranch", fieldCount: 8, area: 820, areaUnit: "acres" },
      ];
    } else {
      this.organizations = [
        { id: "org-1", name: "Northern Fields", fieldCount: 15, area: 2100, areaUnit: "acres" },
        { id: "org-2", name: "Valley Operations", fieldCount: 6, area: 450, areaUnit: "acres" },
      ];
    }

    this.isConnecting = false;
    this.currentStep = "org-select";
  }

  private handleOrgSelect(orgId: string) {
    this.selectedOrgId = orgId;
  }

  private async handleImportFields() {
    this.isImporting = true;
    this.syncProgress = 0;

    // Simulate sync progress
    const progressInterval = setInterval(() => {
      this.syncProgress += 10;
      if (this.syncProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 300);

    await new Promise((resolve) => setTimeout(resolve, 3500));

    // Mock fields data
    this.fields = [
      { id: "f1", name: "North Field", area: 240, areaUnit: "acres", cropType: "Corn", selected: true },
      { id: "f2", name: "South Pasture", area: 180, areaUnit: "acres", cropType: "Soybeans", selected: true },
      { id: "f3", name: "West Block", area: 320, areaUnit: "acres", cropType: "Wheat", selected: true },
      { id: "f4", name: "East Orchard", area: 85, areaUnit: "acres", cropType: "Apples", selected: true },
      { id: "f5", name: "River Bottom", area: 150, areaUnit: "acres", cropType: "Corn", selected: true },
      { id: "f6", name: "Hilltop", area: 95, areaUnit: "acres", cropType: "Hay", selected: false },
    ];

    this.isImporting = false;
    this.currentStep = "field-import";
  }

  private toggleFieldSelection(fieldId: string) {
    this.fields = this.fields.map((f) =>
      f.id === fieldId ? { ...f, selected: !f.selected } : f,
    );
  }

  private selectAllFields() {
    this.fields = this.fields.map((f) => ({ ...f, selected: true }));
  }

  private deselectAllFields() {
    this.fields = this.fields.map((f) => ({ ...f, selected: false }));
  }

  private get selectedFieldCount(): number {
    return this.fields.filter((f) => f.selected).length;
  }

  private get totalArea(): number {
    return this.fields.filter((f) => f.selected).reduce((sum, f) => sum + f.area, 0);
  }

  private handleFarmTypeSelect(type: string) {
    this.selectedFarmType = type;
  }

  private handleComplete() {
    // Save setup and navigate to command center
    const setupData = {
      path: this.selectedPath,
      organizationId: this.selectedOrgId,
      fields: this.fields.filter((f) => f.selected),
      farmType: this.selectedFarmType,
      permacultureDepth: this.permacultureDepth,
      automationLevel: this.automationLevel,
      skipIfttt: this.skipIfttt,
      completedAt: new Date().toISOString(),
    };

    localStorage.setItem("farm_clawed_onboarding", JSON.stringify(setupData));

    this.dispatchEvent(
      new CustomEvent("onboarding-complete", {
        detail: setupData,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private renderWelcome() {
    return html`
      <div class="header">
        <div class="logo">
          <span class="logo-icon">🌱</span>
          <span class="logo-text">farm_clawed</span>
        </div>
        <p class="tagline">AI-Powered Autonomous Farm Operations</p>
      </div>

      <div class="path-grid">
        <div
          class="path-card ${this.selectedPath === "deere" ? "selected" : ""}"
          @click=${() => this.handlePathSelect("deere")}
        >
          <div class="path-icon deere">🚜</div>
          <div class="path-name">John Deere</div>
          <div class="path-desc">
            Import fields, operations, and equipment from Operations Center
          </div>
          <div class="path-features">
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              Field boundaries & data
            </div>
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              Work plans & operations
            </div>
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              Equipment status
            </div>
          </div>
        </div>

        <div
          class="path-card ${this.selectedPath === "fieldview" ? "selected" : ""}"
          @click=${() => this.handlePathSelect("fieldview")}
        >
          <div class="path-icon fieldview">🌍</div>
          <div class="path-name">Climate FieldView</div>
          <div class="path-desc">
            Sync field boundaries, prescriptions, and historical data
          </div>
          <div class="path-features">
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              Field boundaries
            </div>
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              Prescriptions
            </div>
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              Historical imagery
            </div>
          </div>
        </div>

        <div
          class="path-card ${this.selectedPath === "manual" ? "selected" : ""}"
          @click=${() => this.handlePathSelect("manual")}
        >
          <div class="path-icon manual">✨</div>
          <div class="path-name">Start Fresh</div>
          <div class="path-desc">
            Set up manually with CSV imports or draw your own fields
          </div>
          <div class="path-features">
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              CSV/GeoJSON import
            </div>
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              Draw on map
            </div>
            <div class="path-feature">
              <span class="path-feature-icon">✓</span>
              Works day 1
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderOAuthConnect() {
    const isDeere = this.selectedPath === "deere";
    const title = isDeere ? "John Deere Operations Center" : "Climate FieldView";
    const icon = isDeere ? "🚜" : "🌍";

    return html`
      <div class="oauth-card">
        <div class="oauth-icon ${this.selectedPath}" style="background: ${isDeere ? "linear-gradient(135deg, #367c2b 0%, #ffde00 100%)" : "linear-gradient(135deg, #00a3e0 0%, #43b02a 100%)"}">
          ${icon}
        </div>
        <h2 class="oauth-title">Connect to ${title}</h2>
        <p class="oauth-desc">
          ${isDeere
            ? "Sign in with your John Deere account to import your fields, operations, and equipment data."
            : "Sign in with your Climate FieldView account to sync your field boundaries and prescriptions."}
        </p>
        <button
          class="oauth-btn ${this.selectedPath}"
          @click=${this.handleOAuthConnect}
          ?disabled=${this.isConnecting}
        >
          ${this.isConnecting
            ? "Connecting..."
            : `Connect with ${isDeere ? "John Deere" : "FieldView"}`}
        </button>
        <p class="oauth-note">
          🔒 Your credentials are never stored in farm_clawed. OAuth tokens are kept locally.
        </p>
      </div>
    `;
  }

  private renderOrgSelect() {
    const title = this.selectedPath === "deere" ? "Organization" : "Farm";

    return html`
      <div class="select-card">
        <h2 class="select-title">Select ${title}</h2>
        <div class="org-list">
          ${this.organizations.map(
            (org) => html`
              <div
                class="org-item ${this.selectedOrgId === org.id ? "selected" : ""}"
                @click=${() => this.handleOrgSelect(org.id)}
              >
                <div class="org-icon ${this.selectedPath}" style="background: ${this.selectedPath === "deere" ? "linear-gradient(135deg, #367c2b 0%, #4a9c3c 100%)" : "linear-gradient(135deg, #00a3e0 0%, #43b02a 100%)"}">
                  ${this.selectedPath === "deere" ? "🚜" : "🌍"}
                </div>
                <div class="org-info">
                  <div class="org-name">${org.name}</div>
                  <div class="org-meta">
                    <span>${org.fieldCount} fields</span>
                    <span>${org.area.toLocaleString()} ${org.areaUnit}</span>
                  </div>
                </div>
                <div class="org-check">${this.selectedOrgId === org.id ? "✓" : ""}</div>
              </div>
            `,
          )}
        </div>

        <div class="nav-buttons">
          <button class="btn btn-secondary" @click=${() => (this.currentStep = "oauth-connect")}>
            ← Back
          </button>
          <button
            class="btn btn-primary"
            ?disabled=${!this.selectedOrgId || this.isImporting}
            @click=${this.handleImportFields}
          >
            ${this.isImporting ? "Syncing..." : "Import Fields →"}
          </button>
        </div>
      </div>

      ${this.isImporting
        ? html`
            <div class="sync-progress">
              <div class="sync-spinner"></div>
              <h3 class="sync-title">Syncing Your Farm Data</h3>
              <p class="sync-status">Importing fields, boundaries, and operations...</p>
              <div class="sync-bar">
                <div class="sync-bar-fill" style="width: ${this.syncProgress}%"></div>
              </div>
            </div>
          `
        : nothing}
    `;
  }

  private renderFieldImport() {
    return html`
      <div class="import-preview">
        <div class="import-header">
          <h2 class="import-title">Select Fields to Import</h2>
          <div class="import-actions">
            <button class="import-action" @click=${this.selectAllFields}>Select All</button>
            <button class="import-action" @click=${this.deselectAllFields}>Clear</button>
          </div>
        </div>

        <div class="field-list">
          ${this.fields.map(
            (field) => html`
              <div
                class="field-item ${field.selected ? "selected" : ""}"
                @click=${() => this.toggleFieldSelection(field.id)}
              >
                <div class="field-checkbox">${field.selected ? "✓" : ""}</div>
                <div class="field-info">
                  <span class="field-name">${field.name}</span>
                  <span class="field-meta">${field.area} ${field.areaUnit} • ${field.cropType || "—"}</span>
                </div>
              </div>
            `,
          )}
        </div>

        <div class="import-summary">
          <span class="summary-text">
            <span class="summary-count">${this.selectedFieldCount}</span> fields selected
          </span>
          <span class="summary-text">
            Total: <span class="summary-count">${this.totalArea.toLocaleString()}</span> acres
          </span>
        </div>

        <div class="nav-buttons">
          <button class="btn btn-secondary" @click=${() => (this.currentStep = "org-select")}>
            ← Back
          </button>
          <button
            class="btn btn-primary"
            ?disabled=${this.selectedFieldCount === 0}
            @click=${() => (this.currentStep = "configure")}
          >
            Continue →
          </button>
        </div>
      </div>
    `;
  }

  private renderFarmType() {
    const farmTypes = [
      { id: "garden", icon: "🌱", name: "Home Garden", desc: "Containers, raised beds, small plots" },
      { id: "orchard", icon: "🍎", name: "Orchard", desc: "Fruit trees, berries, vines" },
      { id: "ranch", icon: "🐄", name: "Ranch / Livestock", desc: "Pastures, paddocks, animals" },
      { id: "row-crop", icon: "🌾", name: "Row Crop", desc: "Vegetables, grains, commercial" },
    ];

    return html`
      <div class="select-card">
        <h2 class="select-title">What type of farm are you managing?</h2>
        <div class="farm-type-grid">
          ${farmTypes.map(
            (type) => html`
              <div
                class="farm-type-card ${this.selectedFarmType === type.id ? "selected" : ""}"
                @click=${() => this.handleFarmTypeSelect(type.id)}
              >
                <span class="farm-type-icon">${type.icon}</span>
                <span class="farm-type-name">${type.name}</span>
                <span class="farm-type-desc">${type.desc}</span>
              </div>
            `,
          )}
        </div>

        <div class="nav-buttons">
          <button class="btn btn-secondary" @click=${() => (this.currentStep = "welcome")}>
            ← Back
          </button>
          <button
            class="btn btn-primary"
            ?disabled=${!this.selectedFarmType}
            @click=${() => (this.currentStep = "configure")}
          >
            Continue →
          </button>
        </div>
      </div>
    `;
  }

  private renderConfigure() {
    return html`
      <div class="config-card">
        <h2 class="config-title">Configure Your AI Assistant</h2>
        <p class="config-subtitle">
          Adjust these settings to match your farming philosophy. You can change them anytime.
        </p>

        <div class="config-section">
          <div class="config-label">
            <span>Permaculture Depth</span>
            <span class="config-value">Level ${this.permacultureDepth}</span>
          </div>
          <input
            type="range"
            class="config-slider"
            min="0"
            max="3"
            .value=${String(this.permacultureDepth)}
            @input=${(e: Event) => {
              this.permacultureDepth = parseInt((e.target as HTMLInputElement).value, 10);
            }}
          />
          <div class="config-desc">
            ${this.getPermacultureDescription(this.permacultureDepth)}
          </div>
        </div>

        <div class="config-section">
          <div class="config-label">
            <span>Automation Level</span>
            <span class="config-value">Level ${this.automationLevel}</span>
          </div>
          <input
            type="range"
            class="config-slider"
            min="0"
            max="4"
            .value=${String(this.automationLevel)}
            @input=${(e: Event) => {
              this.automationLevel = parseInt((e.target as HTMLInputElement).value, 10);
            }}
          />
          <div class="config-desc">
            ${this.getAutomationDescription(this.automationLevel)}
          </div>
        </div>

        <div class="skip-section">
          <span class="skip-info">
            💡 You can set up IFTTT automations later from Settings
          </span>
          <button class="skip-toggle" @click=${() => (this.skipIfttt = !this.skipIfttt)}>
            ${this.skipIfttt ? "Set up now" : "Skip for now"}
          </button>
        </div>

        <div class="nav-buttons">
          <button
            class="btn btn-secondary"
            @click=${() => {
              if (this.selectedPath === "manual") {
                this.currentStep = "farm-type";
              } else {
                this.currentStep = "field-import";
              }
            }}
          >
            ← Back
          </button>
          <button class="btn btn-primary" @click=${() => (this.currentStep = "complete")}>
            Complete Setup →
          </button>
        </div>
      </div>
    `;
  }

  private renderComplete() {
    const source = this.selectedPath === "deere"
      ? "John Deere"
      : this.selectedPath === "fieldview"
        ? "Climate FieldView"
        : "Manual Setup";

    return html`
      <div class="complete-card">
        <div class="complete-icon">🎉</div>
        <h2 class="complete-title">You're All Set!</h2>
        <p class="complete-desc">
          farm_clawed is ready to help you manage your farm with AI-powered insights
          and automation. Let's get started!
        </p>

        <div class="complete-stats">
          <div class="stat-card">
            <div class="stat-value">${this.selectedPath === "manual" ? 1 : this.selectedFieldCount}</div>
            <div class="stat-label">Fields</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">L${this.permacultureDepth}</div>
            <div class="stat-label">Permaculture</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">L${this.automationLevel}</div>
            <div class="stat-label">Automation</div>
          </div>
        </div>

        <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 1.5rem;">
          Connected via: <strong style="color: var(--text)">${source}</strong>
        </p>

        <button class="btn btn-primary" style="max-width: 100%" @click=${this.handleComplete}>
          🚀 Launch Command Center
        </button>
      </div>
    `;
  }

  private renderProgress() {
    const totalSteps = this.selectedPath === "manual" ? 4 : 5;
    const stepIndex = this.getStepIndex();

    return html`
      <div class="progress">
        ${Array.from({ length: totalSteps }, (_, i) => {
          let className = "progress-dot";
          if (i < stepIndex) className += " completed";
          if (i === stepIndex) className += " active";
          return html`<div class="${className}"></div>`;
        })}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="bg-pattern"></div>
      <div class="container">
        <div class="content">
          ${this.currentStep !== "welcome" ? this.renderProgress() : nothing}

          ${this.currentStep === "welcome" || this.currentStep === "path-select"
            ? this.renderWelcome()
            : nothing}

          ${this.currentStep === "oauth-connect" ? this.renderOAuthConnect() : nothing}

          ${this.currentStep === "org-select" ? this.renderOrgSelect() : nothing}

          ${this.currentStep === "field-import" ? this.renderFieldImport() : nothing}

          ${this.currentStep === "farm-type" ? this.renderFarmType() : nothing}

          ${this.currentStep === "configure" ? this.renderConfigure() : nothing}

          ${this.currentStep === "complete" ? this.renderComplete() : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-onboarding-view": FarmOnboardingView;
  }
}

