/**
 * Farm AI Panel - Context-Aware Assistant
 *
 * Right pane of the command center providing:
 * - Morning briefing and daily context
 * - Context-aware recommendations based on selected field
 * - Chat interface with slash commands
 * - Quick action buttons
 * - Pending approvals indicator
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { FarmField, FarmOrganization } from "./farm-command-center.js";

// Chat message interface
interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  fieldContext?: string; // Field name if context-specific
}

// Quick action definition
interface QuickAction {
  id: string;
  label: string;
  icon: string;
  command: string;
  description: string;
}

// Recommendation from AI
interface AIRecommendation {
  id: string;
  priority: "high" | "medium" | "low";
  category: "water" | "soil" | "ipm" | "operations" | "weather";
  title: string;
  description: string;
  action?: {
    label: string;
    command: string;
  };
  confidence: number; // 0-100
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "status", label: "Status", icon: "📊", command: "/status", description: "Current readings" },
  { id: "water", label: "Water", icon: "💧", command: "/water", description: "Irrigation" },
  { id: "plan", label: "Plan", icon: "📋", command: "/plan", description: "Today's tasks" },
  { id: "analyze", label: "Analyze", icon: "🔍", command: "/analyze", description: "Field analysis" },
];

@customElement("farm-ai-panel")
export class FarmAIPanel extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg, #0d0f14);
      overflow: hidden;
    }

    /* Panel Header */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--card, #151821);
      border-bottom: 1px solid var(--border, #232830);
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .ai-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, #22c55e 0%, #a3e635 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .header-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .header-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
    }

    .header-subtitle {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.5rem;
      background: var(--ok-subtle, rgba(34, 197, 94, 0.1));
      border-radius: 9999px;
      font-size: 0.65rem;
      color: var(--ok, #22c55e);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--ok, #22c55e);
      box-shadow: 0 0 6px var(--ok, #22c55e);
    }

    /* Context Card */
    .context-card {
      margin: 0.75rem;
      padding: 1rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 10px;
      flex-shrink: 0;
    }

    .context-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .context-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
    }

    .context-badge {
      padding: 0.125rem 0.375rem;
      background: var(--accent-subtle, rgba(59, 130, 246, 0.15));
      border-radius: 4px;
      font-size: 0.65rem;
      color: var(--accent, #3b82f6);
    }

    .field-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.65rem;
      color: var(--muted, #71717a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
    }

    .stat-value.warning {
      color: var(--warn, #f59e0b);
    }

    .stat-value.critical {
      color: var(--danger, #ef4444);
    }

    /* Recommendations */
    .recommendations {
      margin: 0 0.75rem;
      flex-shrink: 0;
    }

    .rec-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    .rec-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted, #71717a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .rec-count {
      font-size: 0.7rem;
      color: var(--accent, #3b82f6);
    }

    .rec-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .rec-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .rec-item:hover {
      background: var(--bg-hover, #1f242f);
      border-color: var(--border-hover, #404040);
    }

    .rec-item.high {
      border-left: 3px solid var(--danger, #ef4444);
    }

    .rec-item.medium {
      border-left: 3px solid var(--warn, #f59e0b);
    }

    .rec-item.low {
      border-left: 3px solid var(--info, #3b82f6);
    }

    .rec-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .rec-content {
      flex: 1;
      min-width: 0;
    }

    .rec-name {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
      margin-bottom: 0.25rem;
    }

    .rec-desc {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      line-height: 1.4;
    }

    .rec-action {
      padding: 0.25rem 0.5rem;
      background: var(--accent-subtle, rgba(59, 130, 246, 0.15));
      border: none;
      border-radius: 4px;
      color: var(--accent, #3b82f6);
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.15s ease;
      margin-top: 0.5rem;
    }

    .rec-action:hover {
      background: var(--accent, #3b82f6);
      color: white;
    }

    /* Chat Area */
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin: 0.75rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 10px;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
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

    .message-avatar {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .message.assistant .message-avatar {
      background: linear-gradient(135deg, #22c55e 0%, #a3e635 100%);
    }

    .message.user .message-avatar {
      background: var(--accent, #3b82f6);
    }

    .message-content {
      padding: 0.625rem 0.875rem;
      border-radius: 10px;
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .message.assistant .message-content {
      background: var(--bg-elevated, #1a1e27);
      color: var(--text, #e4e4e7);
      border-bottom-left-radius: 4px;
    }

    .message.user .message-content {
      background: var(--accent, #3b82f6);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-context {
      font-size: 0.65rem;
      color: var(--muted, #71717a);
      margin-top: 0.25rem;
    }

    /* Empty State */
    .empty-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      opacity: 0.6;
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-strong, #f4f4f5);
      margin-bottom: 0.5rem;
    }

    .empty-desc {
      font-size: 0.85rem;
      color: var(--muted, #71717a);
      max-width: 280px;
      line-height: 1.5;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      border-top: 1px solid var(--border, #232830);
      overflow-x: auto;
    }

    .quick-action {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-elevated, #1a1e27);
      border: 1px solid var(--border, #232830);
      border-radius: 8px;
      color: var(--text, #e4e4e7);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .quick-action:hover {
      background: var(--bg-hover, #1f242f);
      border-color: var(--accent, #3b82f6);
    }

    .quick-action-icon {
      font-size: 0.9rem;
    }

    /* Input Area */
    .input-area {
      padding: 0.75rem;
      border-top: 1px solid var(--border, #232830);
      background: var(--bg, #0d0f14);
      flex-shrink: 0;
    }

    .input-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .input-field {
      flex: 1;
      padding: 0.75rem 1rem;
      background: var(--card, #151821);
      border: 1px solid var(--border, #232830);
      border-radius: 10px;
      color: var(--text, #e4e4e7);
      font-size: 0.9rem;
      resize: none;
      min-height: 44px;
      max-height: 120px;
      font-family: inherit;
    }

    .input-field::placeholder {
      color: var(--muted, #71717a);
    }

    .input-field:focus {
      outline: none;
      border-color: var(--accent, #3b82f6);
    }

    .send-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent, #3b82f6);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .send-btn:hover {
      background: #2563eb;
      transform: scale(1.05);
    }

    .send-btn:disabled {
      background: var(--muted, #71717a);
      cursor: not-allowed;
      transform: none;
    }

    /* Approvals Banner */
    .approvals-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 0 0.75rem 0.5rem;
      padding: 0.625rem 0.875rem;
      background: var(--warn-subtle, rgba(245, 158, 11, 0.1));
      border: 1px solid var(--warn, #f59e0b);
      border-radius: 8px;
    }

    .approvals-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .approvals-icon {
      font-size: 1rem;
    }

    .approvals-text {
      font-size: 0.8rem;
      color: var(--warn, #f59e0b);
    }

    .approvals-btn {
      padding: 0.375rem 0.625rem;
      background: var(--warn, #f59e0b);
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .approvals-btn:hover {
      background: #d97706;
    }
  `;

  @property({ type: Object })
  selectedField: FarmField | null = null;

  @property({ type: Object })
  organization: FarmOrganization | null = null;

  @property({ type: Number })
  pendingApprovals = 0;

  @state()
  private messages: AIMessage[] = [];

  @state()
  private inputValue = "";

  @state()
  private isGenerating = false;

  @state()
  private recommendations: AIRecommendation[] = [
    {
      id: "1",
      priority: "high",
      category: "water",
      title: "Irrigation Recommended",
      description: "Soil moisture below threshold in selected field. Consider watering within 24 hours.",
      action: { label: "Schedule", command: "/water" },
      confidence: 92,
    },
    {
      id: "2",
      priority: "medium",
      category: "ipm",
      title: "Scout for Pests",
      description: "Weather conditions favor pest activity. Weekly IPM walk recommended.",
      action: { label: "View IPM", command: "/ipm" },
      confidence: 78,
    },
  ];

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      water: "💧",
      soil: "🌱",
      ipm: "🐛",
      operations: "🚜",
      weather: "🌤️",
    };
    return icons[category] || "📋";
  }

  private handleSend() {
    if (!this.inputValue.trim() || this.isGenerating) return;

    const userMessage: AIMessage = {
      id: this.generateId(),
      role: "user",
      content: this.inputValue.trim(),
      timestamp: new Date().toISOString(),
      fieldContext: this.selectedField?.name,
    };

    this.messages = [...this.messages, userMessage];
    this.inputValue = "";
    this.isGenerating = true;

    // Simulate AI response
    setTimeout(() => {
      const contextInfo = this.selectedField
        ? `Based on ${this.selectedField.name}'s current status`
        : "Based on your farm's overall status";

      const aiMessage: AIMessage = {
        id: this.generateId(),
        role: "assistant",
        content: `${contextInfo}, I recommend checking soil moisture levels. The recent weather patterns suggest increased evaporation rates. Would you like me to analyze the sensor data in detail?`,
        timestamp: new Date().toISOString(),
        fieldContext: this.selectedField?.name,
      };

      this.messages = [...this.messages, aiMessage];
      this.isGenerating = false;
    }, 1500);
  }

  private handleQuickAction(action: QuickAction) {
    this.dispatchEvent(
      new CustomEvent("command", {
        detail: { command: action.command, fieldId: this.selectedField?.id },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  private renderContextCard() {
    if (!this.selectedField) {
      return html`
        <div class="context-card">
          <div class="context-header">
            <span class="context-title">
              🌍 Farm Overview
            </span>
          </div>
          <div class="field-stats">
            <div class="stat-item">
              <span class="stat-label">Total Fields</span>
              <span class="stat-value">${this.organization?.fields.length ?? 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Needing Attention</span>
              <span class="stat-value warning">
                ${this.organization?.fields.filter((f) => f.status === "warning" || f.status === "critical").length ?? 0}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Sync Status</span>
              <span class="stat-value">Active</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Source</span>
              <span class="stat-value">${this.organization?.source ?? "Manual"}</span>
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="context-card">
        <div class="context-header">
          <span class="context-title">
            📍 ${this.selectedField.name}
            <span class="context-badge">${this.selectedField.status}</span>
          </span>
        </div>
        <div class="field-stats">
          <div class="stat-item">
            <span class="stat-label">Area</span>
            <span class="stat-value">${this.selectedField.area} ${this.selectedField.areaUnit}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Crop</span>
            <span class="stat-value">${this.selectedField.cropType ?? "—"}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Last Operation</span>
            <span class="stat-value">${this.selectedField.lastOperation ?? "—"}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Source</span>
            <span class="stat-value">${this.selectedField.source ?? "manual"}</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderRecommendations() {
    if (this.recommendations.length === 0) return nothing;

    return html`
      <div class="recommendations">
        <div class="rec-header">
          <span class="rec-title">AI Recommendations</span>
          <span class="rec-count">${this.recommendations.length} active</span>
        </div>
        <div class="rec-list">
          ${this.recommendations.slice(0, 3).map(
            (rec) => html`
              <div
                class="rec-item ${rec.priority}"
                @click=${() => rec.action && this.handleQuickAction({ id: rec.id, label: rec.action.label, icon: "", command: rec.action.command, description: "" })}
              >
                <span class="rec-icon">${this.getCategoryIcon(rec.category)}</span>
                <div class="rec-content">
                  <div class="rec-name">${rec.title}</div>
                  <div class="rec-desc">${rec.description}</div>
                  ${rec.action
                    ? html`
                        <button class="rec-action">${rec.action.label} →</button>
                      `
                    : nothing}
                </div>
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  private renderMessages() {
    if (this.messages.length === 0) {
      return html`
        <div class="empty-chat">
          <span class="empty-icon">🌱</span>
          <div class="empty-title">AI Farm Assistant</div>
          <div class="empty-desc">
            Ask me anything about your fields, get recommendations, or use quick actions below.
            ${this.selectedField
              ? `Currently viewing: ${this.selectedField.name}`
              : "Select a field on the map for context-aware help."}
          </div>
        </div>
      `;
    }

    return this.messages.map(
      (msg) => html`
        <div class="message ${msg.role}">
          <div class="message-avatar">
            ${msg.role === "assistant" ? "🌱" : "👤"}
          </div>
          <div>
            <div class="message-content">${msg.content}</div>
            ${msg.fieldContext
              ? html`<div class="message-context">Context: ${msg.fieldContext}</div>`
              : nothing}
          </div>
        </div>
      `,
    );
  }

  override render() {
    return html`
      <div class="panel-header">
        <div class="header-left">
          <div class="ai-avatar">🌱</div>
          <div class="header-info">
            <span class="header-title">Farm AI</span>
            <span class="header-subtitle">
              ${this.selectedField ? `Viewing: ${this.selectedField.name}` : "Farm overview"}
            </span>
          </div>
        </div>
        <div class="status-indicator">
          <span class="status-dot"></span>
          Online
        </div>
      </div>

      ${this.pendingApprovals > 0
        ? html`
            <div class="approvals-banner">
              <div class="approvals-info">
                <span class="approvals-icon">⚡</span>
                <span class="approvals-text">${this.pendingApprovals} pending approval${this.pendingApprovals > 1 ? "s" : ""}</span>
              </div>
              <button
                class="approvals-btn"
                @click=${() =>
                  this.dispatchEvent(
                    new CustomEvent("command", { detail: { command: "/approvals" }, bubbles: true, composed: true }),
                  )}
              >
                Review
              </button>
            </div>
          `
        : nothing}

      ${this.renderContextCard()}
      ${this.renderRecommendations()}

      <div class="chat-area">
        <div class="chat-messages">
          ${this.renderMessages()}
          ${this.isGenerating
            ? html`
                <div class="message assistant">
                  <div class="message-avatar">🌱</div>
                  <div class="message-content">Thinking...</div>
                </div>
              `
            : nothing}
        </div>

        <div class="quick-actions">
          ${QUICK_ACTIONS.map(
            (action) => html`
              <button
                class="quick-action"
                @click=${() => this.handleQuickAction(action)}
                title=${action.description}
              >
                <span class="quick-action-icon">${action.icon}</span>
                ${action.label}
              </button>
            `,
          )}
        </div>
      </div>

      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            class="input-field"
            placeholder="${this.selectedField
              ? `Ask about ${this.selectedField.name}...`
              : "Ask about your farm..."}"
            .value=${this.inputValue}
            @input=${(e: Event) => (this.inputValue = (e.target as HTMLTextAreaElement).value)}
            @keydown=${this.handleKeyDown}
            rows="1"
            ?disabled=${this.isGenerating}
          ></textarea>
          <button
            class="send-btn"
            @click=${this.handleSend}
            ?disabled=${!this.inputValue.trim() || this.isGenerating}
          >
            →
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "farm-ai-panel": FarmAIPanel;
  }
}

