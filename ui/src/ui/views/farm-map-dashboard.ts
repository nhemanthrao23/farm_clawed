/**
 * Farm Map Dashboard
 *
 * Full-screen map view with floating AI insights and automations panels.
 * Uses app's dark theme CSS variables.
 */

import { LitElement, html, css, PropertyValues, unsafeCSS, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { FarmMapContext, FarmAsset, FarmZone, MapLayer } from "./farm-map.js";

// Leaflet CSS (inline to work with Shadow DOM)
const LEAFLET_CSS = `
.leaflet-pane,
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow,
.leaflet-tile-container,
.leaflet-pane > svg,
.leaflet-pane > canvas,
.leaflet-zoom-box,
.leaflet-image-layer,
.leaflet-layer {
  position: absolute;
  left: 0;
  top: 0;
}
.leaflet-container {
  overflow: hidden;
  font-family: inherit;
  font-size: 0.875rem;
}
.leaflet-tile,
.leaflet-marker-icon,
.leaflet-marker-shadow {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
}
.leaflet-tile::selection {
  background: transparent;
}
.leaflet-marker-icon,
.leaflet-marker-shadow {
  display: block;
}
.leaflet-container .leaflet-overlay-pane svg {
  max-width: none !important;
  max-height: none !important;
}
.leaflet-container .leaflet-marker-pane img,
.leaflet-container .leaflet-shadow-pane img,
.leaflet-container .leaflet-tile-pane img,
.leaflet-container img.leaflet-image-layer,
.leaflet-container .leaflet-tile {
  max-width: none !important;
  max-height: none !important;
  width: auto;
  padding: 0;
}
.leaflet-container.leaflet-touch-zoom {
  -ms-touch-action: pan-x pan-y;
  touch-action: pan-x pan-y;
}
.leaflet-container.leaflet-touch-drag {
  -ms-touch-action: pinch-zoom;
  touch-action: none;
  touch-action: pinch-zoom;
}
.leaflet-container.leaflet-touch-drag.leaflet-touch-zoom {
  -ms-touch-action: none;
  touch-action: none;
}
.leaflet-tile {
  filter: inherit;
  visibility: hidden;
}
.leaflet-tile-loaded {
  visibility: inherit;
}
.leaflet-pane {
  z-index: 400;
}
.leaflet-tile-pane {
  z-index: 200;
}
.leaflet-overlay-pane {
  z-index: 400;
}
.leaflet-shadow-pane {
  z-index: 500;
}
.leaflet-marker-pane {
  z-index: 600;
}
.leaflet-tooltip-pane {
  z-index: 650;
}
.leaflet-popup-pane {
  z-index: 700;
}
.leaflet-control {
  position: relative;
  z-index: 800;
  pointer-events: visiblePainted;
  pointer-events: auto;
}
.leaflet-top,
.leaflet-bottom {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
}
.leaflet-top {
  top: 0;
}
.leaflet-bottom {
  bottom: 0;
}
.leaflet-left {
  left: 0;
}
.leaflet-right {
  right: 0;
}
.leaflet-control-zoom {
  display: none;
}
.leaflet-control-attribution {
  background: rgba(0,0,0,0.5);
  color: #888;
  font-size: 10px;
  padding: 2px 5px;
}
.leaflet-control-attribution a {
  color: #888;
}
.leaflet-popup-content-wrapper {
  background: #181b22;
  border: 1px solid #27272a;
  border-radius: 8px;
  color: #fafafa;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
.leaflet-popup-content {
  margin: 12px 16px;
  font-size: 13px;
}
.leaflet-popup-tip {
  background: #181b22;
  border: 1px solid #27272a;
}
.leaflet-popup-close-button {
  color: #71717a;
  font-size: 18px;
  width: 24px;
  height: 24px;
}
.leaflet-popup-close-button:hover {
  color: #fafafa;
}
`;

// AI Insight interface
export interface AIInsight {
  id: string;
  type: "info" | "warning" | "action" | "success";
  title: string;
  message: string;
  timestamp: string;
  assetId?: string;
}

// Automation proposal interface
export interface AutomationProposal {
  id: string;
  type: "water" | "fertilize" | "climate" | "maintenance";
  action: string;
  target: string;
  confidence: number;
  expiresIn: string;
}

// Permaculture zone colors
const ZONE_COLORS: Record<number, string> = {
  0: "#ef4444",
  1: "#f97316",
  2: "#eab308",
  3: "#22c55e",
  4: "#3b82f6",
  5: "#8b5cf6",
};

@customElement("farm-map-dashboard")
export class FarmMapDashboard extends LitElement {
  static override styles = [
    unsafeCSS(LEAFLET_CSS),
    css`
      :host {
        display: block;
        height: 100%;
        position: relative;
        background: var(--bg, #12141a);
      }
      
      .map-wrapper {
        position: absolute;
        inset: 0;
        z-index: 1;
      }
      
      .map-container {
        width: 100%;
        height: 100%;
        background: var(--bg-elevated, #1a1d25);
      }
      
      /* Floating panels */
      .panel {
        position: absolute;
        z-index: 1000;
        background: rgba(24, 27, 34, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid var(--border, #27272a);
        border-radius: var(--radius-lg, 12px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        max-height: calc(100% - 2rem);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      
      /* AI Insights Panel - Top Left */
      .insights-panel {
        top: 1rem;
        left: 1rem;
        width: 320px;
      }
      
      /* Automations Panel - Top Right */
      .automations-panel {
        top: 1rem;
        right: 1rem;
        width: 300px;
      }
      
      /* Layer Controls - Bottom Right */
      .layer-controls {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        z-index: 1000;
        display: flex;
        gap: 0.25rem;
        background: rgba(24, 27, 34, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid var(--border, #27272a);
        border-radius: var(--radius-md, 8px);
        padding: 0.25rem;
      }
      
      .layer-btn {
        padding: 0.5rem 0.75rem;
        border: none;
        background: transparent;
        border-radius: 6px;
        font-size: 0.75rem;
        color: var(--muted, #71717a);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      
      .layer-btn:hover {
        color: var(--text, #e4e4e7);
      }
      
      .layer-btn.active {
        background: var(--card, #181b22);
        color: var(--text-strong, #fafafa);
      }
      
      /* Panel header */
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.875rem 1rem;
        border-bottom: 1px solid var(--border, #27272a);
        flex-shrink: 0;
      }
      
      .panel-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-strong, #fafafa);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .panel-badge {
        font-size: 0.65rem;
        padding: 0.125rem 0.375rem;
        background: var(--accent, #ff5c5c);
        color: white;
        border-radius: 9999px;
      }
      
      .panel-toggle {
        background: none;
        border: none;
        color: var(--muted, #71717a);
        cursor: pointer;
        padding: 0.25rem;
        font-size: 0.8rem;
      }
      
      .panel-toggle:hover {
        color: var(--text, #e4e4e7);
      }
      
      /* Panel content */
      .panel-content {
        padding: 0.75rem;
        overflow-y: auto;
        flex: 1;
      }
      
      .panel-content.collapsed {
        display: none;
      }
      
      /* Insight cards */
      .insight-card {
        background: var(--bg-elevated, #1a1d25);
        border-radius: var(--radius-md, 8px);
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        border-left: 3px solid;
      }
      
      .insight-card.info {
        border-left-color: var(--info, #3b82f6);
      }
      
      .insight-card.warning {
        border-left-color: var(--warn, #f59e0b);
      }
      
      .insight-card.action {
        border-left-color: var(--accent, #ff5c5c);
      }
      
      .insight-card.success {
        border-left-color: var(--ok, #22c55e);
      }
      
      .insight-title {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--text-strong, #fafafa);
        margin-bottom: 0.25rem;
      }
      
      .insight-message {
        font-size: 0.75rem;
        color: var(--muted, #71717a);
        line-height: 1.4;
      }
      
      .insight-time {
        font-size: 0.65rem;
        color: var(--muted, #71717a);
        margin-top: 0.375rem;
        opacity: 0.7;
      }
      
      /* Automation cards */
      .automation-card {
        background: var(--bg-elevated, #1a1d25);
        border: 1px solid var(--border, #27272a);
        border-radius: var(--radius-md, 8px);
        padding: 0.75rem;
        margin-bottom: 0.5rem;
      }
      
      .automation-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.375rem;
      }
      
      .automation-icon {
        font-size: 0.9rem;
      }
      
      .automation-action {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--text-strong, #fafafa);
        flex: 1;
      }
      
      .automation-confidence {
        font-size: 0.65rem;
        color: var(--ok, #22c55e);
      }
      
      .automation-target {
        font-size: 0.7rem;
        color: var(--muted, #71717a);
        margin-bottom: 0.5rem;
      }
      
      .automation-buttons {
        display: flex;
        gap: 0.375rem;
      }
      
      .auto-btn {
        flex: 1;
        padding: 0.375rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      
      .auto-btn.approve {
        background: var(--ok, #22c55e);
        border: none;
        color: white;
      }
      
      .auto-btn.approve:hover {
        background: #16a34a;
      }
      
      .auto-btn.reject {
        background: transparent;
        border: 1px solid var(--border, #27272a);
        color: var(--muted, #71717a);
      }
      
      .auto-btn.reject:hover {
        border-color: var(--danger, #ef4444);
        color: var(--danger, #ef4444);
      }
      
      /* Empty state */
      .empty-state {
        text-align: center;
        padding: 1.5rem;
        color: var(--muted, #71717a);
      }
      
      .empty-icon {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
      }
      
      .empty-text {
        font-size: 0.75rem;
      }
      
      /* Zoom controls */
      .zoom-controls {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      
      .zoom-btn {
        width: 32px;
        height: 32px;
        background: rgba(24, 27, 34, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid var(--border, #27272a);
        border-radius: 6px;
        color: var(--text, #e4e4e7);
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      
      .zoom-btn:hover {
        background: var(--card, #181b22);
        border-color: var(--border-hover, #52525b);
      }
      
      /* Center button */
      .center-btn {
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        padding: 0.5rem 1rem;
        background: rgba(24, 27, 34, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid var(--border, #27272a);
        border-radius: var(--radius-md, 8px);
        color: var(--text, #e4e4e7);
        font-size: 0.75rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        transition: all 0.15s ease;
      }
      
      .center-btn:hover {
        background: var(--card, #181b22);
        border-color: var(--border-hover, #52525b);
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .insights-panel,
        .automations-panel {
          width: calc(50% - 1.5rem);
        }
      }
      
      @media (max-width: 600px) {
        .insights-panel {
          width: calc(100% - 2rem);
          left: 1rem;
          right: 1rem;
          top: 1rem;
          max-height: 40%;
        }
      
        .automations-panel {
          display: none;
        }
      }
    `,
  ];

  @property({ type: Object })
  context: FarmMapContext = {
    hasZones: false,
    hasSectors: false,
    assetCount: 1,
    boundingBox: null,
    center: null,
  };

  @property({ type: Array })
  assets: FarmAsset[] = [
    {
      id: "lemon-1",
      name: "Meyer Lemon Tree",
      type: "plant",
      lat: 37.7749,
      lng: -122.4194,
      status: "warning",
      readings: [
        { label: "Moisture", value: "17%", status: "warning" },
        { label: "Temp", value: "54.5°F" },
      ],
    },
  ];

  @property({ type: Array })
  zones: FarmZone[] = [];

  @property({ type: Array })
  insights: AIInsight[] = [
    {
      id: "1",
      type: "warning",
      title: "Low Soil Moisture",
      message: "Meyer Lemon Tree moisture at 17%, below optimal 30% threshold.",
      timestamp: new Date().toISOString(),
      assetId: "lemon-1",
    },
    {
      id: "2",
      type: "info",
      title: "Weather Update",
      message: "No rain expected for next 5 days. Consider irrigation schedule.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  @property({ type: Array })
  automations: AutomationProposal[] = [
    {
      id: "auto-1",
      type: "water",
      action: "Water for 2 minutes",
      target: "Meyer Lemon Tree",
      confidence: 92,
      expiresIn: "45 min",
    },
  ];

  @state()
  private activeLayer: MapLayer = "default";

  @state()
  private insightsCollapsed = false;

  @state()
  private automationsCollapsed = false;

  @state()
  private mapInitialized = false;

  private mapInstance: L.Map | null = null;
  private assetMarkers: Map<string, L.Marker> = new Map();
  private zonePolygons: Map<string, L.Polygon> = new Map();

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    if (!this.mapInitialized) {
      this.initializeMap();
    }
    if (changedProperties.has("activeLayer") && this.mapInstance) {
      this.updateMapLayer();
    }
    if (changedProperties.has("assets") && this.mapInstance) {
      this.updateMarkers();
    }
    if (changedProperties.has("zones") && this.mapInstance) {
      this.updateZones();
    }
  }

  private async initializeMap() {
    const mapEl = this.shadowRoot?.getElementById("map");
    if (!mapEl) return;

    // Dynamic import of Leaflet
    const L = await import("leaflet");

    // Get center from context or default
    const center = this.context.center || [37.7749, -122.4194];

    this.mapInstance = L.map(mapEl, {
      center: center as [number, number],
      zoom: 16,
      zoomControl: false,
      attributionControl: true,
    });

    this.updateMapLayer();
    this.updateMarkers();
    this.updateZones();
    this.mapInitialized = true;
  }

  private async updateMapLayer() {
    if (!this.mapInstance) return;

    const L = await import("leaflet");

    // Remove existing tile layers
    this.mapInstance.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        this.mapInstance?.removeLayer(layer);
      }
    });

    let tileUrl = "";
    let attribution = "";

    switch (this.activeLayer) {
      case "satellite":
        tileUrl =
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = "&copy; Esri";
        break;
      case "terrain":
        tileUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
        attribution = "&copy; OpenTopoMap";
        break;
      default:
        tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
        attribution = "&copy; CARTO";
    }

    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(this.mapInstance);
  }

  private async updateMarkers() {
    if (!this.mapInstance) return;

    const L = await import("leaflet");

    // Clear existing markers
    this.assetMarkers.forEach((marker) => marker.remove());
    this.assetMarkers.clear();

    // Add markers for assets
    for (const asset of this.assets) {
      const statusColor =
        asset.status === "warning"
          ? "#f59e0b"
          : asset.status === "critical"
            ? "#ef4444"
            : "#22c55e";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 32px;
          height: 32px;
          background: ${statusColor};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">🍋</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([asset.lat, asset.lng], { icon }).addTo(this.mapInstance).bindPopup(`
          <div style="min-width: 150px;">
            <div style="font-weight: 600; margin-bottom: 8px;">${asset.name}</div>
            ${
              asset.readings
                ?.map(
                  (r) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #71717a;">${r.label}</span>
                <span style="color: ${r.status === "warning" ? "#f59e0b" : "#fafafa"};">${r.value}</span>
              </div>
            `,
                )
                .join("") || ""
            }
          </div>
        `);

      this.assetMarkers.set(asset.id, marker);
    }
  }

  private async updateZones() {
    if (!this.mapInstance || this.zones.length === 0) return;

    const L = await import("leaflet");

    // Clear existing polygons
    this.zonePolygons.forEach((polygon) => polygon.remove());
    this.zonePolygons.clear();

    // Add zone polygons
    for (const zone of this.zones) {
      const color = zone.color || ZONE_COLORS[zone.zoneNumber] || "#6b7280";

      const polygon = L.polygon(zone.polygon, {
        color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2,
      })
        .addTo(this.mapInstance)
        .bindPopup(`<strong>Zone ${zone.zoneNumber}</strong><br>${zone.name}`);

      this.zonePolygons.set(zone.id, polygon);
    }
  }

  private handleZoom(delta: number) {
    if (this.mapInstance) {
      this.mapInstance.setZoom(this.mapInstance.getZoom() + delta);
    }
  }

  private handleCenter() {
    if (this.mapInstance && this.assets.length > 0) {
      const asset = this.assets[0];
      this.mapInstance.setView([asset.lat, asset.lng], 16);
    }
  }

  private handleApprove(id: string) {
    this.dispatchEvent(new CustomEvent("approve-automation", { detail: { id } }));
  }

  private handleReject(id: string) {
    this.dispatchEvent(new CustomEvent("reject-automation", { detail: { id } }));
  }

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      water: "💧",
      fertilize: "🌱",
      climate: "🌡️",
      maintenance: "🔧",
    };
    return icons[type] || "⚙️";
  }

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  override render() {
    const pendingCount = this.automations.length;

    return html`
      <div class="map-wrapper">
        <div class="map-container" id="map"></div>
      </div>

      <!-- AI Insights Panel -->
      <div class="panel insights-panel">
        <div class="panel-header">
          <span class="panel-title">
            🤖 AI Insights
          </span>
          <button class="panel-toggle" @click=${() => (this.insightsCollapsed = !this.insightsCollapsed)}>
            ${this.insightsCollapsed ? "▼" : "▲"}
          </button>
        </div>
        <div class="panel-content ${this.insightsCollapsed ? "collapsed" : ""}">
          ${
            this.insights.length === 0
              ? html`
                  <div class="empty-state">
                    <div class="empty-icon">✨</div>
                    <div class="empty-text">No new insights</div>
                  </div>
                `
              : this.insights.map(
                  (insight) => html`
                <div class="insight-card ${insight.type}">
                  <div class="insight-title">${insight.title}</div>
                  <div class="insight-message">${insight.message}</div>
                  <div class="insight-time">${this.formatTime(insight.timestamp)}</div>
                </div>
              `,
                )
          }
        </div>
      </div>

      <!-- Automations Panel -->
      <div class="panel automations-panel">
        <div class="panel-header">
          <span class="panel-title">
            ⚡ Automations
            ${pendingCount > 0 ? html`<span class="panel-badge">${pendingCount}</span>` : nothing}
          </span>
          <button class="panel-toggle" @click=${() => (this.automationsCollapsed = !this.automationsCollapsed)}>
            ${this.automationsCollapsed ? "▼" : "▲"}
          </button>
        </div>
        <div class="panel-content ${this.automationsCollapsed ? "collapsed" : ""}">
          ${
            this.automations.length === 0
              ? html`
                  <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <div class="empty-text">No pending actions</div>
                  </div>
                `
              : this.automations.map(
                  (auto) => html`
                <div class="automation-card">
                  <div class="automation-header">
                    <span class="automation-icon">${this.getTypeIcon(auto.type)}</span>
                    <span class="automation-action">${auto.action}</span>
                    <span class="automation-confidence">${auto.confidence}%</span>
                  </div>
                  <div class="automation-target">${auto.target} • Expires in ${auto.expiresIn}</div>
                  <div class="automation-buttons">
                    <button class="auto-btn approve" @click=${() => this.handleApprove(auto.id)}>
                      ✓ Approve
                    </button>
                    <button class="auto-btn reject" @click=${() => this.handleReject(auto.id)}>
                      ✕ Reject
                    </button>
                  </div>
                </div>
              `,
                )
          }
        </div>
      </div>

      <!-- Zoom Controls -->
      <div class="zoom-controls">
        <button class="zoom-btn" @click=${() => this.handleZoom(1)}>+</button>
        <button class="zoom-btn" @click=${() => this.handleZoom(-1)}>−</button>
      </div>

      <!-- Center Button -->
      <button class="center-btn" @click=${this.handleCenter}>
        📍 Center on Farm
      </button>

      <!-- Layer Controls -->
      <div class="layer-controls">
        <button 
          class="layer-btn ${this.activeLayer === "default" ? "active" : ""}"
          @click=${() => (this.activeLayer = "default")}
        >Default</button>
        <button 
          class="layer-btn ${this.activeLayer === "satellite" ? "active" : ""}"
          @click=${() => (this.activeLayer = "satellite")}
        >Satellite</button>
        <button 
          class="layer-btn ${this.activeLayer === "terrain" ? "active" : ""}"
          @click=${() => (this.activeLayer = "terrain")}
        >Terrain</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-map-dashboard": FarmMapDashboard;
  }
}
