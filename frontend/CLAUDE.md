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
├── data/mockData.ts            # SP500_SAMPLE (154 companies), DEMO_EVENTS, types, utilities
├── pages/
│   ├── Landing.tsx             # Scroll-driven hero + features + tech + CTA
│   └── Dashboard.tsx           # Framer wrapper → RiskTerrain
└── components/
    ├── Globe3D.tsx             # react-globe.gl wrapper with ResizeObserver
    ├── SplashScreen.tsx        # 2.5s intro animation
    └── dashboard/
        └── RiskTerrain.jsx     # Full dashboard: header, 3D globe, event feed, risk panel, status bar
```

## Key Patterns
- **Globe3D** uses ResizeObserver + containerRef to render at container size (not window size). Do not remove this.
- **Dashboard** is mobile responsive: `isMobile` state (< 768px), slide-over panel with toggle, simplified header/status bar.
- **Landing page** uses `clamp()` for fluid responsive padding and font sizes.
- **Data flow**: events array in state → activeEvent drives globe arcs/rings + risk panel. Companies are static (154 S&P 500 entries with lat/lng coordinates).

## Design Tokens
- BG: #080D1A / #0A0F1E
- Blue accent: #3B82F6 / deep: #1D4ED8
- Text: #F8FAFC -> #94A3B8 -> #64748B -> #475569
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
- New files in TypeScript, existing JSX files stay as-is
- Inline styles only — no CSS frameworks
- All mock data lives in src/data/mockData.ts
- Globe3D ResizeObserver pattern is critical — do not bypass
- Dashboard mobile layout uses isMobile + panelOpen state — preserve this pattern
