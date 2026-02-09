import type { Tab } from "./navigation";
import { connectGateway } from "./app-gateway";
import {
  applySettingsFromUrl,
  attachThemeListener,
  detachThemeListener,
  inferBasePath,
  syncTabWithLocation,
  syncThemeWithSettings,
} from "./app-settings";
import { observeTopbar, scheduleChatScroll, scheduleLogsScroll } from "./app-scroll";
import {
  startLogsPolling,
  startNodesPolling,
  stopLogsPolling,
  stopNodesPolling,
  startDebugPolling,
  stopDebugPolling,
} from "./app-polling";

type LifecycleHost = {
  basePath: string;
  tab: Tab;
  chatHasAutoScrolled: boolean;
  chatLoading: boolean;
  chatMessages: unknown[];
  chatToolMessages: unknown[];
  chatStream: string;
  logsAutoFollow: boolean;
  logsAtBottom: boolean;
  logsEntries: unknown[];
  popStateHandler: () => void;
  topbarObserver: ResizeObserver | null;
  // AI Provider settings
  aiProvider: "ollama" | "openai" | "auto";
  openaiApiKey: string;
  ollamaStatus: "online" | "offline" | "loading";
  openaiStatus: "online" | "offline" | "loading";
};

export function handleConnected(host: LifecycleHost) {
  host.basePath = inferBasePath();
  applySettingsFromUrl(host as unknown as Parameters<typeof applySettingsFromUrl>[0]);
  syncTabWithLocation(host as unknown as Parameters<typeof syncTabWithLocation>[0], true);
  syncThemeWithSettings(host as unknown as Parameters<typeof syncThemeWithSettings>[0]);
  attachThemeListener(host as unknown as Parameters<typeof attachThemeListener>[0]);
  window.addEventListener("popstate", host.popStateHandler);
  connectGateway(host as unknown as Parameters<typeof connectGateway>[0]);
  startNodesPolling(host as unknown as Parameters<typeof startNodesPolling>[0]);
  // Initialize AI providers
  initializeAIProviders(host);
  if (host.tab === "logs") {
    startLogsPolling(host as unknown as Parameters<typeof startLogsPolling>[0]);
  }
  if (host.tab === "debug") {
    startDebugPolling(host as unknown as Parameters<typeof startDebugPolling>[0]);
  }
}

/**
 * Initialize AI providers (Ollama + OpenAI)
 */
async function initializeAIProviders(host: LifecycleHost) {
  // Load saved settings from localStorage
  const savedProvider = localStorage.getItem("farm_clawed_ai_provider") as "ollama" | "openai" | "auto" | null;
  const savedApiKey = localStorage.getItem("farm_clawed_openai_key") || "";
  
  if (savedProvider) host.aiProvider = savedProvider;
  if (savedApiKey) host.openaiApiKey = savedApiKey;

  // Check Ollama status
  try {
    const ollamaRes = await fetch("http://localhost:11434/api/tags");
    host.ollamaStatus = ollamaRes.ok ? "online" : "offline";
  } catch {
    host.ollamaStatus = "offline";
  }

  // Check OpenAI status if we have an API key
  if (host.openaiApiKey) {
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${host.openaiApiKey}` },
      });
      host.openaiStatus = openaiRes.ok ? "online" : "offline";
    } catch {
      host.openaiStatus = "offline";
    }
  } else {
    host.openaiStatus = "offline";
  }
}

export function handleFirstUpdated(host: LifecycleHost) {
  observeTopbar(host as unknown as Parameters<typeof observeTopbar>[0]);
}

export function handleDisconnected(host: LifecycleHost) {
  window.removeEventListener("popstate", host.popStateHandler);
  stopNodesPolling(host as unknown as Parameters<typeof stopNodesPolling>[0]);
  stopLogsPolling(host as unknown as Parameters<typeof stopLogsPolling>[0]);
  stopDebugPolling(host as unknown as Parameters<typeof stopDebugPolling>[0]);
  detachThemeListener(host as unknown as Parameters<typeof detachThemeListener>[0]);
  host.topbarObserver?.disconnect();
  host.topbarObserver = null;
}

export function handleUpdated(host: LifecycleHost, changed: Map<PropertyKey, unknown>) {
  if (
    host.tab === "chat" &&
    (changed.has("chatMessages") ||
      changed.has("chatToolMessages") ||
      changed.has("chatStream") ||
      changed.has("chatLoading") ||
      changed.has("tab"))
  ) {
    const forcedByTab = changed.has("tab");
    const forcedByLoad =
      changed.has("chatLoading") &&
      changed.get("chatLoading") === true &&
      host.chatLoading === false;
    scheduleChatScroll(
      host as unknown as Parameters<typeof scheduleChatScroll>[0],
      forcedByTab || forcedByLoad || !host.chatHasAutoScrolled,
    );
  }
  if (
    host.tab === "logs" &&
    (changed.has("logsEntries") || changed.has("logsAutoFollow") || changed.has("tab"))
  ) {
    if (host.logsAutoFollow && host.logsAtBottom) {
      scheduleLogsScroll(
        host as unknown as Parameters<typeof scheduleLogsScroll>[0],
        changed.has("tab") || changed.has("logsAutoFollow"),
      );
    }
  }
}
