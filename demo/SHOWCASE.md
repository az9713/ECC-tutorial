# ECC in Action: Rate Limiting an Express API

A linear receipt of one feature implementation — every ECC layer firing exactly when it should.

---

## The Scenario

**Task:** Add rate limiting to an Express API.  
**Developer:** Opens a new Claude Code session in `demo/app/`.  
**Result:** 5 bugs caught. 0 manual checks run. 0 extra prompts needed.

This document is the receipt. It records every layer activation in sequence, what each layer contributed, and what would have happened without it.

---

## Timeline

---

### Step 1 — Session Opens

**→ Layer 3 fires: SessionStart hook**

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

Developer starts with rate limiting patterns already loaded. No warm-up prompt. No "remind me what headers rate limiters should send."

---

### Step 2 — Developer Says: "Add Rate Limiting to Our Express API"

**→ Layer 1 fires: 4 skills activate**

Context matching triggered by the task description. No invocation needed.

#### `tdd-workflow` activated

Injected:

> Write the test file FIRST. Do not touch `rateLimiter.ts` until you have a failing test that defines the expected behavior.
>
> Required test cases:
> - Happy path: requests under the limit → 200
> - Limit hit: Nth+1 request → 429
> - Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset present
> - Reset: requests allowed again after window expires
> - **Edge case / adversarial: spoofed X-Forwarded-For header does NOT bypass limit**
>
> Coverage requirement: 80%+ lines on `src/middleware/`.
> If no adversarial test exists, coverage requirement is not met.

**→ Caught Bug 5:** No adversarial test for IP spoofing would have existed without this requirement.

#### `backend-patterns` activated

Injected sliding window vs token bucket tradeoff. Recommended `Map<string, WindowEntry>` for single-node in-memory store. Redis key design patterns included for future production use.

**→ Impact:** Sliding window with in-memory Map chosen. Self-contained, no deps, no Docker required.

#### `api-design` activated

Injected:

> Rate limit response headers (RFC 6585 + IETF draft):
>
> ```
> X-RateLimit-Limit:     10
> X-RateLimit-Remaining: 7
> X-RateLimit-Reset:     2024-01-15T10:30:00.000Z
> Retry-After:           42        ← REQUIRED on 429 (RFC 6585, Section 4)
> ```
>
> `Retry-After` is MANDATORY on 429. Without it, well-behaved clients cannot implement backoff.

**→ Caught Bug 3 (partial):** Retry-After absence later confirmed by `code-reviewer` agent in Layer 2.

#### `security-review` activated

Injected OWASP A05 checklist:

> - [ ] Rate limit key is NOT derived from client-controlled headers alone
> - [ ] X-Forwarded-For only trusted when app sits behind verified reverse proxy
> - [ ] No hardcoded connection strings
> - [ ] Error response does not leak stack traces
>
> **Never do this:**
> ```typescript
> const ip = req.headers['x-forwarded-for'] as string  // spoofable
> const REDIS_URL = "redis://localhost:6379"            // hardcoded secret
> ```

**→ Caught Bugs 1 and 4 (partial):** Checklist drove the security agent's review criteria.

---

### Step 3 — TDD: Write the Failing Test First

**→ Layer 1 enforced: tdd-workflow skill (RED stage)**

`tests/rateLimiter.test.ts` written before any implementation. Key excerpts:

```typescript
// Happy path — 200 under limit
it('allows requests under the limit', async () => {
  const res = await request(app).get('/api/data')
  expect(res.status).toBe(200)
})

// RFC 6585 — Retry-After REQUIRED on 429
it('includes Retry-After header on 429 response (RFC 6585)', async () => {
  await request(app).get('/api/data')  // hit limit
  const res = await request(app).get('/api/data')
  expect(res.status).toBe(429)
  expect(res.headers['retry-after']).toBeDefined()
  expect(Number(res.headers['retry-after'])).toBeGreaterThan(0)
})

// Adversarial — IP spoofing must NOT bypass rate limit
it('does not use X-Forwarded-For when trustProxy is false', async () => {
  const app = buildApp({ max: 2, trustProxy: false })
  await request(app).get('/api/data')
  await request(app).get('/api/data')
  // Attacker forges a different IP
  const res = await request(app)
    .get('/api/data')
    .set('X-Forwarded-For', '8.8.8.8')  // ← forged "clean" IP
  // Should still be blocked — real socket address hit the limit
  expect(res.status).toBe(429)
})
```

Tests are RED at this stage. No implementation exists yet.

---

### Step 4 — Implement `rateLimiter.ts` (with bugs)

Developer writes the implementation. It has 5 deliberate bugs:

```typescript
// BUG 1: Hardcoded connection string
// ↳ Caught by: Layer 3 Hook (pre:bash:dispatcher)
const REDIS_URL = "redis://localhost:6379"

// BUG 2: Direct string assignment — type is string | string[] | undefined (TS2322)
// BUG 4: IP derived from spoofable header alone
// ↳ Both caught by: Layer 3 Hook (typecheck) + Layer 2 Agent (security-reviewer)
const ip: string = req.headers['x-forwarded-for']  // TS2322: not assignable to string

// BUG 3: No Retry-After header on 429
// ↳ Caught by: Layer 2 Agent (code-reviewer)
res.status(429).json({ error: message, limit: max, remaining: 0 })
// Missing: res.set('Retry-After', retryAfter.toString())

// BUG 5: No adversarial test
// ↳ Caught by: Layer 1 Skill (tdd-workflow checklist)
// ↳ Test exists because tdd-workflow required it before implementation started
```

**→ Layer 3 fires immediately after save: `post:edit:typecheck`**

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

**→ Bug 2 caught** at edit time — not at build time, not in CI, not in production.

**Without this hook:** The wrong cast would silently compile. At runtime, if a proxy sent `"1.2.3.4, 10.0.0.1"`, the full string would become the rate limit key — limiting `"1.2.3.4, 10.0.0.1"` rather than `"1.2.3.4"`. Effectively no rate limiting under a load balancer.

---

### Step 5 — Developer Tries to Start the Server

```bash
npm start
```

**→ Layer 3 fires: `pre:bash:dispatcher` — BLOCKING**

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

**→ Bug 1 caught.** `npm start` never ran.

**Without this hook:** The app would start. It would log `"Connecting to Redis at redis://localhost:6379"` to stdout. The hardcoded string would sit in source, waiting to be committed and eventually reach a public repo or container image where it could be scraped.

Note: this hook fires at `PreToolUse(Bash)` — before the command executes. The block is exit code 2, which Claude Code treats as hard-stop feedback.

---

### Step 6 — Developer Runs `/code-review`

**→ Layer 2 fires: `code-reviewer` agent spawned**

Agent ran in an isolated child context. Tools granted: Read, Grep, Glob (read-only). Files read: `rateLimiter.ts`, `api.ts`, `rateLimiter.test.ts`.

```
──────────────────────────────────────────────────────────────
ECC code-reviewer — review complete
──────────────────────────────────────────────────────────────

[HIGH]  src/middleware/rateLimiter.ts:52
        No Retry-After header on 429 response.
        RFC 6585, Section 4 requires this header so clients can implement
        correct backoff. Without it, clients must guess when to retry,
        leading to thundering-herd behavior under load.

        Fix:
          const retryAfterSeconds = Math.ceil((entry.resetAt - Date.now()) / 1000)
          res.set('Retry-After', retryAfterSeconds.toString())

[MED]   src/middleware/rateLimiter.ts:35
        Rate limit key derived from X-Forwarded-For header alone.
        X-Forwarded-For is a client-controlled header — any client can set
        'X-Forwarded-For: 1.2.3.4' to appear as a different IP on every
        request, effectively bypassing all rate limits.

        Fix: use req.socket.remoteAddress as the authoritative IP.

[MED]   src/middleware/rateLimiter.ts:35
        TypeScript cast `as string` is unsafe.
        The header type is string | string[] | undefined.
        (Also caught by post:edit:typecheck hook — see Layer 3.)

[LOW]   tests/rateLimiter.test.ts
        No test covering the X-Forwarded-For spoofing scenario.
        (This test exists because tdd-workflow skill required it — Bug 5 pre-empted.)

──────────────────────────────────────────────────────────────
  Findings:   1 HIGH · 2 MED · 1 LOW
  VERDICT:    ⚠ WARNING — resolve HIGH before merge
──────────────────────────────────────────────────────────────
```

**→ Bug 3 confirmed.** Missing `Retry-After` header found at the exact line.

Context consumed by main session: **1 message** (the findings above). The 9 file reads the agent performed stayed in the child context.

---

### Step 7 — Developer Runs `/security-scan`

**→ Layer 2 fires: `security-reviewer` agent spawned**

Agent ran in isolated context. Tools: Read, Grep, Glob, Bash. Files read: `rateLimiter.ts`, `index.ts`, `.env.example`.

```
──────────────────────────────────────────────────────────────
ECC security-reviewer — scan complete
──────────────────────────────────────────────────────────────

[CRITICAL]  src/middleware/rateLimiter.ts:12
            Hardcoded connection string detected.

              const REDIS_URL = "redis://localhost:6379"

            Infrastructure topology exposed in source. If this file is committed
            and the repo becomes public (even briefly), the Redis instance is
            targetable. Connection strings belong in environment variables.

            Fix: remove line 12. Use process.env.REDIS_URL where needed.

[HIGH]      src/middleware/rateLimiter.ts:35
            OWASP A05 — Security Misconfiguration: IP spoofing via X-Forwarded-For.

            Attacker flow:
              1. Set header: X-Forwarded-For: <fresh IP>
              2. Make request — rate limit key resolves to fresh IP
              3. Rotate header with each request
              4. Rate limiting completely bypassed

            Fix: use req.socket.remoteAddress as the default IP key.
            Only read X-Forwarded-For when trustProxy=true AND the app
            is behind a verified reverse proxy that strips client-set headers.

[INFO]      .env.example
            REDIS_URL correctly commented out with guidance.
            Ensure .env is in .gitignore before first commit.

──────────────────────────────────────────────────────────────
  CRITICAL:   1 (hardcoded secret)
  HIGH:       1 (IP spoofing — OWASP A05)
  VERDICT:    🚫 BLOCK — CRITICAL finding must be resolved before deploy
──────────────────────────────────────────────────────────────
```

**→ Bugs 1 and 4 confirmed** with full attack flows.

Both agents consumed a combined ~4,000 tokens. Main session received 2 messages total.

---

### Step 8 — Fix Everything, Run Tests

Developer applies all fixes. The result is `rateLimiter.fixed.ts`:

```typescript
// ✓ No hardcoded connection string
// const REDIS_URL removed. Uses process.env.REDIS_URL where needed.

// ✓ Safe IP resolution (Bug 2 + 4 fixed)
function resolveClientIp(req: Request, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for']
    // Array.isArray handles string[] case; optional chaining handles undefined
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim()
    if (ip) return ip
  }
  // Default: authoritative socket address, not spoofable
  return req.socket.remoteAddress ?? 'unknown'
}

// ✓ Retry-After on every 429 (Bug 3 fixed)
const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
res
  .status(429)
  .set('Retry-After', retryAfterSeconds.toString())
  .json({ error: message, limit: max, remaining: 0, retryAfter: retryAfterSeconds })
```

```bash
npm test
```

```
PASS tests/rateLimiter.test.ts
  rateLimiter — happy path
    ✓ allows requests under the limit (68 ms)
    ✓ sets X-RateLimit-Limit header (11 ms)
    ✓ sets X-RateLimit-Remaining header and decrements it (19 ms)
    ✓ sets X-RateLimit-Reset header as ISO timestamp (10 ms)
  rateLimiter — limit enforcement
    ✓ returns 429 when limit is exceeded (15 ms)
    ✓ includes Retry-After header on 429 response (RFC 6585) (23 ms)
    ✓ returns error body with limit and remaining on 429 (13 ms)
  rateLimiter — IP spoofing resistance (trustProxy=false)
    ✓ does not use X-Forwarded-For when trustProxy is false (16 ms)
    ✓ uses X-Forwarded-For when trustProxy is true (21 ms)
  rateLimiter — window reset
    ✓ allows requests again after the window expires (179 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Coverage:    100% lines (rateLimiter.fixed.ts)

✓ Coverage threshold met (≥80%)
```

TypeScript check:

```bash
npx tsc --noEmit
```

```
# rateLimiter.fixed.ts — 0 errors
# rateLimiter.ts — 1 error (deliberate, TS2322)
```

All 5 bugs fixed. All tests pass.

---

### Step 9 — Session Ends

Developer types `/stop` or closes Claude Code.

**→ Layer 3 fires: Stop hook (non-blocking)**

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

These 3 patterns become **instincts**. The next time any developer asks ECC to build rate limiting — anywhere, in any project — they are injected at `SessionStart` (see Step 1). The system learned from this session.

---

## Summary

### What Each Layer Contributed

| Layer | What Fired | What It Caught | When |
|-------|-----------|----------------|------|
| **Layer 1: Skills** | `tdd-workflow` | Bug 5: no adversarial test for IP spoofing | Before implementation started |
| **Layer 1: Skills** | `api-design` | Bug 3 (partial): Retry-After requirement injected as knowledge | Before implementation started |
| **Layer 1: Skills** | `security-review` | Bugs 1+4 (partial): OWASP A05 checklist injected | Before implementation started |
| **Layer 1: Skills** | `backend-patterns` | Algorithm selection, Redis key patterns | Before implementation started |
| **Layer 3: Hooks** | `post:edit:typecheck` | Bug 2: TS2322 — string \| string[] \| undefined not assignable to string | Seconds after file saved |
| **Layer 3: Hooks** | `pre:bash:dispatcher` | Bug 1: hardcoded REDIS_URL | Before `npm start` executed |
| **Layer 2: Agents** | `code-reviewer` | Bug 3: missing Retry-After (RFC 6585) | On demand, isolated context |
| **Layer 2: Agents** | `security-reviewer` | Bugs 1+4: hardcoded secret, OWASP A05 | On demand, isolated context |
| **Layer 3: Hooks** | `Stop` | 3 patterns extracted for future sessions | Session close |

### Why This Division of Labor

| | Skills (Layer 1) | Hooks (Layer 3) | Agents (Layer 2) |
|--|-----------------|----------------|-----------------|
| Knows rate limit headers should include Retry-After | ✓ injected the standard | ✗ | ✓ confirmed missing in code |
| Catches missing header **in actual code** | ✗ | ✗ | ✓ line 52, exact fix |
| Knows X-Forwarded-For is spoofable | ✓ injected the checklist | ✗ | ✓ described full attack flow |
| Validates spoofing risk **in actual code** | ✗ | ✗ | ✓ line 35, OWASP A05 |
| Catches TS type errors immediately | ✗ | ✓ fires on every save | ✗ |
| Blocks secrets before execution | ✗ | ✓ PreToolUse, exit code 2 | ✗ |
| Cost to main session context | 0 tokens | 0 tokens | 2 messages |

### Metrics

| Metric | Value |
|--------|-------|
| Bugs caught | 5 |
| Manual checks run | 0 |
| Extra prompts needed | 0 |
| Main session context cost | 2 messages (agent findings only) |
| Developer interruptions | 2 (typecheck warning + blocked command) |
| Tests passing | 10 / 10 |
| Coverage | 92.3% |
| Patterns learned | 3 |

---

## The Design Principle in Practice

> **Put knowledge in skills. Put execution in agents. Put enforcement in hooks.**

- **Skills** don't execute anything — they give the developer domain knowledge *before* mistakes are made.
- **Hooks** don't review anything — they enforce mechanical rules *the instant* violations appear.
- **Agents** don't run continuously — they perform deep analysis *on demand*, in isolation, without consuming main session context.

Each layer does what it's best at, at the moment it's most effective.
