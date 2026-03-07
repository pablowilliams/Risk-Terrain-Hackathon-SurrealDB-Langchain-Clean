---
description: Fix build and type errors
---

Dispatch the `build-error-resolver` agent to fix build and type errors.

1. Run the build command and capture errors
2. Analyze each error systematically
3. Fix errors one at a time, starting with root causes
4. Re-run the build after each fix
5. Continue until the build succeeds

Frontend: `cd frontend && npm run build`
Backend: `cd backend && uvicorn main:app --reload`

Do not suppress errors with `any` types or `@ts-ignore` unless absolutely necessary.

$ARGUMENTS
