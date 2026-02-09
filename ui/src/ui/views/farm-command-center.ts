/**
 * Farm Command Center - Split-View Interface
 *
 * Professional-grade command center combining map-centric workflows (JD/FV style)
 * with an AI copilot. Features a resizable split-view layout with:
 * - Left pane: Interactive map with field boundaries, layers, and overlays
 * - Right pane: AI assistant with context-aware recommendations and chat
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { FarmMapContext, FarmAsset, MapLayer, FarmZone } from "./farm-map.js";
import "./farm-map.js";
import "./farm-ai-panel.js";

// Field data structure (from JD/FV integration)
export interface FarmField {
  id: string;
  name: string;
  area: number; // acres
  areaUnit: string;
  cropType?: string;
  status: "healthy" | "warning" | "critical" | "inactive";
  lastOperation?: string;
  lastOperationDate?: string;
  boundaries?: Array<[number, number]>; // [lat, lng] polygon
  center?: [number, number];
  source?: "deere" | "fieldview" | "manual" | "csv";
}

// Organization/Farm structure (from FMIS)
export interface FarmOrganization {
  id: string;
  name: string;
  source: "deere" | "fieldview" | "manual";
  fields: FarmField[];
  syncedAt?: string;
}

@customElement("farm-command-center")
export class FarmCommandCenter extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg, #0d0f14);
      font-family: var(--font-body, "Space Grotesk", system-ui, sans-serif);
      overflow: hidden;
    }

    /* Top Bar - JD/FV style */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      background: var(--card, #151821);
      border-bottom: 1px solid var(--border, #232830);
      flex-shrink: 0;
      gap: 1rem;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .org-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-elevated, #1a1e27);
      border: 1px solid var(--border, #232830);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .org-selector:hover {
      border-color: var(--accent, #3b82f6);
      background: var(--bg-hover, #1f242f);
    }

    .org-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(135deg, #367c2b 0%, #ffde00 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .org-icon.fieldview {
      background: linear-gradient(135deg, #00a3e0 0%, #43b02a 100%);
    }

    .org-icon.manual {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    }

    .org-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .org-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
    }

    .org-source {
      font-size: 0.65rem;
      color: var(--muted, #71717a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .org-chevron {
      color: var(--muted, #71717a);
      font-size: 0.75rem;
      margin-left: 0.5rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand-icon {
      font-size: 1.25rem;
    }

    .brand-name {
      font-size: 1rem;
      font-weight: 700;
      background: linear-gradient(135deg, #22c55e 0%, #a3e635 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .topbar-center {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .year-selector {
      padding: 0.375rem 0.75rem;
      background: var(--bg-elevated, #1a1e27);
      border: 1px solid var(--border, #232830);
      border-radius: 6px;
      color: var(--text, #e4e4e7);
      font-size: 0.8rem;
      cursor: pointer;
    }

    .year-selector:hover {
      border-color: var(--accent, #3b82f6);
    }

    .sync-status {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      background: var(--ok-subtle, rgba(34, 197, 94, 0.1));
      border: 1px solid var(--ok, #22c55e);
      border-radius: 9999px;
      font-size: 0.7rem;
      color: var(--ok, #22c55e);
    }

    .sync-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ok, #22c55e);
      box-shadow: 0 0 8px var(--ok, #22c55e);
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .topbar-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: transparent;
      border: 1px solid var(--border, #232830);
      border-radius: 8px;
      color: var(--muted, #71717a);
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 1rem;
    }

    .topbar-btn:hover {
      background: var(--bg-hover, #1f242f);
      border-color: var(--border-hover, #404040);
      color: var(--text, #e4e4e7);
    }

    /* Split View Container */
    .split-container {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    /* Map Pane */
    .map-pane {
      flex: 0 0 60%;
      display: flex;
      flex-direction: column;
      position: relative;
      border-right: 1px solid var(--border, #232830);
      overflow: hidden;
    }

    .map-pane.expanded {
      flex: 0 0 100%;
    }

    .map-container {
      flex: 1;
      position: relative;
    }

    /* Map Controls Overlay */
    .map-controls {
      position: absolute;
      top: 1rem;
      left: 1rem;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .layer-toggle {
      display: flex;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .layer-btn {
      padding: 0.5rem 0.75rem;
      background: transparent;
      border: none;
      color: var(--muted, #71717a);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .layer-btn:not(:last-child) {
      border-right: 1px solid var(--border, #232830);
    }

    .layer-btn:hover {
      background: var(--bg-hover, #1f242f);
      color: var(--text, #e4e4e7);
    }

    .layer-btn.active {
      background: var(--accent-subtle, rgba(59, 130, 246, 0.15));
      color: var(--accent, #3b82f6);
    }

    /* Field List Panel (collapsible) */
    .field-panel {
      position: absolute;
      top: 1rem;
      right: 1rem;
      bottom: 1rem;
      width: 280px;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transition: transform 0.2s ease;
    }

    .field-panel.collapsed {
      transform: translateX(calc(100% + 1rem));
    }

    .field-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border, #232830);
    }

    .field-panel-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
    }

    .field-panel-toggle {
      background: transparent;
      border: none;
      color: var(--muted, #71717a);
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
    }

    .field-panel-toggle:hover {
      color: var(--text, #e4e4e7);
    }

    .field-search {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border, #232830);
    }

    .field-search input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--bg-elevated, #1a1e27);
      border: 1px solid var(--border, #232830);
      border-radius: 6px;
      color: var(--text, #e4e4e7);
      font-size: 0.8rem;
    }

    .field-search input::placeholder {
      color: var(--muted, #71717a);
    }

    .field-search input:focus {
      outline: none;
      border-color: var(--accent, #3b82f6);
    }

    .field-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .field-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .field-item:hover {
      background: var(--bg-hover, #1f242f);
    }

    .field-item.selected {
      background: var(--accent-subtle, rgba(59, 130, 246, 0.15));
      border: 1px solid var(--accent, #3b82f6);
    }

    .field-status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .field-status-dot.healthy {
      background: var(--ok, #22c55e);
      box-shadow: 0 0 6px var(--ok, #22c55e);
    }

    .field-status-dot.warning {
      background: var(--warn, #f59e0b);
      box-shadow: 0 0 6px var(--warn, #f59e0b);
    }

    .field-status-dot.critical {
      background: var(--danger, #ef4444);
      box-shadow: 0 0 6px var(--danger, #ef4444);
    }

    .field-status-dot.inactive {
      background: var(--muted, #71717a);
    }

    .field-info {
      flex: 1;
      min-width: 0;
    }

    .field-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .field-meta {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      display: flex;
      gap: 0.5rem;
    }

    /* Legend Panel */
    .legend-panel {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .legend-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--muted, #71717a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .legend-items {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text, #e4e4e7);
    }

    .legend-color {
      width: 14px;
      height: 14px;
      border-radius: 3px;
    }

    /* Resize Handle */
    .resize-handle {
      position: absolute;
      top: 0;
      right: -4px;
      bottom: 0;
      width: 8px;
      cursor: col-resize;
      z-index: 1001;
      background: transparent;
      transition: background 0.15s ease;
    }

    .resize-handle:hover,
    .resize-handle.dragging {
      background: var(--accent, #3b82f6);
    }

    /* AI Pane */
    .ai-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 320px;
      overflow: hidden;
    }

    .ai-pane.collapsed {
      display: none;
    }

    /* Expand AI Button */
    .expand-ai-btn {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-right: none;
      border-radius: 8px 0 0 8px;
      padding: 0.75rem 0.375rem;
      color: var(--muted, #71717a);
      cursor: pointer;
      z-index: 1001;
      transition: all 0.15s ease;
    }

    .expand-ai-btn:hover {
      background: var(--bg-hover, #1f242f);
      color: var(--text, #e4e4e7);
    }

    /* Mobile responsive */
    @media (max-width: 1024px) {
      .split-container {
        flex-direction: column;
      }

      .map-pane {
        flex: 0 0 50%;
        border-right: none;
        border-bottom: 1px solid var(--border, #232830);
      }

      .ai-pane {
        flex: 1;
        min-width: 100%;
      }

      .field-panel {
        width: 220px;
      }

      .resize-handle {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .topbar {
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .topbar-center {
        order: 3;
        width: 100%;
        justify-content: center;
      }

      .field-panel {
        width: calc(100% - 2rem);
        right: 0;
        left: 0;
        margin: 0 auto;
        max-height: 40%;
      }
    }
  `;

  @property({ type: Object })
  organization: FarmOrganization | null = null;

  @property({ type: Array })
  organizations: FarmOrganization[] = [];

  @property({ type: String })
  selectedYear = new Date().getFullYear().toString();

  @state()
  private mapLayer: MapLayer = "satellite";

  @state()
  private selectedFieldId: string | null = null;

  @state()
  private fieldPanelCollapsed = false;

  @state()
  private aiPaneCollapsed = false;

  @state()
  private splitRatio = 60; // percentage for map pane

  @state()
  private isDragging = false;

  @state()
  private fieldSearchQuery = "";

  @state()
  private showOrgDropdown = false;

  private get selectedField(): FarmField | null {
    if (!this.selectedFieldId || !this.organization) return null;
    return this.organization.fields.find((f) => f.id === this.selectedFieldId) ?? null;
  }

  private get filteredFields(): FarmField[] {
    if (!this.organization) return [];
    const query = this.fieldSearchQuery.toLowerCase();
    if (!query) return this.organization.fields;
    return this.organization.fields.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.cropType?.toLowerCase().includes(query),
    );
  }

  private get mapContext(): FarmMapContext {
    const fields = this.organization?.fields ?? [];
    const hasMultiple = fields.length > 1;

    // Calculate bounding box from all field centers
    let boundingBox: [number, number, number, number] | null = null;
    let center: [number, number] | null = null;

    if (fields.length > 0) {
      const centers = fields.filter((f) => f.center).map((f) => f.center!);
      if (centers.length > 0) {
        const lats = centers.map((c) => c[0]);
        const lngs = centers.map((c) => c[1]);
        boundingBox = [
          Math.min(...lngs),
          Math.min(...lats),
          Math.max(...lngs),
          Math.max(...lats),
        ];
        center = [
          (Math.min(...lats) + Math.max(...lats)) / 2,
          (Math.min(...lngs) + Math.max(...lngs)) / 2,
        ];
      }
    }

    return {
      hasZones: hasMultiple,
      hasSectors: false,
      assetCount: fields.length,
      boundingBox,
      center: center ?? [39.8283, -98.5795], // Default to US center
    };
  }

  private get mapAssets(): FarmAsset[] {
    if (!this.organization) return [];
    return this.organization.fields
      .filter((f) => f.center)
      .map((f) => ({
        id: f.id,
        name: f.name,
        type: "zone" as const,
        lat: f.center![0],
        lng: f.center![1],
        status: f.status,
      }));
  }

  private get mapZones(): FarmZone[] {
    if (!this.organization) return [];
    return this.organization.fields
      .filter((f) => f.boundaries && f.boundaries.length > 2)
      .map((f, index) => ({
        id: f.id,
        name: f.name,
        zoneNumber: index % 6, // Cycle through zone colors
        polygon: f.boundaries!,
        color: this.getFieldColor(f.status),
      }));
  }

  private getFieldColor(status: FarmField["status"]): string {
    switch (status) {
      case "healthy":
        return "#22c55e";
      case "warning":
        return "#f59e0b";
      case "critical":
        return "#ef4444";
      default:
        return "#71717a";
    }
  }

  private handleLayerChange(layer: MapLayer) {
    this.mapLayer = layer;
  }

  private handleFieldSelect(field: FarmField) {
    this.selectedFieldId = field.id;
    this.dispatchEvent(
      new CustomEvent("field-select", {
        detail: { field },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleOrgSelect(org: FarmOrganization) {
    this.organization = org;
    this.selectedFieldId = null;
    this.showOrgDropdown = false;
    this.dispatchEvent(
      new CustomEvent("org-change", {
        detail: { organization: org },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleResizeStart(e: MouseEvent) {
    e.preventDefault();
    this.isDragging = true;

    const handleMove = (moveEvent: MouseEvent) => {
      const container = this.shadowRoot?.querySelector(".split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newRatio = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      this.splitRatio = Math.max(30, Math.min(80, newRatio));
    };

    const handleUp = () => {
      this.isDragging = false;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  private renderTopBar() {
    const org = this.organization;
    const sourceIcon = org?.source === "deere" ? "🚜" : org?.source === "fieldview" ? "🌍" : "🌱";
    const sourceClass = org?.source === "fieldview" ? "fieldview" : org?.source === "deere" ? "" : "manual";

    return html`
      <div class="topbar">
        <div class="topbar-left">
          <div
            class="org-selector"
            @click=${() => (this.showOrgDropdown = !this.showOrgDropdown)}
          >
            <div class="org-icon ${sourceClass}">${sourceIcon}</div>
            <div class="org-info">
              <span class="org-name">${org?.name ?? "Select Farm"}</span>
              <span class="org-source">${org?.source ?? "Not connected"}</span>
            </div>
            <span class="org-chevron">▼</span>
          </div>

          <div class="brand">
            <span class="brand-icon">🌱</span>
            <span class="brand-name">farm_clawed</span>
          </div>
        </div>

        <div class="topbar-center">
          <select
            class="year-selector"
            .value=${this.selectedYear}
            @change=${(e: Event) => {
              this.selectedYear = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          ${org?.syncedAt
            ? html`
                <div class="sync-status">
                  <span class="sync-dot"></span>
                  Synced ${this.formatSyncTime(org.syncedAt)}
                </div>
              `
            : nothing}
        </div>

        <div class="topbar-right">
          <button
            class="topbar-btn"
            title="Toggle AI Panel"
            @click=${() => (this.aiPaneCollapsed = !this.aiPaneCollapsed)}
          >
            ${this.aiPaneCollapsed ? "◀" : "▶"}
          </button>
          <button class="topbar-btn" title="Settings">⚙️</button>
          <button class="topbar-btn" title="Notifications">🔔</button>
        </div>
      </div>
    `;
  }

  private formatSyncTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }

  private renderLayerControls() {
    const layers: Array<{ key: MapLayer; label: string; icon: string }> = [
      { key: "default", label: "Map", icon: "🗺️" },
      { key: "satellite", label: "Satellite", icon: "🛰️" },
      { key: "terrain", label: "Terrain", icon: "⛰️" },
    ];

    return html`
      <div class="map-controls">
        <div class="layer-toggle">
          ${layers.map(
            (layer) => html`
              <button
                class="layer-btn ${this.mapLayer === layer.key ? "active" : ""}"
                @click=${() => this.handleLayerChange(layer.key)}
              >
                ${layer.icon} ${layer.label}
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  private renderFieldPanel() {
    return html`
      <div class="field-panel ${this.fieldPanelCollapsed ? "collapsed" : ""}">
        <div class="field-panel-header">
          <span class="field-panel-title">
            Fields (${this.organization?.fields.length ?? 0})
          </span>
          <button
            class="field-panel-toggle"
            @click=${() => (this.fieldPanelCollapsed = true)}
          >
            ✕
          </button>
        </div>

        <div class="field-search">
          <input
            type="text"
            placeholder="Search fields..."
            .value=${this.fieldSearchQuery}
            @input=${(e: Event) => {
              this.fieldSearchQuery = (e.target as HTMLInputElement).value;
            }}
          />
        </div>

        <div class="field-list">
          ${this.filteredFields.map(
            (field) => html`
              <div
                class="field-item ${this.selectedFieldId === field.id ? "selected" : ""}"
                @click=${() => this.handleFieldSelect(field)}
              >
                <div class="field-status-dot ${field.status}"></div>
                <div class="field-info">
                  <div class="field-name">${field.name}</div>
                  <div class="field-meta">
                    <span>${field.area} ${field.areaUnit}</span>
                    ${field.cropType ? html`<span>• ${field.cropType}</span>` : nothing}
                  </div>
                </div>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  private renderLegend() {
    return html`
      <div class="legend-panel">
        <div class="legend-title">Field Status</div>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color" style="background: #22c55e"></div>
            <span>Healthy</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #f59e0b"></div>
            <span>Needs Attention</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #ef4444"></div>
            <span>Critical</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #71717a"></div>
            <span>Inactive</span>
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    return html`
      ${this.renderTopBar()}

      <div class="split-container">
        <!-- Map Pane -->
        <div
          class="map-pane ${this.aiPaneCollapsed ? "expanded" : ""}"
          style="flex: 0 0 ${this.aiPaneCollapsed ? 100 : this.splitRatio}%"
        >
          <div class="map-container">
            <farm-map-view
              .context=${this.mapContext}
              .assets=${this.mapAssets}
              .zones=${this.mapZones}
              .layer=${this.mapLayer}
              .forceMap=${true}
            ></farm-map-view>

            ${this.renderLayerControls()}
            ${!this.fieldPanelCollapsed ? this.renderFieldPanel() : nothing}
            ${this.renderLegend()}

            ${this.fieldPanelCollapsed
              ? html`
                  <button
                    class="expand-ai-btn"
                    @click=${() => (this.fieldPanelCollapsed = false)}
                    style="right: auto; left: 0; border-radius: 0 8px 8px 0; border-left: none;"
                  >
                    ☰
                  </button>
                `
              : nothing}
          </div>

          ${!this.aiPaneCollapsed
            ? html`
                <div
                  class="resize-handle ${this.isDragging ? "dragging" : ""}"
                  @mousedown=${this.handleResizeStart}
                ></div>
              `
            : nothing}
        </div>

        <!-- AI Pane -->
        <div class="ai-pane ${this.aiPaneCollapsed ? "collapsed" : ""}">
          <farm-ai-panel
            .selectedField=${this.selectedField}
            .organization=${this.organization}
            @command=${(e: CustomEvent) => this.dispatchEvent(new CustomEvent("command", { detail: e.detail }))}
          ></farm-ai-panel>
        </div>

        ${this.aiPaneCollapsed
          ? html`
              <button
                class="expand-ai-btn"
                @click=${() => (this.aiPaneCollapsed = false)}
              >
                ◀
              </button>
            `
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-command-center": FarmCommandCenter;
  }
}

