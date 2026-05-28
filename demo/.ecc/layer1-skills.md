# Layer 1 — Skills: Knowledge Injected

Skills activated automatically when the developer described the task:
**"Add rate limiting to our Express API"**

No invocation required. Context matched 4 skills.

---

## `tdd-workflow` activated

```
name: tdd-workflow
description: Use this skill when writing new features, fixing bugs, or refactoring
code. Enforces test-driven development with 80%+ coverage including unit,
integration, and E2E tests.
```

**What it injected for this task:**

> Write the test file FIRST. Do not touch `rateLimiter.ts` until you have
> a failing test that defines the expected behavior.
>
> Required test cases for rate limiting:
> - Happy path: requests under the limit → 200
> - Limit hit: Nth+1 request → 429
> - Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset present
> - Reset: requests allowed again after window expires
> - **Edge case / adversarial: spoofed X-Forwarded-For header does NOT bypass limit**
>
> Coverage requirement: 80%+ lines on `src/middleware/`.
> If no adversarial test exists, coverage requirement is not met.

**Impact on this demo:**
→ `tests/rateLimiter.test.ts` written before `rateLimiter.ts`
→ Adversarial test `'does not use X-Forwarded-For when trustProxy is false'` added
→ Caught **Bug 5**: missing spoofing test

---

## `backend-patterns` activated

```
name: backend-patterns
description: Backend architecture patterns, API design, database optimization,
and server-side best practices for Node.js, Express, and middleware.
```

**What it injected for this task:**

> **Rate limiting patterns — choose the right algorithm:**
>
> | Algorithm | Best for | Tradeoff |
> |-----------|---------|----------|
> | Fixed window | Simple, low memory | Burst attacks at window boundary |
> | Sliding window | Smooth enforcement | Slightly higher memory |
> | Token bucket | Bursty legitimate traffic | More complex |
>
> **Redis key design (if using Redis):**
> ```
> rate:{userId}:{windowStart}   ← per-user, per-window
> rate:{ip}:{windowStart}       ← per-IP (use socket addr, not X-Forwarded-For)
> ```
>
> **In-memory store (dev/single-instance):**
> Use `Map<string, WindowEntry>`. Sufficient for demos and single-node apps.
> For production multi-instance: Redis with INCR + EXPIRE.

**Impact on this demo:**
→ Sliding window with in-memory Map chosen (self-contained, no deps)
→ Key design uses socket address, not X-Forwarded-For

---

## `api-design` activated

```
name: api-design
description: REST API design patterns, status codes, pagination, error
responses, and standard headers for Express/Node.js APIs.
```

**What it injected for this task:**

> **Rate limit response headers (RFC 6585 + IETF draft-ietf-httpapi-ratelimit-headers):**
>
> ```
> X-RateLimit-Limit:     10          ← max requests per window
> X-RateLimit-Remaining: 7           ← requests left this window
> X-RateLimit-Reset:     2024-01-15T10:30:00.000Z  ← when window resets
> Retry-After:           42          ← seconds until retry (REQUIRED on 429)
> ```
>
> **429 response body:**
> ```json
> {
>   "error": "Too many requests",
>   "limit": 10,
>   "remaining": 0,
>   "retryAfter": 42
> }
> ```
>
> `Retry-After` is MANDATORY on 429. Without it, well-behaved clients
> cannot implement backoff. RFC 6585, Section 4.

**Impact on this demo:**
→ All 4 headers added to `rateLimiter.fixed.ts`
→ `Retry-After` absence flagged by `code-reviewer` agent (Layer 2)
→ Caught **Bug 3**

---

## `security-review` activated

```
name: security-review
description: Use this skill when adding authentication, handling user input,
working with secrets, creating API endpoints, or implementing payment/sensitive
features. Provides comprehensive security checklist and patterns.
```

**What it injected for this task:**

> **OWASP A05 — Security Misconfiguration: rate limiting checklist**
>
> - [ ] Rate limit key is NOT derived from client-controlled headers alone
> - [ ] X-Forwarded-For only trusted when app sits behind verified reverse proxy
> - [ ] No hardcoded connection strings (Redis URL, DB URL)
> - [ ] Error response does not leak internal paths or stack traces
> - [ ] Rate limit applies before auth check (prevents enumeration attacks)
>
> **Never do this:**
> ```typescript
> const ip = req.headers['x-forwarded-for'] as string  // spoofable
> const REDIS_URL = "redis://localhost:6379"            // hardcoded secret
> ```
>
> **Always do this:**
> ```typescript
> const ip = req.socket.remoteAddress  // authoritative, not spoofable
> const redisUrl = process.env.REDIS_URL  // from environment
> ```

**Impact on this demo:**
→ Checklist drove review criteria for `security-reviewer` agent (Layer 2)
→ IP spoofing risk flagged
→ Hardcoded REDIS_URL flagged
→ Caught **Bug 1** and **Bug 4**
