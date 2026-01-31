/**
 * Farm Dashboard - ChatGPT-style Interface
 *
 * Clean, conversation-first farm control where all interactions
 * (map, sensors, automations) appear as inline cards in the chat thread.
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { FarmMapContext, FarmAsset } from "./farm-map.js";
import "./farm-chat-cards.js";
import type { SensorReading, AutomationProposal, EquipmentItem, FarmCard } from "./farm-chat-cards.js";

// Chat message with optional rich cards
export interface FarmChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  cards?: FarmCard[];
}

// Slash command definition
interface SlashCommand {
  command: string;
  description: string;
  icon: string;
}

const COMMANDS: SlashCommand[] = [
  { command: "/status", description: "Current sensor readings", icon: "📊" },
  { command: "/map", description: "View farm map", icon: "🗺️" },
  { command: "/water", description: "Water recommendations", icon: "💧" },
  { command: "/equipment", description: "Equipment status", icon: "⚙️" },
  { command: "/approvals", description: "Pending automations", icon: "📋" },
];

@customElement("farm-dashboard-view")
export class FarmDashboardView extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg, #12141a);
      font-family: var(--font-body, "Space Grotesk", sans-serif);
    }

    /* Minimal Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid var(--border, #27272a);
      background: var(--bg, #12141a);
      flex-shrink: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      font-size: 1.5rem;
    }

    .brand-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      letter-spacing: -0.02em;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: var(--ok-subtle, rgba(34, 197, 94, 0.12));
      border: 1px solid var(--ok, #22c55e);
      border-radius: 9999px;
      font-size: 0.7rem;
      color: var(--ok, #22c55e);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ok, #22c55e);
      box-shadow: 0 0 8px var(--ok, #22c55e);
    }

    .status-dot.offline {
      background: var(--danger, #ef4444);
      box-shadow: 0 0 8px var(--danger, #ef4444);
    }

    .status-dot.loading {
      background: var(--warn, #f59e0b);
      box-shadow: 0 0 8px var(--warn, #f59e0b);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .icon-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-md, 8px);
      color: var(--muted, #71717a);
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 1rem;
    }

    .icon-btn:hover {
      background: var(--bg-hover, #262a35);
      border-color: var(--border-hover, #52525b);
      color: var(--text, #e4e4e7);
    }

    /* Chat Thread */
    .chat-thread {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .chat-container {
      max-width: 720px;
      margin: 0 auto;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
      min-height: 60vh;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.8;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.75rem;
    }

    .empty-subtitle {
      font-size: 1rem;
      color: var(--muted, #71717a);
      margin-bottom: 2rem;
      max-width: 400px;
      line-height: 1.6;
    }

    .empty-commands {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      text-align: left;
    }

    .empty-command {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .empty-command:hover {
      border-color: var(--accent, #ff5c5c);
      background: var(--bg-hover, #262a35);
    }

    .empty-command-icon {
      font-size: 1.25rem;
    }

    .empty-command-text {
      flex: 1;
    }

    .empty-command-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }

    .empty-command-desc {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }

    /* Messages */
    .message {
      margin-bottom: 1.5rem;
    }

    .message-user {
      display: flex;
      justify-content: flex-end;
    }

    .message-user .message-bubble {
      max-width: 80%;
      padding: 0.875rem 1.25rem;
      background: var(--accent, #ff5c5c);
      border-radius: var(--radius-lg, 12px);
      border-bottom-right-radius: 4px;
      color: white;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .message-assistant {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .message-assistant .message-content {
      font-size: 0.95rem;
      color: var(--text, #e4e4e7);
      line-height: 1.7;
      max-width: 100%;
    }

    .message-cards {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      max-width: 500px;
    }

    .message-time {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
    }

    /* Input Area */
    .input-area {
      border-top: 1px solid var(--border, #27272a);
      background: var(--bg, #12141a);
      padding: 1rem 1.5rem 1.5rem;
      flex-shrink: 0;
    }

    .input-container {
      max-width: 720px;
      margin: 0 auto;
    }

    .input-wrapper {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      transition: border-color 0.15s ease;
    }

    .input-wrapper:focus-within {
      border-color: var(--accent, #ff5c5c);
      box-shadow: 0 0 0 2px var(--accent-subtle, rgba(255, 92, 92, 0.15));
    }

    .chat-input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text, #e4e4e7);
      font-size: 0.95rem;
      font-family: inherit;
      resize: none;
      min-height: 24px;
      max-height: 120px;
      line-height: 1.5;
      padding: 0.25rem 0;
    }

    .chat-input::placeholder {
      color: var(--muted, #71717a);
    }

    .chat-input:focus {
      outline: none;
    }

    .send-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent, #ff5c5c);
      border: none;
      border-radius: var(--radius-md, 8px);
      color: white;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .send-btn:hover:not(:disabled) {
      background: var(--accent-hover, #ff7070);
      box-shadow: 0 0 20px var(--accent-glow, rgba(255, 92, 92, 0.25));
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-btn.generating {
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0;
      color: var(--muted, #71717a);
      font-size: 0.8rem;
    }

    .typing-dots {
      display: flex;
      gap: 3px;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      background: var(--muted, #71717a);
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-dots span:nth-child(1) { animation-delay: 0s; }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    /* Command Suggestions */
    .command-suggestions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      flex-wrap: wrap;
    }

    .command-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: transparent;
      border: 1px solid var(--border, #27272a);
      border-radius: 9999px;
      color: var(--muted, #71717a);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .command-chip:hover {
      border-color: var(--accent, #ff5c5c);
      color: var(--accent, #ff5c5c);
    }

    /* Command Dropdown */
    .command-dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: var(--radius-lg, 12px);
      margin-bottom: 0.5rem;
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }

    .command-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .command-option:hover,
    .command-option.selected {
      background: var(--bg-hover, #262a35);
    }

    .command-option-icon {
      font-size: 1.1rem;
    }

    .command-option-text {
      flex: 1;
    }

    .command-option-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }

    .command-option-desc {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }

    .input-relative {
      position: relative;
    }
  `;

  @property({ type: Object })
  mapContext: FarmMapContext = {
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
        { label: "Temp", value: "54.5°F", status: "" },
        { label: "EC", value: "0.001", status: "warning" },
        { label: "Battery", value: "57%", status: "" },
      ],
    },
  ];

  @property({ type: String })
  ollamaStatus: "online" | "offline" | "loading" = "loading";

  @property({ type: String })
  ollamaModel = "llama3.2:latest";

  @state()
  private messages: FarmChatMessage[] = [];

  @state()
  private inputValue = "";

  @state()
  private showCommands = false;

  @state()
  private selectedCommandIndex = 0;

  @state()
  private isGenerating = false;

  @state()
  private streamingContent = "";

  override connectedCallback() {
    super.connectedCallback();
    this.checkOllamaStatus();
  }

  private async checkOllamaStatus() {
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      if (response.ok) {
        this.ollamaStatus = "online";
      } else {
        this.ollamaStatus = "offline";
      }
    } catch {
      this.ollamaStatus = "offline";
    }
  }

  private get filteredCommands(): SlashCommand[] {
    if (!this.inputValue.startsWith("/")) return [];
    const query = this.inputValue.slice(1).toLowerCase();
    return COMMANDS.filter(c => c.command.slice(1).startsWith(query));
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.inputValue = target.value;
    this.showCommands = this.inputValue.startsWith("/") && this.filteredCommands.length > 0;
    this.selectedCommandIndex = 0;

    // Auto-resize
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.showCommands) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.selectedCommandIndex = Math.min(this.selectedCommandIndex + 1, this.filteredCommands.length - 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.selectedCommandIndex = Math.max(this.selectedCommandIndex - 1, 0);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        this.selectCommand(this.filteredCommands[this.selectedCommandIndex]);
      } else if (e.key === "Escape") {
        this.showCommands = false;
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  private selectCommand(cmd: SlashCommand) {
    this.inputValue = cmd.command + " ";
    this.showCommands = false;
    this.executeCommand(cmd.command);
  }

  private executeCommand(command: string) {
    const now = new Date().toISOString();
    const cmd = command.trim().toLowerCase();

    // Add user message
    this.messages = [...this.messages, {
      id: this.generateId(),
      role: "user",
      content: command,
      timestamp: now,
    }];

    // Generate response based on command
    setTimeout(() => {
      let responseContent = "";
      let cards: FarmCard[] = [];

      switch (cmd) {
        case "/status":
          responseContent = "Here's the current status of your Meyer Lemon Tree:";
          cards = [{
            type: "sensor",
            assetName: "Meyer Lemon Tree",
            data: [
              { id: "1", label: "Moisture", value: "17", unit: "%", status: "warning", icon: "💧" },
              { id: "2", label: "Temperature", value: "54.5", unit: "°F", status: "normal", icon: "🌡️" },
              { id: "3", label: "EC", value: "0.001", unit: " mS/cm", status: "warning", icon: "🌱" },
              { id: "4", label: "Battery", value: "57", unit: "%", status: "normal", icon: "🔋" },
            ],
          }];
          break;

        case "/map":
          responseContent = "Here's your farm map:";
          cards = [{
            type: "map",
            context: { ...this.mapContext, hasZones: true, assetCount: 5 },
            assets: this.assets,
          }];
          break;

        case "/water":
          responseContent = "Based on the current moisture level (17%), I recommend watering your lemon tree. Here's my proposal:";
          cards = [{
            type: "automation",
            proposal: {
              id: "auto-1",
              type: "water",
              action: "Water Meyer Lemon Tree for 2 minutes",
              target: "Meyer Lemon Tree",
              reason: "Soil moisture at 17% is below the optimal 30-60% range. Watering now will prevent stress.",
              confidence: 92,
              estimatedImpact: "~1.0 gallon",
              expiresIn: "45 min",
            },
          }];
          break;

        case "/equipment":
          responseContent = "Here's the status of your farm equipment:";
          cards = [{
            type: "equipment",
            devices: [
              { id: "hub-1", name: "SmartLife Hub", type: "hub", status: "online" },
              { id: "sensor-1", name: "Lemon Soil Sensor", type: "sensor", status: "online", metric: "57% battery" },
              { id: "valve-1", name: "Water Valve", type: "valve", status: "offline" },
            ],
          }];
          break;

        case "/approvals":
          responseContent = "You have 1 pending automation that needs approval:";
          cards = [{
            type: "automation",
            proposal: {
              id: "auto-1",
              type: "water",
              action: "Water Meyer Lemon Tree for 2 minutes",
              target: "Meyer Lemon Tree",
              reason: "Soil moisture at 17% is below threshold.",
              confidence: 92,
              estimatedImpact: "~1.0 gallon",
              expiresIn: "45 min",
            },
          }];
          break;

        default:
          responseContent = "I didn't recognize that command. Try /status, /map, /water, /equipment, or /approvals.";
      }

      this.messages = [...this.messages, {
        id: this.generateId(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
        cards: cards.length > 0 ? cards : undefined,
      }];

      this.inputValue = "";
      this.scrollToBottom();
    }, 300);
  }

  private async handleSend() {
    if (!this.inputValue.trim() || this.isGenerating) return;

    const content = this.inputValue.trim();
    const now = new Date().toISOString();

    // Check if it's a command
    if (content.startsWith("/")) {
      this.executeCommand(content.split(" ")[0]);
      return;
    }

    // Regular message
    this.messages = [...this.messages, {
      id: this.generateId(),
      role: "user",
      content,
      timestamp: now,
    }];

    this.inputValue = "";
    this.dispatchEvent(new CustomEvent("chat-message", { detail: { message: content } }));

    // Call Ollama for AI response
    await this.callOllama(content);
  }

  private async callOllama(userMessage: string) {
    if (this.ollamaStatus === "offline") {
      this.messages = [...this.messages, {
        id: this.generateId(),
        role: "assistant",
        content: "⚠️ Ollama is not running. Please start Ollama to use the AI assistant. You can still use commands like /status, /map, /water, /equipment.",
        timestamp: new Date().toISOString(),
      }];
      this.scrollToBottom();
      return;
    }

    this.isGenerating = true;
    this.streamingContent = "";

    // Build context with farm data
    const farmContext = `You are farm_clawed, an AI assistant for autonomous farming. You help manage a Meyer Lemon Tree.

Current sensor readings:
- Soil Moisture: 17% (WARNING - below optimal 30-60%)
- Soil Temperature: 54.5°F
- EC: 0.001 mS/cm (WARNING - low nutrients)
- Sensor Battery: 57%

Equipment status:
- SmartLife Hub: Online
- Lemon Soil Sensor: Online (57% battery)
- Water Valve: Offline

You can help with:
- Watering recommendations (mention /water command for quick action)
- Sensor status (mention /status command)
- Equipment issues (mention /equipment command)
- Farm planning and advice

Be concise, helpful, and action-oriented. If the user needs to water, tell them to use /water command.`;

    const assistantMsgId = this.generateId();
    
    // Add placeholder message for streaming
    this.messages = [...this.messages, {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    }];
    this.scrollToBottom();

    try {
      const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.ollamaModel,
          messages: [
            { role: "system", content: farmContext },
            ...this.messages.slice(0, -1).filter(m => m.role !== "system").slice(-10).map(m => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: userMessage },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullContent += json.message.content;
              // Update the message in place
              this.messages = this.messages.map(m => 
                m.id === assistantMsgId 
                  ? { ...m, content: fullContent }
                  : m
              );
              this.scrollToBottom();
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }

      // Check if we should add cards based on content
      const lowerContent = userMessage.toLowerCase();
      let cards: FarmCard[] = [];

      if (lowerContent.includes("water") || lowerContent.includes("moisture") || lowerContent.includes("dry") || lowerContent.includes("thirsty")) {
        cards = [{
          type: "sensor",
          assetName: "Meyer Lemon Tree",
          data: [
            { id: "1", label: "Moisture", value: "17", unit: "%", status: "warning", icon: "💧" },
            { id: "2", label: "Temperature", value: "54.5", unit: "°F", status: "normal", icon: "🌡️" },
          ],
        }];
      } else if (lowerContent.includes("equipment") || lowerContent.includes("device") || lowerContent.includes("sensor")) {
        cards = [{
          type: "equipment",
          devices: [
            { id: "hub-1", name: "SmartLife Hub", type: "hub", status: "online" },
            { id: "sensor-1", name: "Lemon Soil Sensor", type: "sensor", status: "online", metric: "57% battery" },
            { id: "valve-1", name: "Water Valve", type: "valve", status: "offline" },
          ],
        }];
      }

      if (cards.length > 0) {
        this.messages = this.messages.map(m => 
          m.id === assistantMsgId 
            ? { ...m, cards }
            : m
        );
      }

    } catch (error) {
      console.error("Ollama error:", error);
      this.messages = this.messages.map(m => 
        m.id === assistantMsgId 
          ? { ...m, content: `⚠️ Error connecting to Ollama: ${error instanceof Error ? error.message : "Unknown error"}. Make sure Ollama is running with \`ollama serve\`.` }
          : m
      );
    } finally {
      this.isGenerating = false;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      const thread = this.shadowRoot?.querySelector(".chat-thread");
      if (thread) {
        thread.scrollTop = thread.scrollHeight;
      }
    });
  }

  private handleCommandClick(cmd: SlashCommand) {
    this.executeCommand(cmd.command);
  }

  private handleApprove(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent("approve-automation", { detail: e.detail }));
    // Add confirmation message
    this.messages = [...this.messages, {
      id: this.generateId(),
      role: "assistant",
      content: "✅ Automation approved! Watering will begin shortly.",
      timestamp: new Date().toISOString(),
    }];
  }

  private handleReject(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent("reject-automation", { detail: e.detail }));
    this.messages = [...this.messages, {
      id: this.generateId(),
      role: "assistant",
      content: "Automation rejected. Let me know if you'd like different recommendations.",
      timestamp: new Date().toISOString(),
    }];
  }

  private renderCard(card: FarmCard) {
    switch (card.type) {
      case "sensor":
        return html`
          <farm-chat-sensor-card
            .readings=${card.data}
            .assetName=${card.assetName || ""}
            @water-request=${() => this.executeCommand("/water")}
          ></farm-chat-sensor-card>
        `;
      case "map":
        return html`
          <farm-chat-map-card
            .context=${card.context}
            .assets=${card.assets}
          ></farm-chat-map-card>
        `;
      case "automation":
        return html`
          <farm-chat-automation-card
            .proposal=${card.proposal}
            @approve=${this.handleApprove}
            @reject=${this.handleReject}
          ></farm-chat-automation-card>
        `;
      case "equipment":
        return html`
          <farm-chat-equipment-card
            .devices=${card.devices}
            @view-all=${() => this.dispatchEvent(new CustomEvent("view-equipment"))}
          ></farm-chat-equipment-card>
        `;
      case "alert":
        return html`
          <farm-chat-alert-card
            .severity=${card.severity}
            .alertTitle=${card.title}
            .message=${card.message}
          ></farm-chat-alert-card>
        `;
      default:
        return nothing;
    }
  }

  private renderEmptyState() {
    return html`
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <div class="empty-title">Welcome to farm_clawed</div>
        <div class="empty-subtitle">
          I'm your autonomous farming assistant. Ask me anything about your farm, or try these commands:
        </div>
        <div class="empty-commands">
          ${COMMANDS.slice(0, 4).map(cmd => html`
            <div class="empty-command" @click=${() => this.handleCommandClick(cmd)}>
              <span class="empty-command-icon">${cmd.icon}</span>
              <div class="empty-command-text">
                <div class="empty-command-name">${cmd.command}</div>
                <div class="empty-command-desc">${cmd.description}</div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderMessages() {
    return html`
      ${this.messages.map(msg => html`
        <div class="message message-${msg.role}">
          ${msg.role === "user" ? html`
            <div class="message-bubble">${msg.content}</div>
          ` : html`
            <div class="message-content">${msg.content}</div>
            ${msg.cards?.length ? html`
              <div class="message-cards">
                ${msg.cards.map(card => this.renderCard(card))}
              </div>
            ` : nothing}
            <div class="message-time">${this.formatTime(msg.timestamp)}</div>
          `}
        </div>
      `)}
    `;
  }

  override render() {
    return html`
      <!-- Header -->
      <div class="header">
        <div class="brand">
          <span class="brand-icon">🌱</span>
          <span class="brand-name">farm_clawed</span>
        </div>
        <div class="status-badge" style="${this.ollamaStatus === "offline" ? "border-color: var(--danger); color: var(--danger); background: var(--danger-subtle);" : this.ollamaStatus === "loading" ? "border-color: var(--warn); color: var(--warn); background: var(--warn-subtle);" : ""}">
          <span class="status-dot ${this.ollamaStatus}"></span>
          ${this.ollamaStatus === "online" ? "Ollama Online" : this.ollamaStatus === "loading" ? "Connecting..." : "Ollama Offline"}
        </div>
        <div class="header-actions">
          <button class="icon-btn" @click=${() => this.dispatchEvent(new CustomEvent("refresh"))} title="Refresh">🔄</button>
          <button class="icon-btn" @click=${() => this.dispatchEvent(new CustomEvent("settings"))} title="Settings">⚙️</button>
        </div>
      </div>

      <!-- Chat Thread -->
      <div class="chat-thread">
        <div class="chat-container">
          ${this.messages.length === 0 ? this.renderEmptyState() : this.renderMessages()}
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-container">
          <div class="input-relative">
            ${this.showCommands ? html`
              <div class="command-dropdown">
                ${this.filteredCommands.map((cmd, i) => html`
                  <div 
                    class="command-option ${i === this.selectedCommandIndex ? "selected" : ""}"
                    @click=${() => this.selectCommand(cmd)}
                  >
                    <span class="command-option-icon">${cmd.icon}</span>
                    <div class="command-option-text">
                      <div class="command-option-name">${cmd.command}</div>
                      <div class="command-option-desc">${cmd.description}</div>
                    </div>
                  </div>
                `)}
              </div>
            ` : nothing}
            <div class="input-wrapper">
              <textarea
                class="chat-input"
                placeholder="Ask farm_clawed anything..."
                .value=${this.inputValue}
                @input=${this.handleInput}
                @keydown=${this.handleKeyDown}
                rows="1"
                ?disabled=${this.isGenerating}
              ></textarea>
              <button 
                class="send-btn ${this.isGenerating ? "generating" : ""}" 
                @click=${this.handleSend}
                ?disabled=${!this.inputValue.trim() || this.isGenerating}
              >${this.isGenerating ? "..." : "→"}</button>
            </div>
          </div>
          <div class="command-suggestions">
            ${COMMANDS.map(cmd => html`
              <button class="command-chip" @click=${() => this.handleCommandClick(cmd)}>
                ${cmd.icon} ${cmd.command}
              </button>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-dashboard-view": FarmDashboardView;
  }
}
