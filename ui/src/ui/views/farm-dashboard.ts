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
import type {
  SensorReading,
  AutomationProposal,
  EquipmentItem,
  FarmCard,
} from "./farm-chat-cards.js";

// Chat message with optional rich cards
export interface FarmChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  cards?: FarmCard[];
}

// Daily context interfaces
export interface WeatherData {
  high: number;
  low: number;
  current: number;
  condition: string;
  rain: number; // probability %
  wind: number; // mph
  humidity: number;
  sunrise: string;
  sunset: string;
}

export interface DailyTask {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  category: "water" | "soil" | "ipm" | "harvest" | "maintenance" | "observation";
  reason: string; // AI-generated reasoning
  command?: string; // Slash command to execute
  completed: boolean;
  dueTime?: string;
}

export interface DailyAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  timestamp: string;
  actionCommand?: string;
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
    
    .provider-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .provider-select {
      padding: 0.375rem 0.625rem;
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 6px;
      color: var(--text, #e4e4e7);
      font-size: 0.75rem;
      cursor: pointer;
    }
    
    .provider-select:focus {
      outline: none;
      border-color: var(--ok, #22c55e);
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
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
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
    
    .typing-dots span:nth-child(1) {
      animation-delay: 0s;
    }
    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }
    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%,
      60%,
      100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-4px);
      }
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
    
    /* Settings Modal */
    .settings-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .settings-modal {
      background: var(--card, #181b22);
      border: 1px solid var(--border, #27272a);
      border-radius: 12px;
      width: 400px;
      max-width: 90vw;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    
    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .settings-header h3 {
      margin: 0;
      font-size: 1rem;
      color: var(--text-strong, #fafafa);
    }
    
    .close-btn {
      background: transparent;
      border: none;
      color: var(--muted, #71717a);
      cursor: pointer;
      font-size: 1.25rem;
      padding: 0.25rem;
    }
    
    .close-btn:hover {
      color: var(--text, #e4e4e7);
    }
    
    .settings-content {
      padding: 1.25rem;
    }
    
    .settings-section {
      margin-bottom: 1.25rem;
    }
    
    .settings-section:last-child {
      margin-bottom: 0;
    }
    
    .settings-label {
      display: block;
      font-size: 0.8rem;
      color: var(--muted, #71717a);
      margin-bottom: 0.5rem;
    }
    
    .settings-select,
    .settings-input {
      width: 100%;
      padding: 0.625rem 0.875rem;
      background: var(--bg, #12141a);
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      color: var(--text, #e4e4e7);
      font-size: 0.875rem;
    }
    
    .settings-select:focus,
    .settings-input:focus {
      outline: none;
      border-color: var(--ok, #22c55e);
    }
    
    .settings-btn {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--ok, #22c55e);
      border: none;
      border-radius: 6px;
      color: #000;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
    }
    
    .settings-btn:hover {
      background: #16a34a;
    }
    
    .status-list {
      background: var(--bg, #12141a);
      border: 1px solid var(--border, #27272a);
      border-radius: 8px;
      padding: 0.75rem;
    }
    
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.375rem 0;
      font-size: 0.8rem;
      color: var(--text, #e4e4e7);
    }
    
    .status-value {
      font-weight: 500;
    }
    
    .status-value.online {
      color: var(--ok, #22c55e);
    }
    
    .status-value.offline {
      color: var(--danger, #ef4444);
    }
    
    .status-value.loading {
      color: var(--warn, #f59e0b);
    }
    
    .settings-divider {
      height: 1px;
      background: var(--border, #27272a);
      margin: 1rem 0;
    }
    
    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }
    
    .toggle-row span {
      font-size: 0.85rem;
      color: var(--text, #e4e4e7);
    }
    
    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    
    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--border, #27272a);
      transition: 0.3s;
      border-radius: 24px;
    }
    
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
    
    .toggle input:checked + .toggle-slider {
      background-color: var(--ok, #22c55e);
    }
    
    .toggle input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }
    
    .settings-hint {
      margin-top: 0.5rem;
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .settings-hint a {
      color: var(--accent, #ff5c5c);
      text-decoration: none;
    }
    
    .settings-hint a:hover {
      text-decoration: underline;
    }
    
    /* Daily Command Center Layout */
    .daily-command-center {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .weather-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, var(--card, #181b22) 0%, var(--bg, #12141a) 100%);
      border-bottom: 1px solid var(--border, #27272a);
      flex-shrink: 0;
    }
    
    .date-section {
      display: flex;
      flex-direction: column;
    }
    
    .date-primary {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .date-secondary {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .weather-quick {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }
    
    .weather-temp {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .temp-current {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .temp-range {
      display: flex;
      flex-direction: column;
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .weather-condition {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.85rem;
      color: var(--text, #e4e4e7);
    }
    
    .weather-metric {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--muted, #71717a);
      padding: 0.25rem 0.5rem;
      background: var(--bg, #12141a);
      border-radius: 4px;
    }
    
    /* Main content area with context panel */
    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    
    /* Collapsible Context Panel */
    .context-panel {
      width: 280px;
      background: var(--card, #181b22);
      border-right: 1px solid var(--border, #27272a);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex-shrink: 0;
      transition: width 0.3s ease, min-width 0.3s ease;
    }
    
    .context-panel.collapsed {
      width: 48px;
      min-width: 48px;
    }
    
    .context-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .context-panel-title {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted, #71717a);
    }
    
    .context-panel.collapsed .context-panel-title {
      display: none;
    }
    
    .collapse-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid var(--border, #27272a);
      border-radius: 6px;
      color: var(--muted, #71717a);
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.15s ease;
    }
    
    .collapse-btn:hover {
      background: var(--bg-hover, #262a35);
      color: var(--text, #e4e4e7);
    }
    
    .context-section {
      padding: 1rem;
      border-bottom: 1px solid var(--border, #27272a);
    }
    
    .context-panel.collapsed .context-section {
      padding: 0.5rem;
    }
    
    .context-section-title {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted, #71717a);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .context-panel.collapsed .context-section-title span {
      display: none;
    }
    
    .quick-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }
    
    .quick-stat-label {
      font-size: 0.8rem;
      color: var(--text, #e4e4e7);
    }
    
    .quick-stat-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .quick-stat-value.warning {
      color: var(--warn, #f59e0b);
    }
    
    .quick-stat-value.critical {
      color: var(--danger, #ef4444);
    }
    
    .quick-stat-value.ok {
      color: var(--ok, #22c55e);
    }
    
    .context-panel.collapsed .quick-stat {
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .context-panel.collapsed .quick-stat-label {
      display: none;
    }
    
    /* Task List in Context Panel */
    .task-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }
    
    .task-item:hover {
      background: var(--bg-hover, #262a35);
      border-color: var(--accent, #ff5c5c);
    }
    
    .task-item.completed {
      opacity: 0.5;
    }
    
    .task-priority {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      margin-top: 0.375rem;
      flex-shrink: 0;
    }
    
    .task-priority.high {
      background: var(--danger, #ef4444);
      box-shadow: 0 0 8px var(--danger, #ef4444);
    }
    
    .task-priority.medium {
      background: var(--warn, #f59e0b);
    }
    
    .task-priority.low {
      background: var(--ok, #22c55e);
    }
    
    .task-content {
      flex: 1;
      min-width: 0;
    }
    
    .task-title {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
      margin-bottom: 0.25rem;
    }
    
    .task-reason {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      line-height: 1.4;
    }
    
    .task-category {
      font-size: 0.6rem;
      padding: 0.125rem 0.375rem;
      background: var(--accent-subtle, rgba(255, 92, 92, 0.15));
      color: var(--accent, #ff5c5c);
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    
    .context-panel.collapsed .task-item {
      padding: 0.5rem;
      justify-content: center;
    }
    
    .context-panel.collapsed .task-content,
    .context-panel.collapsed .task-category {
      display: none;
    }
    
    /* Alert List in Context Panel */
    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.625rem;
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .alert-item.warning {
      background: var(--warn-subtle, rgba(245, 158, 11, 0.12));
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .alert-item.critical {
      background: var(--danger-subtle, rgba(239, 68, 68, 0.12));
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .alert-item.info {
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
    
    .alert-item:hover {
      transform: translateX(2px);
    }
    
    .alert-icon {
      font-size: 0.9rem;
      flex-shrink: 0;
    }
    
    .alert-text {
      flex: 1;
      min-width: 0;
    }
    
    .alert-title {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .alert-message {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
      margin-top: 0.125rem;
    }
    
    .context-panel.collapsed .alert-text {
      display: none;
    }
    
    /* Chat area takes remaining space */
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0;
    }
    
    /* Morning Briefing Card */
    .briefing-card {
      background: linear-gradient(135deg, var(--card, #181b22) 0%, rgba(255, 92, 92, 0.05) 100%);
      border: 1px solid var(--accent, #ff5c5c);
      border-radius: var(--radius-lg, 12px);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    
    .briefing-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: var(--accent-subtle, rgba(255, 92, 92, 0.08));
    }
    
    .briefing-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-strong, #fafafa);
    }
    
    .briefing-time {
      font-size: 0.7rem;
      color: var(--muted, #71717a);
    }
    
    .briefing-body {
      padding: 1.25rem;
    }
    
    .briefing-summary {
      font-size: 0.95rem;
      color: var(--text, #e4e4e7);
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .briefing-priorities {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .briefing-priority {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg, #12141a);
      border-radius: var(--radius-md, 8px);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    
    .briefing-priority:hover {
      background: var(--bg-hover, #262a35);
      transform: translateX(4px);
    }
    
    .priority-icon {
      font-size: 1.25rem;
    }
    
    .priority-text {
      flex: 1;
    }
    
    .priority-main {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text, #e4e4e7);
    }
    
    .priority-sub {
      font-size: 0.75rem;
      color: var(--muted, #71717a);
    }
    
    .priority-action {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      background: var(--accent, #ff5c5c);
      color: white;
      border-radius: 4px;
    }
    
    /* Responsive: hide context panel on mobile */
    @media (max-width: 768px) {
      .context-panel {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      
      .context-panel.open {
        transform: translateX(0);
      }
      
      .context-panel.collapsed {
        width: 280px;
      }
      
      .weather-strip {
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      
      .weather-quick {
        flex-wrap: wrap;
        gap: 0.75rem;
      }
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
  openaiStatus: "online" | "offline" | "loading" = "loading";

  @property({ type: String })
  ollamaModel = "llama3.2:latest";

  @property({ type: String })
  openaiModel = "gpt-4o";

  @property({ type: String })
  openaiApiKey = "";

  @state()
  private aiProvider: "ollama" | "openai" | "auto" = "auto";

  @state()
  private showSettings = false;

  @state()
  private iftttKey = "";

  @state()
  private iftttEnabled = false;

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

  // Daily Command Center state
  @state()
  private showDailyContext = true;

  @state()
  private weatherData: WeatherData = {
    high: 72,
    low: 54,
    current: 63,
    condition: "Partly Cloudy",
    rain: 10,
    wind: 5,
    humidity: 65,
    sunrise: "6:42 AM",
    sunset: "7:18 PM",
  };

  @state()
  private dailyTasks: DailyTask[] = [];

  @state()
  private activeAlerts: DailyAlert[] = [];

  @state()
  private briefingGenerated = false;

  override connectedCallback() {
    super.connectedCallback();
    this.checkOllamaStatus();
    this.checkOpenAIStatus();
    this.loadIftttSettings();
    this.initializeDailyContext();
  }

  private initializeDailyContext() {
    // Initialize daily tasks with AI-generated reasoning
    this.dailyTasks = [
      {
        id: "task-1",
        title: "Water Meyer Lemon Tree",
        priority: "high",
        category: "water",
        reason: "Soil moisture at 17% - below optimal 30-60% range. Morning watering recommended before heat peaks.",
        command: "/water",
        completed: false,
        dueTime: "Before 10 AM",
      },
      {
        id: "task-2",
        title: "Check soil EC levels",
        priority: "medium",
        category: "soil",
        reason: "EC reading 0.001 mS/cm indicates low nutrients. May need fertilization soon.",
        command: "/status",
        completed: false,
      },
      {
        id: "task-3",
        title: "Inspect for pests",
        priority: "low",
        category: "ipm",
        reason: "Weekly IPM inspection due. Citrus trees can attract aphids in warming weather.",
        completed: false,
      },
    ];

    // Initialize alerts based on current conditions
    this.activeAlerts = [
      {
        id: "alert-1",
        severity: "warning",
        title: "Low Soil Moisture",
        message: "Lemon tree needs water - 17% moisture",
        timestamp: new Date().toISOString(),
        actionCommand: "/water",
      },
    ];

    // Generate morning briefing after a short delay (simulates AI processing)
    if (!this.briefingGenerated) {
      setTimeout(() => this.generateMorningBriefing(), 500);
    }
  }

  private generateMorningBriefing() {
    if (this.briefingGenerated || this.messages.length > 0) return;

    const now = new Date();
    const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
    const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    // Generate contextual briefing based on current data
    const moistureStatus = "17%";
    const tempStatus = "54.5°F";
    const hasPendingActions = this.dailyTasks.filter((t) => !t.completed && t.priority === "high").length > 0;

    const briefingContent = `${greeting}! Here's your farm briefing for ${dateStr}.

**Today's Priority:** Your Meyer Lemon Tree needs attention - soil moisture is low at ${moistureStatus}. I recommend watering this morning before temperatures rise.

**Conditions:** Currently ${this.weatherData.current}°F with ${this.weatherData.condition.toLowerCase()}. Expected high of ${this.weatherData.high}°F, low of ${this.weatherData.low}°F. ${this.weatherData.rain > 20 ? `${this.weatherData.rain}% chance of rain later.` : "No rain expected."}

**What needs your attention:**`;

    const priorityCards: FarmCard[] = [
      {
        type: "sensor",
        assetName: "Meyer Lemon Tree",
        data: [
          { id: "1", label: "Moisture", value: moistureStatus, status: "warning", icon: "💧" },
          { id: "2", label: "Temperature", value: tempStatus, status: "normal", icon: "🌡️" },
          { id: "3", label: "EC", value: "0.001 mS/cm", status: "warning", icon: "🌱" },
          { id: "4", label: "Battery", value: "57%", status: "normal", icon: "🔋" },
        ],
      },
    ];

    // Add automation proposal if there's a high priority task
    if (hasPendingActions) {
      priorityCards.push({
        type: "automation",
        proposal: {
          id: "briefing-auto-1",
          type: "water",
          action: "Water Meyer Lemon Tree for 2 minutes",
          target: "Meyer Lemon Tree",
          reason: "Soil moisture at 17% is critically low. Watering now prevents stress and promotes healthy growth.",
          confidence: 94,
          estimatedImpact: "~1.0 gallon",
          expiresIn: "45 min",
        },
      });
    }

    this.messages = [
      {
        id: this.generateId(),
        role: "assistant",
        content: briefingContent,
        timestamp: new Date().toISOString(),
        cards: priorityCards,
      },
    ];

    this.briefingGenerated = true;
    this.scrollToBottom();
  }

  private handleTaskClick(task: DailyTask) {
    if (task.command) {
      this.executeCommand(task.command);
    } else {
      // If no command, add a chat message about the task
      this.messages = [
        ...this.messages,
        {
          id: this.generateId(),
          role: "user",
          content: `Tell me about: ${task.title}`,
          timestamp: new Date().toISOString(),
        },
      ];
      this.callAI(`Help me with this task: ${task.title}. Context: ${task.reason}`);
    }
  }

  private handleAlertClick(alert: DailyAlert) {
    if (alert.actionCommand) {
      this.executeCommand(alert.actionCommand);
    }
  }

  private toggleContextPanel() {
    this.showDailyContext = !this.showDailyContext;
  }

  private getFormattedDate(): { primary: string; secondary: string } {
    const now = new Date();
    return {
      primary: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
      secondary: now.toLocaleDateString("en-US", { year: "numeric" }),
    };
  }

  private getWeatherIcon(condition: string): string {
    const lower = condition.toLowerCase();
    if (lower.includes("rain")) return "🌧️";
    if (lower.includes("cloud")) return "⛅";
    if (lower.includes("sun") || lower.includes("clear")) return "☀️";
    if (lower.includes("storm")) return "⛈️";
    if (lower.includes("snow")) return "❄️";
    if (lower.includes("fog")) return "🌫️";
    return "🌤️";
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      water: "💧",
      soil: "🌱",
      ipm: "🐛",
      harvest: "🍋",
      maintenance: "🔧",
      observation: "👁️",
    };
    return icons[category] || "📋";
  }

  private getAlertIcon(severity: string): string {
    switch (severity) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚡";
      default:
        return "ℹ️";
    }
  }

  private loadIftttSettings() {
    const savedKey = localStorage.getItem("farm_clawed_ifttt_key") || "";
    const savedEnabled = localStorage.getItem("farm_clawed_ifttt_enabled") === "true";
    this.iftttKey = savedKey;
    this.iftttEnabled = savedEnabled && !!savedKey;
  }

  private saveIftttSettings() {
    localStorage.setItem("farm_clawed_ifttt_key", this.iftttKey);
    localStorage.setItem("farm_clawed_ifttt_enabled", this.iftttEnabled ? "true" : "false");
  }

  private async executeIftttWebhook(
    eventName: string,
    values: { value1?: string; value2?: string; value3?: string },
  ) {
    if (!this.iftttKey) return;

    const url = `https://maker.ifttt.com/trigger/${eventName}/with/key/${this.iftttKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        this.messages = [
          ...this.messages,
          {
            id: this.generateId(),
            role: "assistant",
            content: `✓ IFTTT webhook "${eventName}" triggered successfully!`,
            timestamp: new Date().toISOString(),
          },
        ];
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.messages = [
        ...this.messages,
        {
          id: this.generateId(),
          role: "assistant",
          content: `⚠️ Failed to trigger IFTTT webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
        },
      ];
    }
    this.scrollToBottom();
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

  private async checkOpenAIStatus() {
    // Check if we have an API key (passed as prop or from env)
    if (this.openaiApiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${this.openaiApiKey}` },
        });
        this.openaiStatus = response.ok ? "online" : "offline";
      } catch {
        this.openaiStatus = "offline";
      }
    } else {
      this.openaiStatus = "offline";
    }
  }

  private getActiveProvider(): "ollama" | "openai" {
    if (this.aiProvider === "auto") {
      // Prefer OpenAI if available, fallback to Ollama
      if (this.openaiStatus === "online") return "openai";
      if (this.ollamaStatus === "online") return "ollama";
      return "ollama"; // Default to Ollama even if offline
    }
    return this.aiProvider;
  }

  private getProviderStatus(): "online" | "offline" | "loading" {
    const provider = this.getActiveProvider();
    return provider === "openai" ? this.openaiStatus : this.ollamaStatus;
  }

  private get filteredCommands(): SlashCommand[] {
    if (!this.inputValue.startsWith("/")) return [];
    const query = this.inputValue.slice(1).toLowerCase();
    return COMMANDS.filter((c) => c.command.slice(1).startsWith(query));
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
        this.selectedCommandIndex = Math.min(
          this.selectedCommandIndex + 1,
          this.filteredCommands.length - 1,
        );
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
    this.messages = [
      ...this.messages,
      {
        id: this.generateId(),
        role: "user",
        content: command,
        timestamp: now,
      },
    ];

    // Generate response based on command
    setTimeout(() => {
      let responseContent = "";
      let cards: FarmCard[] = [];

      switch (cmd) {
        case "/status":
          responseContent = "Here's the current status of your Meyer Lemon Tree:";
          cards = [
            {
              type: "sensor",
              assetName: "Meyer Lemon Tree",
              data: [
                {
                  id: "1",
                  label: "Moisture",
                  value: "17",
                  unit: "%",
                  status: "warning",
                  icon: "💧",
                },
                {
                  id: "2",
                  label: "Temperature",
                  value: "54.5",
                  unit: "°F",
                  status: "normal",
                  icon: "🌡️",
                },
                {
                  id: "3",
                  label: "EC",
                  value: "0.001",
                  unit: " mS/cm",
                  status: "warning",
                  icon: "🌱",
                },
                { id: "4", label: "Battery", value: "57", unit: "%", status: "normal", icon: "🔋" },
              ],
            },
          ];
          break;

        case "/map":
          responseContent = "Here's your farm map:";
          cards = [
            {
              type: "map",
              context: { ...this.mapContext, hasZones: true, assetCount: 5 },
              assets: this.assets,
            },
          ];
          break;

        case "/water":
          responseContent =
            "Based on the current moisture level (17%), I recommend watering your lemon tree. Here's my proposal:";
          cards = [
            {
              type: "automation",
              proposal: {
                id: "auto-1",
                type: "water",
                action: "Water Meyer Lemon Tree for 2 minutes",
                target: "Meyer Lemon Tree",
                reason:
                  "Soil moisture at 17% is below the optimal 30-60% range. Watering now will prevent stress.",
                confidence: 92,
                estimatedImpact: "~1.0 gallon",
                expiresIn: "45 min",
              },
            },
          ];
          break;

        case "/equipment":
          responseContent = "Here's the status of your farm equipment:";
          cards = [
            {
              type: "equipment",
              devices: [
                { id: "hub-1", name: "SmartLife Hub", type: "hub", status: "online" },
                {
                  id: "sensor-1",
                  name: "Lemon Soil Sensor",
                  type: "sensor",
                  status: "online",
                  metric: "57% battery",
                },
                { id: "valve-1", name: "Water Valve", type: "valve", status: "offline" },
              ],
            },
          ];
          break;

        case "/approvals":
          responseContent = "You have 1 pending automation that needs approval:";
          cards = [
            {
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
            },
          ];
          break;

        default:
          responseContent =
            "I didn't recognize that command. Try /status, /map, /water, /equipment, or /approvals.";
      }

      this.messages = [
        ...this.messages,
        {
          id: this.generateId(),
          role: "assistant",
          content: responseContent,
          timestamp: new Date().toISOString(),
          cards: cards.length > 0 ? cards : undefined,
        },
      ];

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
    this.messages = [
      ...this.messages,
      {
        id: this.generateId(),
        role: "user",
        content,
        timestamp: now,
      },
    ];

    this.inputValue = "";
    this.dispatchEvent(new CustomEvent("chat-message", { detail: { message: content } }));

    // Call AI for response
    await this.callAI(content);
  }

  private async callAI(userMessage: string) {
    const provider = this.getActiveProvider();
    const status = this.getProviderStatus();

    if (status === "offline") {
      const providerName = provider === "openai" ? "OpenAI" : "Ollama";
      this.messages = [
        ...this.messages,
        {
          id: this.generateId(),
          role: "assistant",
          content: `⚠️ ${providerName} is not available. ${provider === "openai" ? "Check your API key." : "Please start Ollama."} You can still use commands like /status, /map, /water, /equipment.`,
          timestamp: new Date().toISOString(),
        },
      ];
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
    this.messages = [
      ...this.messages,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      },
    ];
    this.scrollToBottom();

    try {
      const provider = this.getActiveProvider();
      let response: Response;

      const chatMessages = [
        { role: "system", content: farmContext },
        ...this.messages
          .slice(0, -1)
          .filter((m) => m.role !== "system")
          .slice(-10)
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
        { role: "user", content: userMessage },
      ];

      if (provider === "openai") {
        // OpenAI API call
        response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: this.openaiModel,
            messages: chatMessages,
            stream: true,
          }),
        });
      } else {
        // Ollama API call
        response = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.ollamaModel,
            messages: chatMessages,
            stream: true,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`${provider} error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            // Handle OpenAI SSE format (data: {json})
            let jsonStr = line;
            if (line.startsWith("data: ")) {
              jsonStr = line.slice(6);
              if (jsonStr === "[DONE]") continue;
            }

            const json = JSON.parse(jsonStr);

            // Extract content based on provider format
            let contentDelta = "";
            if (provider === "openai") {
              // OpenAI format: choices[0].delta.content
              contentDelta = json.choices?.[0]?.delta?.content || "";
            } else {
              // Ollama format: message.content
              contentDelta = json.message?.content || "";
            }

            if (contentDelta) {
              fullContent += contentDelta;
              // Update the message in place
              this.messages = this.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: fullContent } : m,
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

      if (
        lowerContent.includes("water") ||
        lowerContent.includes("moisture") ||
        lowerContent.includes("dry") ||
        lowerContent.includes("thirsty")
      ) {
        cards = [
          {
            type: "sensor",
            assetName: "Meyer Lemon Tree",
            data: [
              { id: "1", label: "Moisture", value: "17", unit: "%", status: "warning", icon: "💧" },
              {
                id: "2",
                label: "Temperature",
                value: "54.5",
                unit: "°F",
                status: "normal",
                icon: "🌡️",
              },
            ],
          },
        ];
      } else if (
        lowerContent.includes("equipment") ||
        lowerContent.includes("device") ||
        lowerContent.includes("sensor")
      ) {
        cards = [
          {
            type: "equipment",
            devices: [
              { id: "hub-1", name: "SmartLife Hub", type: "hub", status: "online" },
              {
                id: "sensor-1",
                name: "Lemon Soil Sensor",
                type: "sensor",
                status: "online",
                metric: "57% battery",
              },
              { id: "valve-1", name: "Water Valve", type: "valve", status: "offline" },
            ],
          },
        ];
      }

      if (cards.length > 0) {
        this.messages = this.messages.map((m) => (m.id === assistantMsgId ? { ...m, cards } : m));
      }
    } catch (error) {
      console.error("Ollama error:", error);
      this.messages = this.messages.map((m) =>
        m.id === assistantMsgId
          ? {
              ...m,
              content: `⚠️ Error connecting to Ollama: ${error instanceof Error ? error.message : "Unknown error"}. Make sure Ollama is running with \`ollama serve\`.`,
            }
          : m,
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
    this.messages = [
      ...this.messages,
      {
        id: this.generateId(),
        role: "assistant",
        content: "✅ Automation approved! Watering will begin shortly.",
        timestamp: new Date().toISOString(),
      },
    ];
  }

  private handleReject(e: CustomEvent) {
    this.dispatchEvent(new CustomEvent("reject-automation", { detail: e.detail }));
    this.messages = [
      ...this.messages,
      {
        id: this.generateId(),
        role: "assistant",
        content: "Automation rejected. Let me know if you'd like different recommendations.",
        timestamp: new Date().toISOString(),
      },
    ];
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
      case "daily-briefing":
        return html`
          <farm-chat-briefing-card
            .data=${card.data}
            @command=${(e: CustomEvent) => this.executeCommand(e.detail.command)}
          ></farm-chat-briefing-card>
        `;
      case "weather-forecast":
        return html`
          <farm-chat-weather-card
            .data=${card.data}
          ></farm-chat-weather-card>
        `;
      case "task-list":
        return html`
          <farm-chat-task-list-card
            .data=${card.data}
            @task-click=${(e: CustomEvent) => {
              const task = e.detail.task;
              if (task.command) {
                this.executeCommand(task.command);
              }
            }}
          ></farm-chat-task-list-card>
        `;
      default:
        return nothing;
    }
  }

  private renderEmptyState() {
    return html`
      <div class="empty-state">
        <div class="empty-icon">🌱</div>
        <div class="empty-title">AI Daily Command Center</div>
        <div class="empty-subtitle">
          Your AI-powered farm assistant is ready. I'll help you monitor, plan, and optimize your farm operations. Try these commands or ask me anything:
        </div>
        <div class="empty-commands">
          ${COMMANDS.slice(0, 4).map(
            (cmd) => html`
            <div class="empty-command" @click=${() => this.handleCommandClick(cmd)}>
              <span class="empty-command-icon">${cmd.icon}</span>
              <div class="empty-command-text">
                <div class="empty-command-name">${cmd.command}</div>
                <div class="empty-command-desc">${cmd.description}</div>
              </div>
            </div>
          `,
          )}
        </div>
      </div>
    `;
  }

  private renderMessages() {
    return html`
      ${this.messages.map(
        (msg) => html`
        <div class="message message-${msg.role}">
          ${
            msg.role === "user"
              ? html`
            <div class="message-bubble">${msg.content}</div>
          `
              : html`
            <div class="message-content">${msg.content}</div>
            ${
              msg.cards?.length
                ? html`
              <div class="message-cards">
                ${msg.cards.map((card) => this.renderCard(card))}
              </div>
            `
                : nothing
            }
            <div class="message-time">${this.formatTime(msg.timestamp)}</div>
          `
          }
        </div>
      `,
      )}
    `;
  }

  private renderWeatherStrip() {
    const dateInfo = this.getFormattedDate();
    return html`
      <div class="weather-strip">
        <div class="date-section">
          <div class="date-primary">${dateInfo.primary}</div>
          <div class="date-secondary">${dateInfo.secondary}</div>
        </div>
        <div class="weather-quick">
          <div class="weather-temp">
            <span class="temp-current">${this.weatherData.current}°</span>
            <div class="temp-range">
              <span>H: ${this.weatherData.high}°</span>
              <span>L: ${this.weatherData.low}°</span>
            </div>
          </div>
          <div class="weather-condition">
            ${this.getWeatherIcon(this.weatherData.condition)}
            ${this.weatherData.condition}
          </div>
          <div class="weather-metric">💧 ${this.weatherData.rain}%</div>
          <div class="weather-metric">💨 ${this.weatherData.wind} mph</div>
          <div class="weather-metric">🌅 ${this.weatherData.sunrise}</div>
        </div>
      </div>
    `;
  }

  private renderContextPanel() {
    const highPriorityTasks = this.dailyTasks.filter((t) => !t.completed);
    const panelClass = this.showDailyContext ? "" : "collapsed";

    return html`
      <div class="context-panel ${panelClass}">
        <div class="context-panel-header">
          <span class="context-panel-title">Today's Focus</span>
          <button class="collapse-btn" @click=${this.toggleContextPanel}>
            ${this.showDailyContext ? "◀" : "▶"}
          </button>
        </div>
        
        <!-- Quick Stats -->
        <div class="context-section">
          <div class="context-section-title">
            📊 <span>Quick Status</span>
          </div>
          <div class="quick-stat">
            <span class="quick-stat-label">Soil Moisture</span>
            <span class="quick-stat-value warning">17%</span>
          </div>
          <div class="quick-stat">
            <span class="quick-stat-label">Soil Temp</span>
            <span class="quick-stat-value">54.5°F</span>
          </div>
          <div class="quick-stat">
            <span class="quick-stat-label">EC Level</span>
            <span class="quick-stat-value warning">Low</span>
          </div>
          <div class="quick-stat">
            <span class="quick-stat-label">Sensor Battery</span>
            <span class="quick-stat-value ok">57%</span>
          </div>
        </div>
        
        <!-- Tasks -->
        <div class="context-section">
          <div class="context-section-title">
            ✅ <span>Today's Tasks (${highPriorityTasks.length})</span>
          </div>
          <div class="task-list">
            ${highPriorityTasks.map(
              (task) => html`
              <div 
                class="task-item ${task.completed ? "completed" : ""}" 
                @click=${() => this.handleTaskClick(task)}
              >
                <div class="task-priority ${task.priority}"></div>
                <div class="task-content">
                  <div class="task-title">${task.title}</div>
                  <div class="task-reason">${task.reason}</div>
                </div>
                <span class="task-category">${this.getCategoryIcon(task.category)}</span>
              </div>
            `,
            )}
          </div>
        </div>
        
        <!-- Alerts -->
        ${
          this.activeAlerts.length > 0
            ? html`
          <div class="context-section">
            <div class="context-section-title">
              ⚠️ <span>Active Alerts (${this.activeAlerts.length})</span>
            </div>
            <div class="alert-list">
              ${this.activeAlerts.map(
                (alert) => html`
                <div 
                  class="alert-item ${alert.severity}" 
                  @click=${() => this.handleAlertClick(alert)}
                >
                  <span class="alert-icon">${this.getAlertIcon(alert.severity)}</span>
                  <div class="alert-text">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                  </div>
                </div>
              `,
              )}
            </div>
          </div>
        `
            : nothing
        }
      </div>
    `;
  }

  override render() {
    return html`
      <!-- Header -->
      <div class="header">
        <div class="brand">
          <span class="brand-icon">🌱</span>
          <span class="brand-name">Today</span>
        </div>
        <div class="provider-selector">
          <select 
            class="provider-select" 
            .value=${this.aiProvider}
            @change=${(e: Event) => (this.aiProvider = (e.target as HTMLSelectElement).value as "ollama" | "openai" | "auto")}
          >
            <option value="auto">Auto</option>
            <option value="openai" ?disabled=${this.openaiStatus === "offline"}>OpenAI ${this.openaiStatus === "online" ? "✓" : ""}</option>
            <option value="ollama" ?disabled=${this.ollamaStatus === "offline"}>Ollama ${this.ollamaStatus === "online" ? "✓" : ""}</option>
          </select>
          <div class="status-badge" style="${this.getProviderStatus() === "offline" ? "border-color: var(--danger); color: var(--danger); background: var(--danger-subtle);" : this.getProviderStatus() === "loading" ? "border-color: var(--warn); color: var(--warn); background: var(--warn-subtle);" : ""}">
            <span class="status-dot ${this.getProviderStatus()}"></span>
            ${this.getProviderStatus() === "online" ? `${this.getActiveProvider() === "openai" ? "GPT-4o" : "Llama"} Online` : this.getProviderStatus() === "loading" ? "Connecting..." : "Offline"}
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" @click=${() => (this.showSettings = !this.showSettings)} title="Settings">⚙️</button>
          <button class="icon-btn" @click=${() => this.dispatchEvent(new CustomEvent("refresh"))} title="Refresh">🔄</button>
        </div>
      </div>

      <!-- Weather Strip -->
      ${this.renderWeatherStrip()}

      <!-- Settings Modal -->
      ${
        this.showSettings
          ? html`
        <div class="settings-modal-overlay" @click=${() => (this.showSettings = false)}>
          <div class="settings-modal" @click=${(e: Event) => e.stopPropagation()}>
            <div class="settings-header">
              <h3>AI Settings</h3>
              <button class="close-btn" @click=${() => (this.showSettings = false)}>✕</button>
            </div>
            <div class="settings-content">
              <div class="settings-section">
                <label class="settings-label">AI Provider</label>
                <select 
                  class="settings-select"
                  .value=${this.aiProvider}
                  @change=${(e: Event) => {
                    this.aiProvider = (e.target as HTMLSelectElement).value as
                      | "ollama"
                      | "openai"
                      | "auto";
                    localStorage.setItem("farm_clawed_ai_provider", this.aiProvider);
                  }}
                >
                  <option value="auto">Auto (prefer cloud)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
              <div class="settings-section">
                <label class="settings-label">OpenAI API Key</label>
                <input 
                  type="password"
                  class="settings-input"
                  placeholder="sk-..."
                  .value=${this.openaiApiKey}
                  @input=${(e: Event) => (this.openaiApiKey = (e.target as HTMLInputElement).value)}
                />
                <button class="settings-btn" @click=${() => {
                  localStorage.setItem("farm_clawed_openai_key", this.openaiApiKey);
                  this.checkOpenAIStatus();
                }}>Save & Test</button>
              </div>
              <div class="settings-section">
                <label class="settings-label">Status</label>
                <div class="status-list">
                  <div class="status-item">
                    <span>OpenAI:</span>
                    <span class="status-value ${this.openaiStatus}">${this.openaiStatus}</span>
                  </div>
                  <div class="status-item">
                    <span>Ollama:</span>
                    <span class="status-value ${this.ollamaStatus}">${this.ollamaStatus}</span>
                  </div>
                </div>
              </div>

              <div class="settings-divider"></div>

              <div class="settings-section">
                <label class="settings-label">IFTTT/SmartLife Integration</label>
                <div class="toggle-row">
                  <span>Enable IFTTT Automations</span>
                  <label class="toggle">
                    <input 
                      type="checkbox" 
                      .checked=${this.iftttEnabled}
                      @change=${(e: Event) => {
                        this.iftttEnabled = (e.target as HTMLInputElement).checked;
                        this.saveIftttSettings();
                      }}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="settings-section">
                <label class="settings-label">IFTTT Webhook Key</label>
                <input 
                  type="password"
                  class="settings-input"
                  placeholder="Your IFTTT Maker webhook key"
                  .value=${this.iftttKey}
                  @input=${(e: Event) => (this.iftttKey = (e.target as HTMLInputElement).value)}
                />
                <button class="settings-btn" @click=${() => {
                  this.saveIftttSettings();
                  this.messages = [
                    ...this.messages,
                    {
                      id: this.generateId(),
                      role: "assistant",
                      content:
                        "✓ IFTTT settings saved! Webhook events will use the format: FARM_{TARGET}_{TYPE}",
                      timestamp: new Date().toISOString(),
                    },
                  ];
                  this.scrollToBottom();
                  this.showSettings = false;
                }}>Save IFTTT Settings</button>
                <p class="settings-hint">
                  Get your key from <a href="https://ifttt.com/maker_webhooks" target="_blank">ifttt.com/maker_webhooks</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      `
          : nothing
      }

      <!-- Main Content Area with Context Panel -->
      <div class="main-content">
        <!-- Context Panel -->
        ${this.renderContextPanel()}
        
        <!-- Chat Area -->
        <div class="chat-area">
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
                ${
                  this.showCommands
                    ? html`
                  <div class="command-dropdown">
                    ${this.filteredCommands.map(
                      (cmd, i) => html`
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
                    `,
                    )}
                  </div>
                `
                    : nothing
                }
                <div class="input-wrapper">
                  <textarea
                    class="chat-input"
                    placeholder="Ask your farm AI anything..."
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
                ${COMMANDS.map(
                  (cmd) => html`
                  <button class="command-chip" @click=${() => this.handleCommandClick(cmd)}>
                    ${cmd.icon} ${cmd.command}
                  </button>
                `,
                )}
              </div>
            </div>
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
