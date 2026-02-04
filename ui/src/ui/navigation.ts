import type { IconName } from "./icons.js";

/**
 * Tab groups for farm_clawed navigation
 *
 * Restructured for command center focus:
 * - Command Center is the primary landing page with split-view map+AI
 * - Operations group for automations and approvals
 * - Data group for field and equipment management
 * - System group for setup and configuration
 */
export const TAB_GROUPS = [
  {
    label: "Command Center",
    // farm-command-center is the primary split-view interface
    tabs: ["farm-command-center"],
  },
  {
    label: "Operations",
    tabs: ["farm-automations", "farm-approvals", "farm-audit"],
  },
  {
    label: "Data",
    tabs: ["farm-water", "farm-soil", "farm-microclimate", "farm-ipm", "farm-devices"],
  },
  {
    label: "Intelligence",
    tabs: ["farm-roi", "skills", "farm-experiments"],
  },
  {
    label: "System",
    tabs: ["farm-onboarding", "farm-setup", "config", "debug", "logs"],
  },
] as const;

export type Tab =
  // Command Center (primary)
  | "farm-command-center" // Split-view map + AI panel (primary landing page)
  | "farm-dashboard" // Legacy: redirects to command center
  // Operations tabs
  | "farm-automations" // Automation Builder
  | "farm-approvals" // Pending approvals
  | "farm-audit" // Audit log
  // Data tabs
  | "farm-water" // Water management
  | "farm-soil" // Soil & Fertility
  | "farm-microclimate" // Microclimate monitoring
  | "farm-ipm" // Integrated Pest Management
  | "farm-devices" // Equipment/Devices
  | "farm-map" // Map/Areas (standalone, for backward compat)
  // Intelligence tabs
  | "farm-roi" // ROI tracking
  | "skills" // AI Skills
  | "farm-experiments" // Experiments
  // System tabs
  | "farm-onboarding" // New user onboarding (JD/FV/Manual)
  | "farm-setup" // Legacy setup wizard
  | "config" // Settings
  | "debug" // Debug tools
  | "logs"; // System logs

const TAB_PATHS: Record<Tab, string> = {
  // Command Center (primary landing page)
  "farm-command-center": "/farm",
  "farm-dashboard": "/farm/dashboard", // Legacy path
  // Operations
  "farm-automations": "/farm/automations",
  "farm-approvals": "/farm/approvals",
  "farm-audit": "/farm/audit",
  // Data
  "farm-water": "/farm/water",
  "farm-soil": "/farm/soil",
  "farm-microclimate": "/farm/microclimate",
  "farm-ipm": "/farm/ipm",
  "farm-devices": "/farm/devices",
  "farm-map": "/farm/map",
  // Intelligence
  "farm-roi": "/farm/roi",
  skills: "/skills",
  "farm-experiments": "/farm/experiments",
  // System
  "farm-onboarding": "/farm/onboarding",
  "farm-setup": "/farm/setup",
  config: "/config",
  debug: "/debug",
  logs: "/logs",
};

const PATH_TO_TAB = new Map(Object.entries(TAB_PATHS).map(([tab, path]) => [path, tab as Tab]));

export function normalizeBasePath(basePath: string): string {
  if (!basePath) return "";
  let base = basePath.trim();
  if (!base.startsWith("/")) base = `/${base}`;
  if (base === "/") return "";
  if (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

export function normalizePath(path: string): string {
  if (!path) return "/";
  let normalized = path.trim();
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function pathForTab(tab: Tab, basePath = ""): string {
  const base = normalizeBasePath(basePath);
  const path = TAB_PATHS[tab];
  return base ? `${base}${path}` : path;
}

export function tabFromPath(pathname: string, basePath = ""): Tab | null {
  const base = normalizeBasePath(basePath);
  let path = pathname || "/";
  if (base) {
    if (path === base) {
      path = "/";
    } else if (path.startsWith(`${base}/`)) {
      path = path.slice(base.length);
    }
  }
  let normalized = normalizePath(path).toLowerCase();
  if (normalized.endsWith("/index.html")) normalized = "/";
  if (normalized === "/") return "farm-command-center";
  return PATH_TO_TAB.get(normalized) ?? null;
}

export function inferBasePathFromPathname(pathname: string): string {
  let normalized = normalizePath(pathname);
  if (normalized.endsWith("/index.html")) {
    normalized = normalizePath(normalized.slice(0, -"/index.html".length));
  }
  if (normalized === "/") return "";
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  for (let i = 0; i < segments.length; i++) {
    const candidate = `/${segments.slice(i).join("/")}`.toLowerCase();
    if (PATH_TO_TAB.has(candidate)) {
      const prefix = segments.slice(0, i);
      return prefix.length ? `/${prefix.join("/")}` : "";
    }
  }
  return `/${segments.join("/")}`;
}

export function iconForTab(tab: Tab): IconName {
  switch (tab) {
    // Command Center
    case "farm-command-center":
      return "home"; // Primary command center icon
    case "farm-dashboard":
      return "calendarDays"; // Legacy dashboard
    // Operations
    case "farm-automations":
      return "zap";
    case "farm-approvals":
      return "checkCircle";
    case "farm-audit":
      return "fileText";
    // Data
    case "farm-water":
      return "droplet";
    case "farm-soil":
      return "layers";
    case "farm-microclimate":
      return "thermometer";
    case "farm-ipm":
      return "bug";
    case "farm-devices":
      return "radio";
    case "farm-map":
      return "mapPin";
    // Intelligence
    case "farm-roi":
      return "barChart";
    case "skills":
      return "zap";
    case "farm-experiments":
      return "beaker";
    // System
    case "farm-onboarding":
      return "rocket"; // New onboarding icon
    case "farm-setup":
      return "settings";
    case "config":
      return "settings";
    case "debug":
      return "bug";
    case "logs":
      return "scrollText";
    default:
      return "folder";
  }
}

export function titleForTab(tab: Tab): string {
  switch (tab) {
    // Command Center
    case "farm-command-center":
      return "Command Center";
    case "farm-dashboard":
      return "Dashboard"; // Legacy
    // Operations
    case "farm-automations":
      return "Automations";
    case "farm-approvals":
      return "Approvals";
    case "farm-audit":
      return "Audit";
    // Data
    case "farm-water":
      return "Water";
    case "farm-soil":
      return "Soil & Fertility";
    case "farm-microclimate":
      return "Microclimate";
    case "farm-ipm":
      return "IPM";
    case "farm-devices":
      return "Devices";
    case "farm-map":
      return "Map / Areas";
    // Intelligence
    case "farm-roi":
      return "ROI";
    case "skills":
      return "Skills";
    case "farm-experiments":
      return "Experiments";
    // System
    case "farm-onboarding":
      return "Get Started";
    case "farm-setup":
      return "Setup";
    case "config":
      return "Settings";
    case "debug":
      return "Debug";
    case "logs":
      return "Logs";
    default:
      return "Control";
  }
}

export function subtitleForTab(tab: Tab): string {
  switch (tab) {
    // Command Center
    case "farm-command-center":
      return "Split-view map + AI assistant - your farm operations at a glance";
    case "farm-dashboard":
      return "Legacy dashboard view";
    // Operations
    case "farm-automations":
      return "Build and manage IFTTT-powered automations with safety guardrails";
    case "farm-approvals":
      return "Review and approve pending automation actions";
    case "farm-audit":
      return "Tamper-evident audit log of all farm operations";
    // Data
    case "farm-water":
      return "Water management, irrigation scheduling, and moisture tracking";
    case "farm-soil":
      return "Soil health, fertility, EC monitoring, and amendment tracking";
    case "farm-microclimate":
      return "Temperature, humidity, frost risk, and microclimate zones";
    case "farm-ipm":
      return "Integrated Pest Management, beneficial insects, and pest alerts";
    case "farm-devices":
      return "Connected sensors, valves, and equipment status";
    case "farm-map":
      return "Interactive farm map with zones, sectors, and asset overlays";
    // Intelligence
    case "farm-roi":
      return "Track water savings, time savings, and payback period";
    case "skills":
      return "Manage AI skills and knowledge modules";
    case "farm-experiments":
      return "Run experiments and A/B tests on your farm";
    // System
    case "farm-onboarding":
      return "Connect John Deere, Climate FieldView, or start fresh";
    case "farm-setup":
      return "Legacy setup wizard - connect data sources and actuators";
    case "config":
      return "Edit ~/.farm_clawed/farm_clawed.json safely";
    case "debug":
      return "Gateway snapshots, events, and manual RPC calls";
    case "logs":
      return "Live tail of the gateway file logs";
    default:
      return "";
  }
}

/**
 * Check if a tab requires certain configuration to be useful
 */
export function tabRequirements(tab: Tab): { required: string[]; optional: string[] } {
  switch (tab) {
    case "farm-command-center":
      return {
        required: [],
        optional: ["DEERE_CLIENT_ID", "FIELDVIEW_CLIENT_ID", "IFTTT_WEBHOOK_KEY"],
      };
    case "farm-automations":
      return {
        required: [],
        optional: ["IFTTT_WEBHOOK_KEY"],
      };
    case "farm-onboarding":
      return {
        required: [],
        optional: ["DEERE_CLIENT_ID", "FIELDVIEW_CLIENT_ID"],
      };
    case "farm-setup":
      return {
        required: [],
        optional: [],
      };
    case "farm-devices":
      return {
        required: [],
        optional: ["IFTTT_WEBHOOK_KEY", "HOME_ASSISTANT_URL"],
      };
    default:
      return { required: [], optional: [] };
  }
}
