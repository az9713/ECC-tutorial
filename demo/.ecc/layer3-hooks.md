# Layer 3 — Hooks: Automatic Enforcement

Hooks fired at 4 points during the session — no manual invocation required.

---

## Hook 1: SessionStart

**Trigger:** New Claude Code session opened in `demo/app/`
**Script:** `scripts/hooks/session-start.js`
**Phase:** SessionStart

```
──────────────────────────────────────────────────────────────
[ECC SessionStart] Loading project context...
──────────────────────────────────────────────────────────────
  ✓ Project detected:   express-rate-limit-demo
  ✓ Package manager:    npm (detected from package-lock.json)
  ✓ Skills loaded:      tdd-workflow, backend-patterns, api-design, security-review
  ✓ Session instincts:  2 relevant patterns from previous sessions
      - "Express middleware: extract IP safely with socket fallback"
      - "Rate limiting: always add Retry-After on 429"
  ✓ Context injected:   1,840 chars (within ECC_SESSION_START_MAX_CHARS=8000)
──────────────────────────────────────────────────────────────
```

**Effect:** Developer starts with domain knowledge already loaded. No "remind me of the rate limit header standard" prompt needed.

---

## Hook 2: `post:edit:typecheck` — after saving `rateLimiter.ts`

**Trigger:** Developer saves `src/middleware/rateLimiter.ts`
**Tool event:** `PostToolUse(Edit)`
**Matcher:** `Edit|Write` on `.ts` files
**Script:** `scripts/hooks/quality-gate.js`
**Phase:** PostToolUse (non-blocking)

```
──────────────────────────────────────────────────────────────
[Hook: post:edit:typecheck] Running TypeScript check...
──────────────────────────────────────────────────────────────
src/middleware/rateLimiter.ts(50,22): error TS2322:
  Type 'string | string[] | undefined' is not assignable to type 'string'.
    Type 'undefined' is not assignable to type 'string'.

  const ip: string = req.headers['x-forwarded-for']
                     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

1 error found.
──────────────────────────────────────────────────────────────
```

**Effect:** TypeScript error surfaced at edit time — not at build time, not in CI, not in production. Bug 2 caught within seconds of being written.

**Without this hook:** The wrong cast would silently compile. At runtime, if a proxy sent a comma-separated list (`"1.2.3.4, 10.0.0.1"`), the IP key would include the full string, making rate limiting per-string rather than per-IP — a subtle bug that would only appear under a load balancer.

---

## Hook 3: `pre:bash:dispatcher` — blocked before `npm start`

**Trigger:** Developer runs `npm start` in the terminal
**Tool event:** `PreToolUse(Bash)`
**Matcher:** `Bash`
**Script:** `scripts/hooks/bash-hook-dispatcher.js` → `pre-bash-secret-check.js`
**Phase:** PreToolUse (**blocking** — exit code 2)

```
──────────────────────────────────────────────────────────────
[Hook: pre:bash:secret-check] ❌ BLOCKED
──────────────────────────────────────────────────────────────
  Hardcoded connection string detected before command execution.

  File:    src/middleware/rateLimiter.ts
  Line:    12
  Pattern: redis://[a-zA-Z0-9./:-]+  (connection string)
  Found:   const REDIS_URL = "redis://localhost:6379"

  Connection strings must not be hardcoded in source files.
  Move to environment variable: process.env.REDIS_URL
  Add to .env.example with a comment explaining the format.

  Command blocked. Fix the issue above and retry.
──────────────────────────────────────────────────────────────
```

**Effect:** `npm start` never ran. The hardcoded secret was caught before the process started — before it could be logged to stdout, before it could appear in container logs, before it could be scraped.

**Without this hook:** The app would start, log "Connecting to Redis at redis://localhost:6379" to stdout, and the hardcoded string would sit in the source file waiting to be committed.

---

## Hook 4: Stop — session end (pattern extraction)

**Trigger:** Session ends (developer types `/stop` or closes Claude Code)
**Script:** `scripts/hooks/session-end.js` + `scripts/hooks/evaluate-session.js`
**Phase:** Stop

```
──────────────────────────────────────────────────────────────
[ECC Stop] Session complete. Extracting patterns...
──────────────────────────────────────────────────────────────
  Files modified:
    ✓ src/middleware/rateLimiter.ts
    ✓ src/middleware/rateLimiter.fixed.ts
    ✓ tests/rateLimiter.test.ts

  Patterns extracted (continuous learning):
    ✓ "Express rate limiter: sliding window with in-memory Map"
      confidence: 0.91 · saved to ~/.claude/homunculus/instincts/

    ✓ "IP resolution: socket.remoteAddress fallback when trustProxy=false"
      confidence: 0.88 · saved to ~/.claude/homunculus/instincts/

    ✓ "RFC 6585: always add Retry-After on 429 response"
      confidence: 0.94 · saved to ~/.claude/homunculus/instincts/

  Session saved: ~/.claude/sessions/express-rate-limit-demo-<timestamp>.json
──────────────────────────────────────────────────────────────
```

**Effect:** The three bugs caught in this session become instincts. Next time someone asks ECC to build rate limiting — anywhere — these patterns are injected at SessionStart (see Hook 1). The system learns from every session.

---

## Hook summary

| Hook | Trigger | Phase | Blocking? | What it caught |
|------|---------|-------|-----------|----------------|
| SessionStart | Session open | SessionStart | No | Loaded context + instincts |
| post:edit:typecheck | Save rateLimiter.ts | PostToolUse | No | TS2322: string | string[] | undefined not assignable to string (Bug 2) |
| pre:bash:dispatcher | `npm start` | PreToolUse | **Yes** | Hardcoded REDIS_URL (Bug 1) |
| Stop | Session end | Stop | No | Extracted 3 patterns for future sessions |

**Total developer interruptions:** 2 (typecheck warning + blocked command)
**Total manual checks run:** 0
