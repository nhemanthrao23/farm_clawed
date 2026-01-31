# farm_clawed Architecture Review

## Overview

farm_clawed is built on top of the OpenClaw personal AI assistant platform, transforming it into an AI-first Farm Operator with permaculture-ready capabilities.

## Current Infrastructure (Inherited from OpenClaw)

### Gateway Control Plane

The Gateway is the central WebSocket server that orchestrates all farm operations.

**Location:** `src/gateway/`

Key components:
- `server.impl.ts` - Main gateway server implementation
- `server-methods/` - WebSocket method handlers
- `protocol/` - Protocol type definitions
- `server-chat.ts` - AI conversation handling

**Integration points for farm_clawed:**
- Add farm-specific WebSocket methods (`farm.context.get`, `farm.schedule.run`, etc.)
- Extend protocol types for farm operations
- Add farm scheduler to server lifecycle

### Configuration System

Zod-validated configuration with UI hints and defaults.

**Location:** `src/config/`

Key files:
- `zod-schema.ts` - Main schema definition
- `validation.ts` - Config validation logic
- `io.ts` - Config file I/O
- `types.ts` - TypeScript type definitions

**Integration points for farm_clawed:**
- Add `farm` section to main config schema
- Define `permacultureDepth` (0-3) and `automationLevel` (0-4) dials
- Add farm profile, safety, and AI provider configuration

### Skills System

Markdown-based skills with YAML frontmatter metadata.

**Location:** `skills/` (skill definitions), `src/agents/skills/` (skill loading)

Key files:
- `workspace.ts` - Skill discovery and loading
- `config.ts` - Skill eligibility and filtering
- `types.ts` - Skill type definitions

**Skill structure:**
```markdown
---
name: skill-name
description: What the skill does
metadata: { "openclaw": { "requires": { "bins": [], "env": [] } } }
---

# Skill Name

Instructions for the AI...
```

**Integration points for farm_clawed:**
- Add `requires.depth` metadata for permaculture gating
- Create `skills/farm-standard/` for standard farm skills
- Create `skills/farm-permaculture/` for permaculture-specific skills

### Web UI

Lit web components with controllers and views.

**Location:** `ui/src/`

Key directories:
- `ui/views/` - Page-level view components
- `ui/controllers/` - Data fetching and state management
- `styles/` - CSS stylesheets

**Integration points for farm_clawed:**
- Add farm console view as primary interface
- Add approval queue, audit log, ROI dashboard views
- Add experiment pages (e.g., lemon tree biodome)
- Extend navigation with farm routes

### Extension/Plugin Architecture

Workspace packages that extend core functionality.

**Location:** `extensions/`

**Extension structure:**
```
extensions/my-extension/
  package.json    # Declares entry points
  index.ts        # Plugin entry
```

**Integration points for farm_clawed:**
- Create `extensions/ifttt-smartlife/` for actuator control
- Optional Home Assistant bridge stub

### CLI Structure

Commander-based CLI with subcommands.

**Location:** `src/cli/`

Key files:
- `program/register.subclis.ts` - Subcommand registration
- Various `*-cli.ts` files for specific commands

**Integration points for farm_clawed:**
- Add `farm` subcommand group
- Commands: `init`, `status`, `schedule`, `approve`, `audit`, `export`

## farm_clawed Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Web UI    │  │    CLI      │  │  Messaging Channels     │ │
│  │  (Console)  │  │ (farm_clawed)│  │ (WhatsApp/Telegram/etc) │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Farm Gateway                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Scheduler  │  │  Approvals  │  │    Jidoka Safety        │ │
│  │  (cron)     │  │  Manager    │  │    (stop-the-line)      │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │                │
│  ┌──────┴────────────────┴─────────────────────┴──────────────┐│
│  │                    Audit Hash Chain                         ││
│  │           (SHA256 chain for all actions)                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Farm Skills Hub                             │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │  Standard Farm Pack │  │     Permaculture Pack           │  │
│  │  (depth 0-1)        │  │     (depth 2-3)                 │  │
│  │  - Irrigation       │  │     - Water-First Design        │  │
│  │  - Fertility        │  │     - Zones/Sectors             │  │
│  │  - Microclimate     │  │     - Guilds/Polyculture        │  │
│  │  - IPM              │  │     - Succession Planning       │  │
│  │  - Seasonal         │  │     - Soil Building             │  │
│  └─────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Farm      │  │   Sensor    │  │      Templates          │ │
│  │   Context   │  │   Readings  │  │   (YAML/CSV/GeoJSON)    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Optional Actuators                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   IFTTT     │  │    Home     │  │      Manual Tasks       │ │
│  │  Webhooks   │  │  Assistant  │  │   (checklists/logs)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### User Dials

#### Permaculture Depth (0-3)

| Level | Name | Description |
|-------|------|-------------|
| 0 | Standard | Conventional farm ops, no permaculture constructs |
| 1 | Regen-friendly | Soil health, water conservation, IPM basics |
| 2 | Permaculture-lite | Optional zones/sectors, some guild guidance |
| 3 | Full Permaculture | Zones/sectors, guilds, stacking functions, succession |

#### Automation Level (0-4)

| Level | Name | Description |
|-------|------|-------------|
| 0 | Observe | Dashboards and logs only |
| 1 | Assist | Recommendations and checklists |
| 2 | Propose | Human-in-loop approvals (default for actuators) |
| 3 | Auto-Guardrails | Automatic within safety limits |
| 4 | Full Ops | Edge box with strict Jidoka |

### Safety/Jidoka System

Toyota-style autonomation principles applied to farm automation:

1. **Stop-the-line triggers:**
   - Leak detected (flow without valve open)
   - Overwatering (moisture > threshold for too long)
   - EC spike combined with dry soil
   - Frost risk (soil temp dropping rapidly)

2. **Forced acknowledgments:**
   - Level 3+ requires explicit safety checklist completion
   - Actuator pairing requires acknowledgment of risks

3. **Audit chain:**
   - Every action logged with SHA256 hash chain
   - Tamper-evident history
   - Full rollback plans generated

### File Structure

```
src/farm/
├── schemas/           # Zod schemas for farm templates
│   ├── farm-profile.ts
│   ├── water-assets.ts
│   ├── sensor-readings.ts
│   ├── zones-sectors.ts
│   └── guilds.ts
├── safety/            # Jidoka implementation
│   ├── jidoka.ts
│   ├── guardrails.ts
│   ├── approval-policy.ts
│   ├── audit-chain.ts
│   └── rollback.ts
├── ai/                # AI provider abstraction
│   ├── provider.ts
│   └── fallback.ts
├── roi/               # ROI tracking
│   ├── tool-ladder.ts
│   └── calculator.ts
├── experiments/       # Experiment implementations
│   └── lemon-tree/
├── photos/            # Photo tag system
│   └── tags.ts
└── index.ts

skills/
├── farm-standard/     # Standard farm skills (depth 0-1)
│   ├── irrigation-policy/
│   ├── fertility-plan/
│   ├── microclimate-risk/
│   ├── ipm-observation/
│   └── seasonal-planner/
└── farm-permaculture/ # Permaculture skills (depth 2-3)
    ├── water-first-design/
    ├── zones-sectors-planner/
    ├── guild-polyculture/
    ├── succession-planner/
    └── soil-building/

extensions/
└── ifttt-smartlife/   # Optional actuator connector
    ├── package.json
    ├── index.ts
    ├── scenes.ts
    ├── webhook.ts
    └── approval-gate.ts

ui/src/ui/views/
├── farm-console.ts    # Primary AI output feed
├── farm-approvals.ts  # Approval queue
├── farm-audit.ts      # Hash chain viewer
├── farm-roi.ts        # ROI dashboard
└── farm-experiment.ts # Experiment pages

docs/
├── ARCHITECTURE_REVIEW.md  # This file
├── FARM_CONTEXT_PACK.md    # Template documentation
├── TEMPLATES/              # Example templates
└── IFTTT_SMARTLIFE_SETUP.md
```

## Migration Strategy

1. **Phase 1:** Add farm config section without breaking existing functionality
2. **Phase 2:** Implement farm skills alongside existing skills
3. **Phase 3:** Add farm UI views with feature flags
4. **Phase 4:** Implement safety system and audit chain
5. **Phase 5:** Add optional actuator extensions
6. **Phase 6:** Full integration testing and documentation

## Compatibility Notes

- All existing OpenClaw functionality remains available
- Farm features are opt-in via config
- SIM mode works without any API keys or hardware
- Existing channels (WhatsApp, Telegram, etc.) can receive farm alerts

