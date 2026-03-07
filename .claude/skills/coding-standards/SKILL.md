---
name: coding-standards
description: Use when writing new code, reviewing quality, or enforcing conventions across frontend and backend.
---

# Coding Standards — RiskTerrain

## Principles

1. **KISS** — Simplest solution that works. Hackathon timeline.
2. **DRY** — Extract common logic, reuse utilities.
3. **YAGNI** — Don't build features before needed.
4. **Readability** — Code is read more than written.

## Python (Backend)

### Naming
- Functions/variables: `snake_case`
- Classes: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Files: `snake_case.py`

### Type Hints
```python
# ALWAYS type function signatures
async def score_companies(
    companies: list[dict],
    event: dict,
    severity: int
) -> dict[str, dict]:
    ...
```

### Async
```python
# GOOD: Parallel when possible
companies, events = await asyncio.gather(
    db.query("SELECT * FROM company"),
    db.query("SELECT * FROM event ORDER BY created_at DESC LIMIT 50")
)

# BAD: Sequential when not needed
companies = await db.query("SELECT * FROM company")
events = await db.query("SELECT * FROM event ORDER BY created_at DESC LIMIT 50")
```

### Error Handling
```python
# GOOD: Specific, informative
try:
    result = await client.messages.create(...)
except anthropic.APIError as e:
    raise HTTPException(status_code=503, detail=f"Claude API error: {e}")

# BAD: Swallowed
try:
    result = await client.messages.create(...)
except:
    pass
```

## TypeScript/React (Frontend)

### Naming
- Variables/functions: `camelCase`
- Components: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities

### Immutability
```typescript
// ALWAYS spread
const updated = { ...event, risks: newRisks }
const withNew = [newEvent, ...events]

// NEVER mutate
event.risks = newRisks  // BAD
events.push(newEvent)   // BAD
```

### State Updates
```typescript
// GOOD: Functional update
setEvents(prev => [newEvent, ...prev])

// BAD: Stale closure risk
setEvents([newEvent, ...events])
```

## Shared Rules

- No hardcoded secrets — use .env
- No console.log/print in production code
- Functions under 50 lines
- Files under 500 lines (split if larger)
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`
