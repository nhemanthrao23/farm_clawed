/**
 * Farm Map View
 *
 * Smart map component using Leaflet + OpenStreetMap.
 * Conditionally renders map or asset card based on farm context.
 * Uses app's dark theme CSS variables.
 */

import { LitElement, html, css, PropertyValues, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";

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
.leaflet-safari .leaflet-tile {
  image-rendering: -webkit-optimize-contrast;
}
.leaflet-safari .leaflet-tile-container {
  width: 1600px;
  height: 1600px;
  -webkit-transform-origin: 0 0;
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
.leaflet-container img.leaflet-tile {
  mix-blend-mode: plus-lighter;
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
.leaflet-container {
  -webkit-tap-highlight-color: transparent;
}
.leaflet-container a {
  -webkit-tap-highlight-color: rgba(51, 181, 229, 0.4);
}
.leaflet-tile {
  filter: inherit;
  visibility: hidden;
}
.leaflet-tile-loaded {
  visibility: inherit;
}
.leaflet-zoom-box {
  width: 0;
  height: 0;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
  z-index: 800;
}
.leaflet-overlay-pane svg {
  -moz-user-select: none;
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
.leaflet-map-pane canvas {
  z-index: 100;
}
.leaflet-map-pane svg {
  z-index: 200;
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
.leaflet-right {
  right: 0;
}
.leaflet-bottom {
  bottom: 0;
}
.leaflet-left {
  left: 0;
}
.leaflet-control {
  float: left;
  clear: both;
}
.leaflet-right .leaflet-control {
  float: right;
}
.leaflet-top .leaflet-control {
  margin-top: 10px;
}
.leaflet-bottom .leaflet-control {
  margin-bottom: 10px;
}
.leaflet-left .leaflet-control {
  margin-left: 10px;
}
.leaflet-right .leaflet-control {
  margin-right: 10px;
}
.leaflet-control-zoom-in,
.leaflet-control-zoom-out {
  font: bold 18px 'Lucida Console', Monaco, monospace;
  text-indent: 1px;
}
.leaflet-touch .leaflet-control-zoom-in, .leaflet-touch .leaflet-control-zoom-out {
  font-size: 22px;
}
.leaflet-touch .leaflet-bar a {
  width: 30px;
  height: 30px;
  line-height: 30px;
}
.leaflet-touch .leaflet-bar a:first-child {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.leaflet-touch .leaflet-bar a:last-child {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}
.leaflet-bar {
  box-shadow: 0 1px 5px rgba(0,0,0,0.65);
  border-radius: 4px;
}
.leaflet-bar a {
  background-color: #1a1d25;
  border-bottom: 1px solid #27272a;
  width: 26px;
  height: 26px;
  line-height: 26px;
  display: block;
  text-align: center;
  text-decoration: none;
  color: #e4e4e7;
}
.leaflet-bar a:hover, .leaflet-bar a:focus {
  background-color: #262a35;
}
.leaflet-bar a:first-child {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.leaflet-bar a:last-child {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  border-bottom: none;
}
.leaflet-popup {
  position: absolute;
  text-align: center;
  margin-bottom: 20px;
}
.leaflet-popup-content-wrapper {
  padding: 1px;
  text-align: left;
  border-radius: 12px;
}
.leaflet-popup-content {
  margin: 13px 24px 13px 20px;
  line-height: 1.3;
  font-size: 13px;
  min-height: 1px;
}
.leaflet-popup-tip-container {
  width: 40px;
  height: 20px;
  position: absolute;
  left: 50%;
  margin-top: -1px;
  margin-left: -20px;
  overflow: hidden;
  pointer-events: none;
}
.leaflet-popup-tip {
  width: 17px;
  height: 17px;
  padding: 1px;
  margin: -10px auto 0;
  pointer-events: auto;
  transform: rotate(45deg);
}
.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
  background: #181b22;
  color: #e4e4e7;
  box-shadow: 0 3px 14px rgba(0,0,0,0.4);
}
.leaflet-container a.leaflet-popup-close-button {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  text-align: center;
  width: 24px;
  height: 24px;
  font: 16px/24px Tahoma, Verdana, sans-serif;
  color: #71717a;
  text-decoration: none;
  background: transparent;
}
.leaflet-container a.leaflet-popup-close-button:hover,
.leaflet-container a.leaflet-popup-close-button:focus {
  color: #e4e4e7;
}
.leaflet-popup-scrolled {
  overflow: auto;
}
.leaflet-attribution-flag {
  display: none !important;
}
`;

// Farm map context for smart rendering decisions
export interface FarmMapContext {
  hasZones: boolean;
  hasSectors: boolean;
  assetCount: number;
  boundingBox: [number, number, number, number] | null; // [minLng, minLat, maxLng, maxLat]
  center: [number, number] | null; // [lat, lng]
}

// Map layer type
export type MapLayer = "default" | "satellite" | "terrain";

// Asset representation on the map
export interface FarmAsset {
  id: string;
  name: string;
  type: "plant" | "sensor" | "valve" | "zone" | "sector";
  lat: number;
  lng: number;
  status?: "healthy" | "warning" | "critical";
  readings?: Array<{ label: string; value: string; status?: string }>;
}

// Zone polygon
export interface FarmZone {
  id: string;
  name: string;
  zoneNumber: number; // 0-5 for permaculture zones
  polygon: Array<[number, number]>; // Array of [lat, lng]
  color?: string;
}

/**
 * Determine if map should be shown based on farm context
 */
export function shouldShowMap(ctx: FarmMapContext): boolean {
  // Single plant (like lemon tree) - no map needed
  if (ctx.assetCount <= 1 && !ctx.hasZones && !ctx.hasSectors) {
    return false;
  }
  // Multiple zones, sectors, or assets - show map
  return ctx.hasZones || ctx.hasSectors || ctx.assetCount > 3;
}

// Permaculture zone colors
const ZONE_COLORS: Record<number, string> = {
  0: "#ef4444", // Zone 0 (home) - red
  1: "#f97316", // Zone 1 (intensive) - orange
  2: "#eab308", // Zone 2 (semi-intensive) - yellow
  3: "#22c55e", // Zone 3 (main crops) - green
  4: "#3b82f6", // Zone 4 (semi-wild) - blue
  5: "#8b5cf6", // Zone 5 (wild) - purple
};

@customElement("farm-map-view")
export class FarmMapView extends LitElement {
  static override styles = [
    unsafeCSS(LEAFLET_CSS),
    css`
    :host {
      display: block;
      height: 100%;
      min-height: 200px;
    }

    .map-container {
      width: 100%;
      height: 100%;
      min-height: 200px;
      border-radius: var(--radius-md, 8px);
      overflow: hidden;
      background: var(--bg-elevated, #1a1d25);
    }

    .asset-card {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .asset-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .asset-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md, 8px);
      background: linear-gradient(135deg, var(--ok, #22c55e) 0%, #16a34a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
    }

    .asset-info h2 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--text-strong, #fafafa);
    }

    .asset-info .type {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      text-transform: capitalize;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-left: auto;
    }

    .status-badge.healthy {
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      color: var(--ok, #22c55e);
    }

    .status-badge.warning {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      color: var(--warn, #f59e0b);
    }

    .status-badge.critical {
      background: var(--danger-subtle, rgba(239, 68, 68, 0.12));
      color: var(--danger, #ef4444);
    }

    .readings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-top: 1rem;
      flex: 1;
    }

    .reading-card {
      background: var(--bg-elevated, #1a1d25);
      border-radius: var(--radius-md, 8px);
      padding: 0.875rem;
    }

    .reading-label {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .reading-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }

    .reading-value.warning {
      color: var(--warn, #f59e0b);
    }

    .reading-value.critical {
      color: var(--danger, #ef4444);
    }

    .quick-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border, #27272a);
    }

    .action-btn {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-md, 8px);
      background: var(--card, #181b22);
      color: var(--text, #e4e4e7);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .action-btn:hover {
      background: var(--bg-hover, #262a35);
      border-color: var(--border-hover, #52525b);
    }

    .action-btn.primary {
      background: var(--ok, #22c55e);
      border-color: var(--ok, #22c55e);
      color: white;
    }

    .action-btn.primary:hover {
      background: #16a34a;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--muted, #71717a);
      text-align: center;
      padding: 2rem;
    }

    .no-data-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      opacity: 0.5;
    }
  `];

  @property({ type: Object })
  context: FarmMapContext = {
    hasZones: false,
    hasSectors: false,
    assetCount: 1,
    boundingBox: null,
    center: null,
  };

  @property({ type: Array })
  assets: FarmAsset[] = [];

  @property({ type: Array })
  zones: FarmZone[] = [];

  @property({ type: Boolean })
  forceMap = false;

  @property({ type: String })
  layer: MapLayer = "default";

  @state()
  private mapInitialized = false;

  @state()
  private selectedAsset: FarmAsset | null = null;

  private mapInstance: unknown = null;

  override updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    const showMap = this.forceMap || shouldShowMap(this.context);
    if (showMap && !this.mapInitialized) {
      this.initializeMap();
    }
    // Update layer if map exists and layer changed
    if (changedProperties.has("layer") && this.mapInstance) {
      this.updateMapLayer();
    }
  }

  private currentTileLayer: unknown = null;

  private updateMapLayer() {
    if (!this.mapInstance) return;
    const L = (window as unknown as { L: typeof import("leaflet") }).L;
    if (!L) return;
    
    const map = this.mapInstance as import("leaflet").Map;
    
    // Remove current tile layer
    if (this.currentTileLayer) {
      map.removeLayer(this.currentTileLayer as import("leaflet").TileLayer);
    }
    
    // Add new tile layer based on selection
    let tileLayer: import("leaflet").TileLayer;
    switch (this.layer) {
      case "satellite":
        tileLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          attribution: '&copy; Esri',
          maxZoom: 19,
        });
        break;
      case "terrain":
        tileLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenTopoMap',
          maxZoom: 17,
        });
        break;
      default:
        tileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; OSM &copy; CARTO',
          maxZoom: 19,
        });
    }
    
    tileLayer.addTo(map);
    this.currentTileLayer = tileLayer;
  }

  private async initializeMap() {
    // Dynamically import Leaflet to avoid SSR issues
    try {
      const L = await import("leaflet");
      
      const mapContainer = this.shadowRoot?.querySelector("#map");
      if (!mapContainer || this.mapInstance) return;

      // Default center (can be overridden by context)
      const center = this.context.center || [37.7749, -122.4194]; // Default to SF
      
      const map = L.map(mapContainer as HTMLElement).setView(center, 15);
      
      // Use CartoDB dark tiles for dark theme
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add zones as polygons
      for (const zone of this.zones) {
        const color = zone.color || ZONE_COLORS[zone.zoneNumber] || "#6b7280";
        L.polygon(zone.polygon, {
          color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 2,
        })
          .addTo(map)
          .bindPopup(`<strong>${zone.name}</strong><br>Zone ${zone.zoneNumber}`);
      }

      // Add assets as markers
      for (const asset of this.assets) {
        const markerColor = asset.status === "critical" ? "#ef4444" : 
                           asset.status === "warning" ? "#f59e0b" : "#22c55e";
        
        // Use circle markers for simplicity (no external icon files needed)
        L.circleMarker([asset.lat, asset.lng], {
          radius: 10,
          fillColor: markerColor,
          color: "#181b22",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindPopup(`<strong>${asset.name}</strong><br>${asset.type}`);
      }

      // Fit bounds if we have a bounding box
      if (this.context.boundingBox) {
        const [minLng, minLat, maxLng, maxLat] = this.context.boundingBox;
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]]);
      }

      this.mapInstance = map;
      this.mapInitialized = true;
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  }

  private renderAssetCard() {
    const asset = this.assets[0];
    if (!asset) {
      return html`
        <div class="no-data">
          <div class="no-data-icon">🌱</div>
          <p>No assets configured yet.</p>
          <p style="font-size: 0.8rem">Add your first plant or sensor to get started.</p>
        </div>
      `;
    }

    const iconMap: Record<string, string> = {
      plant: "🍋",
      sensor: "📡",
      valve: "🚿",
      zone: "🗺️",
      sector: "📐",
    };

    return html`
      <div class="asset-card">
        <div class="asset-header">
          <div class="asset-icon">${iconMap[asset.type] || "🌱"}</div>
          <div class="asset-info">
            <h2>${asset.name}</h2>
            <span class="type">${asset.type}</span>
          </div>
          <span class="status-badge ${asset.status || "healthy"}">
            ${asset.status === "critical" ? "🚨" : asset.status === "warning" ? "⚡" : "✓"}
            ${asset.status || "Healthy"}
          </span>
        </div>

        ${asset.readings && asset.readings.length > 0
          ? html`
              <div class="readings-grid">
                ${asset.readings.map(
                  (r) => html`
                    <div class="reading-card">
                      <div class="reading-label">${r.label}</div>
                      <div class="reading-value ${r.status || ""}">${r.value}</div>
                    </div>
                  `
                )}
              </div>
            `
          : null}

        <div class="quick-actions">
          <button class="action-btn primary" @click=${() => this.dispatchEvent(new CustomEvent("water-request"))}>
            💧 Water
          </button>
          <button class="action-btn" @click=${() => this.dispatchEvent(new CustomEvent("view-history"))}>
            📊 History
          </button>
          <button class="action-btn" @click=${() => this.dispatchEvent(new CustomEvent("ask-ai"))}>
            🤖 Ask AI
          </button>
        </div>
      </div>
    `;
  }

  override render() {
    if (this.forceMap || shouldShowMap(this.context)) {
      return html`
        <div class="map-container" id="map"></div>
      `;
    }

    return this.renderAssetCard();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-map-view": FarmMapView;
  }
}
