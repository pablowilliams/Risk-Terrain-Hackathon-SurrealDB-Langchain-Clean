# RiskTerrain — Geospatial S&P 500 Risk Intelligence Platform

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
└── BACKEND_PLAN.md          # Full backend implementation plan
```

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
- Text: #F8FAFC -> #94A3B8 -> #64748B -> #475569
- Fonts: Syne (display) + JetBrains Mono (data/labels)
- All-caps labels, letterSpacing 1-3px, blue borders at 15-50% opacity

## Rules
- Inline styles only — no CSS frameworks (no Tailwind)
- New files in TypeScript, existing JSX files stay as-is
- All mock data in `src/data/mockData.ts`
- Globe3D uses ResizeObserver for container sizing — do not remove
- Dashboard is mobile responsive (isMobile state, slide-over panel)
- Landing page uses clamp() for responsive sizing

## Commands
```bash
cd frontend && npm run dev      # Dev server :5173
cd frontend && npm run build    # Production build
cd backend && uvicorn main:app --reload  # Backend :8000 (after build)
```
