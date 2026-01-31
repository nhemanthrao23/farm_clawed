/**
 * Floating Chat Bubble Component
 *
 * Persistent AI chat access across all farm_clawed pages.
 * Bottom-right FAB with expandable chat panel.
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Tab } from "../navigation.js";

// Chat message interface
export interface BubbleChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

// Slash commands for quick actions
const COMMANDS = [
  { command: "/status", label: "Farm Status", icon: "📊", description: "Check all sensors and assets" },
  { command: "/map", label: "View Map", icon: "🗺️", description: "Open farm map view" },
  { command: "/water", label: "Water Now", icon: "💧", description: "Trigger irrigation" },
  { command: "/equipment", label: "Equipment", icon: "⚙️", description: "Check equipment status" },
  { command: "/approvals", label: "Approvals", icon: "✅", description: "View pending automations" },
];

@customElement("farm-chat-bubble")
export class FarmChatBubble extends LitElement {
  static override styles = css`
    :host {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      font-family: inherit;
    }

    /* Floating Action Button */
    .fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(34, 197, 94, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .fab:active {
      transform: scale(0.95);
    }

    .fab.open {
      transform: rotate(45deg);
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .fab-icon {
      font-size: 1.75rem;
      line-height: 1;
      transition: transform 0.3s ease;
    }

    .fab.open .fab-icon {
      transform: rotate(-45deg);
    }

    /* Badge for pending items */
    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: #ef4444;
      color: white;
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
      animation: pulse-badge 2s ease-in-out infinite;
    }

    @keyframes pulse-badge {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    /* Chat Panel */
    .chat-panel {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 380px;
      height: 520px;
      background: rgba(24, 27, 34, 0.98);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border, #27272a);
      border-radius: 16px;
      box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      animation: panel-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes panel-in {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .chat-panel.closing {
      animation: panel-out 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    @keyframes panel-out {
      from {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      to {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
    }

    /* Panel Header */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--border, #27272a);
      background: rgba(18, 20, 26, 0.8);
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }

    .panel-title-icon {
      font-size: 1.1rem;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.7rem;
      color: var(--muted, #71717a);
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

    .header-actions {
      display: flex;
      gap: 0.25rem;
    }

    .header-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--muted, #71717a);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      transition: all 0.15s ease;
    }

    .header-btn:hover {
      background: var(--bg-elevated, #1a1d25);
      color: var(--text, #e4e4e7);
    }

    /* Context Bar */
    .context-bar {
      padding: 0.5rem 1rem;
      background: var(--bg-elevated, #1a1d25);
      border-bottom: 1px solid var(--border, #27272a);
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .context-tag {
      padding: 0.25rem 0.5rem;
      background: var(--card, #181b22);
      border-radius: 4px;
      color: var(--text, #e4e4e7);
    }

    /* Messages */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .message {
      display: flex;
      gap: 0.5rem;
      max-width: 90%;
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message.assistant,
    .message.system {
      align-self: flex-start;
    }

    .message-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .message.assistant .message-avatar,
    .message.system .message-avatar {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    }

    .message.user .message-avatar {
      background: var(--accent, #ff5c5c);
    }

    .message-bubble {
      padding: 0.625rem 0.875rem;
      border-radius: 12px;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .message.user .message-bubble {
      background: var(--accent, #ff5c5c);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.assistant .message-bubble,
    .message.system .message-bubble {
      background: var(--card, #181b22);
      color: var(--text, #e4e4e7);
      border: 1px solid var(--border, #27272a);
      border-bottom-left-radius: 4px;
    }

    .message-time {
      font-size: 0.6rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
      text-align: right;
    }

    .message.assistant .message-time,
    .message.system .message-time {
      text-align: left;
    }

    /* Quick Commands */
    .quick-commands {
      padding: 0.5rem;
      border-top: 1px solid var(--border, #27272a);
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
      background: var(--bg-elevated, #1a1d25);
    }

    .quick-cmd {
      padding: 0.375rem 0.625rem;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 6px;
      font-size: 0.7rem;
      color: var(--text, #e4e4e7);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .quick-cmd:hover {
      background: var(--bg-hover, #262a35);
      border-color: var(--ok, #22c55e);
      color: var(--ok, #22c55e);
    }

    /* Input Area */
    .input-area {
      padding: 0.75rem;
      border-top: 1px solid var(--border, #27272a);
      background: rgba(18, 20, 26, 0.8);
    }

    .input-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .chat-input {
      flex: 1;
      padding: 0.625rem 0.875rem;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 10px;
      color: var(--text, #e4e4e7);
      font-size: 0.85rem;
      resize: none;
      min-height: 38px;
      max-height: 100px;
      font-family: inherit;
      line-height: 1.4;
    }

    .chat-input:focus {
      outline: none;
      border-color: var(--ok, #22c55e);
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15);
    }

    .chat-input::placeholder {
      color: var(--muted, #71717a);
    }

    .send-btn {
      width: 38px;
      height: 38px;
      border: none;
      background: var(--ok, #22c55e);
      color: white;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .send-btn:hover:not(:disabled) {
      background: #16a34a;
      box-shadow: 0 0 16px rgba(34, 197, 94, 0.4);
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

    /* Welcome State */
    .welcome {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .welcome-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .welcome-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
      margin-bottom: 0.5rem;
    }

    .welcome-subtitle {
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .chat-panel {
        width: calc(100vw - 2rem);
        height: calc(100vh - 100px);
        right: -0.5rem;
        bottom: 68px;
      }
    }
  `;

  @property({ type: String })
  currentTab: Tab = "farm-dashboard";

  @property({ type: Number })
  pendingAutomations = 0;

  @property({ type: String })
  ollamaStatus: "online" | "offline" | "loading" = "loading";

  @property({ type: String })
  ollamaModel = "llama3.2:latest";

  @property({ type: Array })
  externalMessages: BubbleChatMessage[] = [];

  @state()
  private isOpen = false;

  @state()
  private isClosing = false;

  @state()
  private messages: BubbleChatMessage[] = [];

  @state()
  private inputValue = "";

  @state()
  private isGenerating = false;

  override connectedCallback() {
    super.connectedCallback();
    this.checkOllamaStatus();
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("externalMessages") && this.externalMessages.length > 0) {
      // Sync with external messages
      this.messages = [...this.externalMessages];
    }
  }

  private async checkOllamaStatus() {
    try {
      const response = await fetch("http://localhost:11434/api/tags");
      this.ollamaStatus = response.ok ? "online" : "offline";
    } catch {
      this.ollamaStatus = "offline";
    }
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  private getTabLabel(tab: Tab): string {
    const labels: Record<string, string> = {
      "farm-dashboard": "Dashboard",
      "farm-map": "Farm Map",
      "farm-equipment": "Equipment",
      "farm-automations": "Automations",
      "overview": "Overview",
      "channels": "Channels",
      "config": "Settings",
    };
    return labels[tab] || tab;
  }

  private togglePanel() {
    if (this.isOpen) {
      this.isClosing = true;
      setTimeout(() => {
        this.isOpen = false;
        this.isClosing = false;
      }, 200);
    } else {
      this.isOpen = true;
    }
  }

  private handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.inputValue = target.value;
    // Auto-resize
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  private handleQuickCommand(command: string) {
    this.inputValue = command;
    this.handleSend();
  }

  private async handleSend() {
    if (!this.inputValue.trim() || this.isGenerating) return;

    const content = this.inputValue.trim();
    const now = new Date().toISOString();

    // Check for navigation commands
    if (content.startsWith("/")) {
      this.handleCommand(content);
      return;
    }

    // Add user message
    const userMsg: BubbleChatMessage = {
      id: this.generateId(),
      role: "user",
      content,
      timestamp: now,
    };
    this.messages = [...this.messages, userMsg];
    this.inputValue = "";

    // Dispatch message for syncing
    this.dispatchEvent(new CustomEvent("chat-message", { 
      detail: { message: content, messages: this.messages },
      bubbles: true, 
      composed: true 
    }));

    // Call Ollama
    await this.callOllama(content);
  }

  private handleCommand(command: string) {
    const cmd = command.toLowerCase().split(" ")[0];
    const now = new Date().toISOString();

    // Add user message
    this.messages = [...this.messages, {
      id: this.generateId(),
      role: "user",
      content: command,
      timestamp: now,
    }];

    this.inputValue = "";

    let responseContent = "";
    let navigateTo: Tab | null = null;

    switch (cmd) {
      case "/status":
        responseContent = "Opening farm dashboard for full status view...";
        navigateTo = "farm-dashboard";
        break;
      case "/map":
        responseContent = "Opening farm map view...";
        navigateTo = "farm-map";
        break;
      case "/equipment":
        responseContent = "Opening equipment status page...";
        navigateTo = "farm-equipment";
        break;
      case "/approvals":
      case "/automations":
        responseContent = `Opening automations. You have ${this.pendingAutomations} pending.`;
        navigateTo = "farm-automations";
        break;
      case "/water":
        responseContent = "I'll help you water your plants. Opening the dashboard where you can approve watering...";
        navigateTo = "farm-dashboard";
        break;
      default:
        responseContent = "Unknown command. Try /status, /map, /equipment, /approvals, or /water.";
    }

    // Add assistant response
    setTimeout(() => {
      this.messages = [...this.messages, {
        id: this.generateId(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      }];

      if (navigateTo) {
        this.dispatchEvent(new CustomEvent("navigate-tab", { 
          detail: { tab: navigateTo },
          bubbles: true, 
          composed: true 
        }));
      }

      this.scrollToBottom();
    }, 300);
  }

  private async callOllama(userMessage: string) {
    if (this.ollamaStatus === "offline") {
      this.messages = [...this.messages, {
        id: this.generateId(),
        role: "assistant",
        content: "Ollama is offline. Try /status, /map, /equipment, or /approvals for quick navigation.",
        timestamp: new Date().toISOString(),
      }];
      this.scrollToBottom();
      return;
    }

    this.isGenerating = true;

    const farmContext = `You are farm_clawed, an AI assistant for autonomous farming. You help manage a Meyer Lemon Tree.

Current context: User is viewing the "${this.getTabLabel(this.currentTab)}" page.
Pending automations: ${this.pendingAutomations}

Current sensor readings:
- Soil Moisture: 17% (WARNING - below optimal 30-60%)
- Soil Temperature: 54.5°F
- EC: 0.001 mS/cm (WARNING - low nutrients)

You can help with:
- Quick status checks (mention /status command)
- Navigation (mention /map, /equipment, /approvals commands)
- Farm advice and planning
- Watering recommendations (mention /water command)

Be concise and helpful. Keep responses brief for this chat bubble interface.`;

    const assistantMsgId = this.generateId();
    
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
            ...this.messages.slice(0, -1).filter(m => m.role !== "system").slice(-6).map(m => ({
              role: m.role,
              content: m.content,
            })),
            { role: "user", content: userMessage },
          ],
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`Ollama error: ${response.status}`);

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
              this.messages = this.messages.map(m => 
                m.id === assistantMsgId ? { ...m, content: fullContent } : m
              );
              this.scrollToBottom();
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      // Sync messages externally
      this.dispatchEvent(new CustomEvent("messages-updated", { 
        detail: { messages: this.messages },
        bubbles: true, 
        composed: true 
      }));

    } catch (error) {
      this.messages = this.messages.map(m => 
        m.id === assistantMsgId 
          ? { ...m, content: `Error: ${error instanceof Error ? error.message : "Connection failed"}. Try /status for quick navigation.` }
          : m
      );
    } finally {
      this.isGenerating = false;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const messagesEl = this.shadowRoot?.querySelector(".messages");
      if (messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    }, 50);
  }

  private handleExpand() {
    this.dispatchEvent(new CustomEvent("navigate-tab", { 
      detail: { tab: "farm-dashboard" },
      bubbles: true, 
      composed: true 
    }));
    this.togglePanel();
  }

  override render() {
    const totalBadge = this.pendingAutomations;

    return html`
      <!-- FAB Button -->
      <button 
        class="fab ${this.isOpen ? "open" : ""}"
        @click=${this.togglePanel}
        title="${this.isOpen ? "Close chat" : "Open farm_clawed assistant"}"
      >
        <span class="fab-icon">${this.isOpen ? "✕" : "🌱"}</span>
        ${!this.isOpen && totalBadge > 0 ? html`<span class="badge">${totalBadge}</span>` : nothing}
      </button>

      <!-- Chat Panel -->
      ${this.isOpen ? html`
        <div class="chat-panel ${this.isClosing ? "closing" : ""}">
          <!-- Header -->
          <div class="panel-header">
            <div class="panel-title">
              <span class="panel-title-icon">🌱</span>
              farm_clawed
            </div>
            <div class="header-actions">
              <div class="status-indicator">
                <span class="status-dot ${this.ollamaStatus === "online" ? "" : "offline"}"></span>
                ${this.ollamaStatus === "online" ? "Online" : "Offline"}
              </div>
              <button class="header-btn" @click=${this.handleExpand} title="Expand to full view">⤢</button>
              <button class="header-btn" @click=${this.togglePanel} title="Close">✕</button>
            </div>
          </div>

          <!-- Context Bar -->
          <div class="context-bar">
            <span>Viewing:</span>
            <span class="context-tag">${this.getTabLabel(this.currentTab)}</span>
            ${this.pendingAutomations > 0 ? html`
              <span class="context-tag" style="color: var(--accent);">
                ${this.pendingAutomations} pending
              </span>
            ` : nothing}
          </div>

          <!-- Messages or Welcome -->
          ${this.messages.length === 0 ? html`
            <div class="welcome">
              <div class="welcome-icon">🌱</div>
              <div class="welcome-title">Hey! I'm farm_clawed</div>
              <div class="welcome-subtitle">
                Your autonomous farming assistant. Ask me anything about your farm, or use quick commands below.
              </div>
            </div>
          ` : html`
            <div class="messages">
              ${this.messages.map(msg => html`
                <div class="message ${msg.role}">
                  <div class="message-avatar">
                    ${msg.role === "user" ? "👤" : "🌱"}
                  </div>
                  <div>
                    <div class="message-bubble">${msg.content}</div>
                    <div class="message-time">${this.formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              `)}
            </div>
          `}

          <!-- Quick Commands -->
          <div class="quick-commands">
            ${COMMANDS.slice(0, 4).map(cmd => html`
              <button class="quick-cmd" @click=${() => this.handleQuickCommand(cmd.command)}>
                <span>${cmd.icon}</span>
                <span>${cmd.label}</span>
              </button>
            `)}
          </div>

          <!-- Input -->
          <div class="input-area">
            <div class="input-wrapper">
              <textarea
                class="chat-input"
                placeholder="Ask anything..."
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
              >
                ${this.isGenerating ? "…" : "→"}
              </button>
            </div>
          </div>
        </div>
      ` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-chat-bubble": FarmChatBubble;
  }
}

