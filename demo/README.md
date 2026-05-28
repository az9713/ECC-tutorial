# ECC Demo: Rate Limiting an Express API

Concrete showcase of ECC's 3 layers catching real bugs at the right moment.

## What This Is

Single feature implementation — "add rate limiting to our Express API" — with 5 deliberate bugs. Each bug is caught by exactly one ECC layer, exactly when that layer should catch it.

Read `SHOWCASE.md` for the full narrative receipt. This README tells you where everything is.

## Files

```
demo/
├── SHOWCASE.md                      ← Read this first. The full receipt.
├── app/
│   ├── src/middleware/
│   │   ├── rateLimiter.ts           ← BUGGED: 5 deliberate bugs (what ECC catches)
│   │   └── rateLimiter.fixed.ts    ← CLEAN: all bugs fixed (end state)
│   ├── src/routes/api.ts
│   ├── src/index.ts
│   ├── src/types.ts
│   ├── tests/rateLimiter.test.ts   ← Written first (TDD, per tdd-workflow skill)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── .ecc/
    ├── layer1-skills.md             ← Skills that activated + what they injected
    ├── layer2-agents.md             ← Agent invocations + exact findings
    └── layer3-hooks.md              ← Hook firings + what each caught
```

## The 5 Bugs and Who Catches Them

| Bug | File:Line | Layer | How Caught |
|-----|-----------|-------|------------|
| Hardcoded `REDIS_URL = "redis://localhost:6379"` | `rateLimiter.ts:12` | **Layer 3 Hook** | `pre:bash:dispatcher` blocks `npm start` |
| Unsafe TS cast `as string` on header | `rateLimiter.ts:35` | **Layer 3 Hook** | `post:edit:typecheck` fires after file save |
| Missing `Retry-After` header on 429 | `rateLimiter.ts:52` | **Layer 2 Agent** | `code-reviewer` flags RFC 6585 violation |
| IP key from `X-Forwarded-For` (spoofable) | `rateLimiter.ts:35` | **Layer 2 Agent** | `security-reviewer` flags OWASP A05 |
| No adversarial test for IP spoofing | `tests/` | **Layer 1 Skill** | `tdd-workflow` checklist requires it |

## Run the Tests

```bash
cd demo/app
npm install
npm test
```

Expected: all tests pass, ≥80% line coverage.

```bash
npx tsc --noEmit
```

Expected: 1 error in `rateLimiter.ts` (TS2352, the deliberate bug), 0 errors in `rateLimiter.fixed.ts`.

## Reading Order

1. `SHOWCASE.md` — the linear narrative, step by step
2. `app/src/middleware/rateLimiter.ts` — spot the bugs
3. `.ecc/layer1-skills.md` — what skills injected
4. `.ecc/layer2-agents.md` — what agents found
5. `.ecc/layer3-hooks.md` — what hooks caught
6. `app/src/middleware/rateLimiter.fixed.ts` — end state, all bugs resolved
7. `app/tests/rateLimiter.test.ts` — tests written before implementation
