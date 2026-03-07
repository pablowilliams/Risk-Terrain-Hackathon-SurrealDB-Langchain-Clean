---
name: verification-before-completion
description: Use before claiming work is complete. Run verification commands and confirm output before making success claims.
---

# Verification Before Completion

## Core Principle

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

## The Gate

Before claiming any status:
1. **IDENTIFY** — What command proves this claim?
2. **RUN** — Execute the full command
3. **READ** — Full output, check exit code
4. **VERIFY** — Does output confirm the claim?
5. **ONLY THEN** — Make the claim

## RiskTerrain Verification Commands

### Frontend
```bash
cd frontend && npm run build          # Build succeeds? 0 errors?
cd frontend && npx tsc --noEmit      # Type check passes?
```

### Backend
```bash
cd backend && uvicorn main:app --reload   # Server starts?
curl http://localhost:8000/api/health      # Returns {"status":"ok"}?
curl http://localhost:8000/api/companies   # Returns 154 companies?
```

### End-to-End
```bash
# Both running simultaneously:
# Terminal 1: cd backend && uvicorn main:app --reload
# Terminal 2: cd frontend && npm run dev
# Browser: http://localhost:5173/dashboard
# Click SIMULATE EVENT → processing overlay → real risk scores appear
```

## Red Flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- About to commit without running build
- "I'm confident it works"
- Partial verification ("linter passed" != "build passed")

## Common Failures

| Claim | Requires | NOT Sufficient |
|-------|----------|----------------|
| Build passes | `npm run build` exit 0 | "Code looks correct" |
| API works | `curl` returns expected JSON | "Endpoint is defined" |
| Frontend renders | Visual check in browser | "Component is imported" |
| Pipeline works | Full event → risk scores output | "Each node runs individually" |
