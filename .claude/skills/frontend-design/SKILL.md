---
name: frontend-design
description: Use when building or modifying UI components, pages, or visual elements. Enforces RiskTerrain's distinctive dark intelligence aesthetic.
---

# Frontend Design — RiskTerrain

## Aesthetic Direction

**Dark intelligence terminal** — military-grade data visualization meets Bloomberg terminal. NOT generic startup UI.

### Color Palette (MANDATORY)
```
Background:   #080D1A (primary), #0A0F1E (secondary)
Card:         rgba(15,23,42,0.8)
Border:       rgba(59,130,246, 0.15-0.5)
Blue:         #3B82F6 (accent), #1D4ED8 (deep)
Text:         #F8FAFC (primary) → #94A3B8 → #64748B → #475569 → #334155
Red:          #EF4444 (critical)
Orange:       #F97316 (high risk)
Yellow:       #EAB308 (medium)
Green:        #22C55E (low/live)
```

### Typography (MANDATORY)
- **Display**: Syne (weight 700-800, tight tracking)
- **Data/Labels**: JetBrains Mono (weight 400-700, wide tracking)
- Labels: ALL-CAPS, letterSpacing 1-4px, fontSize 7-9px
- Headings: clamp() for responsive sizing

### Visual Language
- Subtle glow effects: `boxShadow: "0 0 30px rgba(59,130,246,0.4)"`
- Pulsing indicators for live status
- Backdrop blur on overlays: `backdropFilter: "blur(8px)"`
- 1px borders with blue at low opacity
- Tech badges: small mono text, blue border, dark background

## Implementation Rules

- **Inline styles ONLY** — no Tailwind, no CSS modules, no styled-components
- Use clamp() for responsive values: `fontSize: 'clamp(16px, 3vw, 20px)'`
- Use min() in grid: `gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))'`
- Mobile breakpoint: 768px via `isMobile` state + resize listener

## DO NOT
- Use Inter, Roboto, Arial, or system fonts
- Use purple gradients, white backgrounds, or generic startup colors
- Add emojis anywhere
- Use CSS frameworks
- Create generic-looking UI — every element should feel like an intelligence platform
