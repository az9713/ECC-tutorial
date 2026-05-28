# Layer 2 — Agents: Isolated Execution

Two agent invocations after implementation. Each agent ran in an isolated child
context — only receiving the files it needed, not the full session history.

---

## Invocation 1: `/code-review`

**Agent spawned:** `code-reviewer`
**Model:** sonnet
**Tools granted:** Read, Grep, Glob (read-only — cannot modify files)
**Files read:** `src/middleware/rateLimiter.ts`, `src/routes/api.ts`, `tests/rateLimiter.test.ts`
**Context consumed by main session:** 1 message (the findings below)

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
        If you need to support a reverse proxy, gate behind a trustProxy
        option that must be explicitly opted in.

[MED]   src/middleware/rateLimiter.ts:50
        TypeScript assignment `const ip: string = req.headers['x-forwarded-for']` is unsafe.
        The header type is string | string[] | undefined. Direct assignment to string
        doesn't handle the array or undefined cases — silently wrong at runtime.
        (Also caught by post:edit:typecheck hook — see Layer 3.)

[LOW]   tests/rateLimiter.test.ts
        No test covering the X-Forwarded-For spoofing scenario.
        An adversarial test should verify that forging this header when
        trustProxy=false does NOT bypass the rate limit.

──────────────────────────────────────────────────────────────
Summary
──────────────────────────────────────────────────────────────
  Findings:   1 HIGH · 2 MED · 1 LOW
  Coverage:   tests present but missing adversarial case
  VERDICT:    ⚠ WARNING — resolve HIGH before merge
──────────────────────────────────────────────────────────────
```

---

## Invocation 2: `/security-scan`

**Agent spawned:** `security-reviewer`
**Model:** sonnet
**Tools granted:** Read, Grep, Glob, Bash (runs `grep` patterns for secrets)
**Files read:** `src/middleware/rateLimiter.ts`, `src/index.ts`, `.env.example`
**Context consumed by main session:** 1 message (the findings below)

```
──────────────────────────────────────────────────────────────
ECC security-reviewer — scan complete
──────────────────────────────────────────────────────────────

[CRITICAL]  src/middleware/rateLimiter.ts:12
            Hardcoded connection string detected.

              const REDIS_URL = "redis://localhost:6379"

            This exposes infrastructure topology in source code. If this file
            is committed and the repo becomes public (even briefly), attackers
            can target your Redis instance. Connection strings belong in
            environment variables.

            Fix: remove line 12. Use process.env.REDIS_URL where needed.
            Verify: grep -r "redis://" src/ should return no matches.

[HIGH]      src/middleware/rateLimiter.ts:35
            OWASP A05 — Security Misconfiguration: IP spoofing via
            X-Forwarded-For.

            Attacker flow:
              1. Set header: X-Forwarded-For: <fresh IP>
              2. Make request — rate limit key resolves to fresh IP
              3. Rotate header with each request
              4. Rate limiting completely bypassed

            This renders the rate limiter ineffective against any attacker
            who can set HTTP headers (i.e., every attacker).

            Fix: use req.socket.remoteAddress as the default IP key.
            Only read X-Forwarded-For when trustProxy=true AND the app
            is behind a verified reverse proxy that strips client-set headers.

[INFO]      .env.example
            REDIS_URL correctly commented out with guidance.
            Ensure .env is in .gitignore before first commit.

──────────────────────────────────────────────────────────────
Summary
──────────────────────────────────────────────────────────────
  CRITICAL:   1 (hardcoded secret)
  HIGH:       1 (IP spoofing — OWASP A05)
  INFO:       1
  VERDICT:    🚫 BLOCK — CRITICAL finding must be resolved before deploy
──────────────────────────────────────────────────────────────
```

---

## What agents provided that skills and hooks couldn't

| | Skills (Layer 1) | Hooks (Layer 3) | Agents (Layer 2) |
|--|-----------------|----------------|-----------------|
| Knew rate limit headers should include Retry-After | ✓ injected the standard | ✗ | ✓ confirmed missing in code |
| Caught the missing header in actual code | ✗ | ✗ | ✓ line 52, exact fix |
| Knew X-Forwarded-For is spoofable | ✓ injected the checklist | ✗ | ✓ described full attack flow |
| Validated the spoofing risk in actual code | ✗ | ✗ | ✓ line 35, rated OWASP A05 |
| Cost to main session context | 0 tokens | 0 tokens | 2 messages total |

Agents consumed a combined ~4,000 tokens across 2 invocations.
The main session received only the findings — not the 9 file reads the agents performed.
