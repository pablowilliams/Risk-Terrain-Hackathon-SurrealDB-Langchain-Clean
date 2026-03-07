# RiskTerrain Frontend

## Project
Geospatial risk intelligence platform for S&P 500 companies.
London Hackathon 2025 — Claude + SurrealDB + LangGraph.

## Tech Stack
- Vite + React + TypeScript
- react-globe.gl (3D interactive globe)
- Framer Motion (page transitions + scroll animations)
- React Router v6 (/ landing, /dashboard)
- Inline styles (no Tailwind — matches dashboard pattern)

## Structure
```
src/
├── main.tsx                    # BrowserRouter entry
├── App.tsx                     # Routes + AnimatePresence
├── styles/globals.css          # Reset, scrollbar, keyframes
├── data/mockData.ts            # SP500_SAMPLE, DEMO_EVENTS, utilities
├── pages/
│   ├── Landing.tsx             # Hero (globe bg) + Features + Tech + CTA
│   └── Dashboard.tsx           # Framer wrapper → RiskTerrain
└── components/
    ├── Globe3D.tsx             # react-globe.gl wrapper
    └── dashboard/
        └── RiskTerrain.jsx     # Original 876-line dashboard (untouched)
```

## Design Tokens
- BG: #080D1A / #0A0F1E
- Blue accent: #3B82F6 / deep: #1D4ED8
- Text: #F8FAFC → #94A3B8 → #64748B → #475569
- Fonts: Syne (display) + JetBrains Mono (data/labels)
- Labels: ALL-CAPS, letterSpacing 1-3px
- Borders: 1px blue at 15-50% opacity

## Commands
```bash
npm run dev      # Dev server on localhost:5173
npm run build    # Production build
npm run preview  # Preview production build
```

## Rules
- Keep RiskTerrain.jsx untouched (original dashboard)
- New files in TypeScript, existing JSX files stay as-is
- Inline styles only — no CSS frameworks
- All mock data lives in src/data/mockData.ts
