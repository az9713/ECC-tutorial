/**
 * rateLimiter.ts — BUGGED VERSION
 *
 * This file contains deliberate bugs that ECC's 3 layers catch:
 *
 *   BUG 1 (line 12): Hardcoded connection string — caught by Layer 3 Hook
 *                    pre:bash:dispatcher blocks `npm start` before it runs.
 *
 *   BUG 2 (line 35): Wrong TypeScript type — caught by Layer 3 Hook
 *                    post:edit:typecheck fires after save, reports TS2322.
 *                    X-Forwarded-For is string | string[] | undefined, not string.
 *
 *   BUG 3 (line 52): No Retry-After header on 429 — caught by Layer 2 Agent
 *                    code-reviewer flags RFC 6585 violation.
 *
 *   BUG 4 (line 35): X-Forwarded-For used as sole IP key — caught by Layer 2 Agent
 *                    security-reviewer flags OWASP A05 spoofing risk.
 *
 *   BUG 5 (tests):   No adversarial test for spoofed header — caught by Layer 1 Skill
 *                    tdd-workflow skill checklist requires edge-case / attack tests.
 *
 * See rateLimiter.fixed.ts for the corrected version.
 */

import { Request, Response, NextFunction } from 'express'
import { RateLimitOptions, RateLimitStore, WindowEntry } from '../types'

// ❌ BUG 1: Hardcoded connection string.
// Layer 3 Hook (pre:bash:dispatcher) will BLOCK `npm start` on this line.
// Fix: move to process.env.REDIS_URL
const REDIS_URL = "redis://localhost:6379"
console.log(`Connecting to Redis at ${REDIS_URL}`)

const store: RateLimitStore = new Map()

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs = 60_000, max = 10, message = 'Too many requests' } = options

  return function (req: Request, res: Response, next: NextFunction): void {
    const now = Date.now()

    // ❌ BUG 2: Wrong TypeScript assignment — TS2322 error.
    // X-Forwarded-For header type is string | string[] | undefined.
    // Assigning directly to string is not type-safe: undefined and string[] cases unhandled.
    // Layer 3 Hook (post:edit:typecheck) fires after save and reports this.
    //
    // ❌ BUG 4: IP key from X-Forwarded-For only — spoofable.
    // Attacker sets 'X-Forwarded-For: 1.2.3.4' and rotates to bypass limits.
    // Layer 2 Agent (security-reviewer) flags OWASP A05 misconfiguration.
    const ip: string = req.headers['x-forwarded-for']

    const key = `rate:${ip}`
    const entry: WindowEntry | undefined = store.get(key)

    if (entry && now < entry.resetAt) {
      entry.count++
      store.set(key, entry)

      if (entry.count > max) {
        // ❌ BUG 3: No Retry-After header.
        // RFC 6585 requires it so clients know when to retry.
        // Layer 2 Agent (code-reviewer) flags this.
        // Fix: res.set('Retry-After', Math.ceil(windowMs / 1000).toString())
        res.status(429).json({
          error: message,
          limit: max,
          remaining: 0,
        })
        return
      }
    } else {
      store.set(key, { count: 1, resetAt: now + windowMs })
    }

    const current = store.get(key)!
    res.set('X-RateLimit-Limit', max.toString())
    res.set('X-RateLimit-Remaining', Math.max(0, max - current.count).toString())
    res.set('X-RateLimit-Reset', new Date(current.resetAt).toISOString())

    next()
  }
}
