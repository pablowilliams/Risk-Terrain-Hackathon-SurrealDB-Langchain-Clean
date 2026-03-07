# RiskTerrain — Geospatial S&P 500 Risk Intelligence Platform

## Core Rules
- Read this file fully before making any changes
- Follow data contracts exactly — backend MUST return frontend-compatible shapes
- Inline styles only — no CSS frameworks
- Never hardcode API keys — use .env
- Run `cd frontend && npm run build` before marking frontend work done
- Check `.claude/rules/` for coding-style and security rules

## Project
London Hackathon 2025 — Claude + SurrealDB + LangGraph.
Real-time geopolitical event detection → supply chain graph traversal → AI risk scoring → 3D globe visualization.

## Architecture
- **Frontend**: Vite + React + TypeScript (deployed to GitHub Pages)
- **Backend**: Python + FastAPI + LangGraph + Claude API
- **Database**: SurrealDB Cloud (graph DB for supply chain relationships)
- **See**: `BACKEND_PLAN.md` for full implementation details

## Structure
```
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Globe3D.tsx           # 3D globe with ResizeObserver
│   │   │   └── dashboard/
│   │   │       └── RiskTerrain.jsx   # Main dashboard (events + globe + risk panel)
│   │   ├── pages/
│   │   │   ├── Landing.tsx           # Scroll-driven landing page
│   │   │   └── Dashboard.tsx         # Framer wrapper → RiskTerrain
│   │   └── data/mockData.ts          # Companies, events, types, utilities
│   └── vite.config.ts
├── backend/                 # FastAPI + LangGraph (to be built)
├── BACKEND_PLAN.md          # Full backend implementation plan
└── .claude/                 # Claude Code configuration
    ├── agents/              # Specialized AI agents
    ├── skills/              # Domain knowledge skills
    ├── rules/               # Coding style + security rules
    └── commands/            # Slash commands (/plan, /debug, /build-fix)
```

## Available Agents
Use these with the Task tool for specialized work:

| Agent | File | Purpose |
|-------|------|---------|
| `python-pro` | `.claude/agents/python-pro.md` | Python specialist — FastAPI, LangGraph, SurrealDB, Claude API |
| `backend-developer` | `.claude/agents/backend-developer.md` | Backend API design with exact data contracts |
| `frontend-developer` | `.claude/agents/frontend-developer.md` | React/Globe3D specialist with design tokens |
| `architect` | `.claude/agents/architect.md` | System architecture and data flow decisions |
| `code-reviewer` | `.claude/agents/code-reviewer.md` | Security + data contract + quality review |
| `build-error-resolver` | `.claude/agents/build-error-resolver.md` | Fix build/type errors with minimal changes |

## Available Skills
Load these for domain expertise:

| Skill | Directory | When to Use |
|-------|-----------|-------------|
| `api-design` | `.claude/skills/api-design/` | Designing FastAPI endpoints, request/response contracts |
| `coding-standards` | `.claude/skills/coding-standards/` | Python + TypeScript conventions for this project |
| `systematic-debugging` | `.claude/skills/systematic-debugging/` | 4-phase debugging methodology |
| `frontend-design` | `.claude/skills/frontend-design/` | Dark intelligence aesthetic, design tokens |
| `verification-before-completion` | `.claude/skills/verification-before-completion/` | Pre-completion checklist gate |

## Commands
| Command | Description |
|---------|-------------|
| `/plan` | Feature planning workflow — explore, propose approaches, get approval |
| `/debug` | Systematic debugging — 4-phase root cause methodology |
| `/build-fix` | Fix build errors — dispatch build-error-resolver agent |

## Data Contracts (frontend <-> backend)
These are the exact shapes the frontend renders. Backend MUST return these:

**Company**: `{ ticker, name, sector, lat, lng, mc }`
- `mc` is market cap in billions (integer, e.g. 3100 = $3.1T)

**DemoEvent**: `{ id, type, title, description, severity, source, affected_countries, affected_sectors, lat, lng, created_at, risks }`
- `type`: "natural_disaster" | "geopolitical" | "macro"
- `severity`: integer 1-5
- `risks`: `Record<string, { score: number, reasoning: string }>` (keyed by ticker)
- `score`: float 0.0-1.0
- `created_at`: ISO 8601 string

## Design Tokens
- BG: #080D1A / #0A0F1E
- Blue: #3B82F6 / deep: #1D4ED8
- Text: #F8FAFC → #94A3B8 → #64748B → #475569
- Fonts: Syne (display) + JetBrains Mono (data/labels)
- All-caps labels, letterSpacing 1-3px, blue borders at 15-50% opacity

## Key Patterns
- Globe3D uses ResizeObserver for container sizing — do not remove
- Dashboard is mobile responsive (isMobile state, slide-over panel)
- Landing page uses clamp() for responsive sizing
- New files in TypeScript, existing JSX files stay as-is
- All mock data in `src/data/mockData.ts`

## Build Commands
```bash
cd frontend && npm run dev      # Dev server :5173
cd frontend && npm run build    # Production build
cd backend && uvicorn main:app --reload  # Backend :8000 (after build)
```
