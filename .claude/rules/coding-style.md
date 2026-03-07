# Coding Style Rules

## General
- Immutability preferred — never mutate objects/arrays directly
- No console.log/print in production code
- No hardcoded secrets — use environment variables
- Input validation at system boundaries (API endpoints, user input)
- Proper error handling — never swallow errors silently
- Functions under 50 lines, files under 500 lines

## Frontend (TypeScript/React)
- Functional components only
- Inline styles only — no CSS frameworks
- Custom hooks for shared logic
- Memoize expensive computations (useMemo, useCallback)
- Design tokens from RiskTerrain palette (#080D1A, #3B82F6, etc.)
- Fonts: Syne (display) + JetBrains Mono (data)

## Backend (Python)
- Type hints on all function signatures
- Async/await for all I/O operations
- Pydantic models for validation
- snake_case for functions/variables, PascalCase for classes
- Docstrings on public functions

## Git
- Conventional commits: feat/fix/refactor/docs/test/chore
- One logical change per commit
- Never commit .env files or API keys
