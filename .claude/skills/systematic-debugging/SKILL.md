---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior. NEVER guess-fix. Follow the 4-phase methodology.
---

# Systematic Debugging

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

## The Four Phases

### Phase 1: Root Cause Investigation

BEFORE attempting ANY fix:

1. **Read error messages carefully** — stack traces, line numbers, error codes
2. **Reproduce consistently** — exact steps, every time
3. **Check recent changes** — `git diff`, recent commits, new deps
4. **Trace data flow** — where does the bad value originate? Trace backward.

### Phase 2: Pattern Analysis

1. **Find working examples** — similar working code in the same codebase
2. **Compare** — what's different between working and broken?
3. **Understand dependencies** — what config, env, or state does it need?

### Phase 3: Hypothesis & Testing

1. **Form single hypothesis** — "I think X causes this because Y"
2. **Test minimally** — smallest possible change, one variable at a time
3. **Verify** — did it work? If not, NEW hypothesis (don't stack fixes)

### Phase 4: Implementation

1. **Fix the root cause** — not the symptom
2. **Verify fix works** — run the actual test/build
3. **If 3+ fixes fail** — STOP. Question the architecture, not another fix.

## RiskTerrain-Specific Debugging

### Frontend Issues
```bash
cd frontend && npx tsc --noEmit --pretty     # Type errors
cd frontend && npm run build                   # Build errors
cd frontend && npm run dev                     # Runtime errors (check console)
```

### Backend Issues
```bash
cd backend && uvicorn main:app --reload       # Runtime errors
cd backend && python -c "from agents.pipeline import graph; print('OK')"  # Import errors
```

### Common Issues

| Symptom | Likely Cause |
|---------|-------------|
| Globe not rendering in dashboard | ResizeObserver not measuring, dimensions are 0 |
| API response not rendering | Response shape doesn't match DemoEvent interface |
| Pipeline hangs | Claude API timeout, missing ANTHROPIC_API_KEY |
| SurrealDB connection fails | Wrong URL/credentials in .env |
| Arcs not showing | No activeEvent set, or risks dict is empty |

## Red Flags — STOP and Follow Process

- "Quick fix for now"
- "Just try changing X"
- "It's probably X, let me fix that"
- Proposing solutions before tracing data flow
- 3+ failed fix attempts
