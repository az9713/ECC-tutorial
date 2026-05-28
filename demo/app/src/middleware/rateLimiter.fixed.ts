/**
 * rateLimiter.fixed.ts — CLEAN VERSION
 *
 * All bugs from rateLimiter.ts resolved after ECC's 3 layers ran:
 *
 *   ✓ BUG 1 fixed: REDIS_URL removed. Connection config goes in .env.
 *   ✓ BUG 2 fixed: Proper TypeScript — X-Forwarded-For extracted safely as string | string[].
 *   ✓ BUG 3 fixed: Retry-After header added to 429 response (RFC 6585).
 *   ✓ BUG 4 fixed: IP resolution respects trustProxy option.
 *                  When false (default), uses req.socket.remoteAddress — not spoofable.
 *                  When true (opt-in, requires trusted reverse proxy), uses X-Forwarded-For.
 *   ✓ BUG 5 fixed: See rateLimiter.test.ts — adversarial spoofing test added.
 */

import { Request, Response, NextFunction } from 'express'
import { RateLimitOptions, RateLimitStore, WindowEntry } from '../types'

/**
 * Resolve the client IP for rate limiting.
 *
 * When trustProxy is false (default): use the TCP-level socket address.
 * This is not spoofable — it's the actual network connection.
 *
 * When trustProxy is true: read X-Forwarded-For. Only enable this if your
 * app sits behind a trusted reverse proxy (e.g. nginx, AWS ALB) that sets
 * this header and strips any client-supplied values.
 */
function resolveClientIp(req: Request, trustProxy: boolean): string {
  if (trustProxy) {
    const forwarded = req.headers['x-forwarded-for']
    // X-Forwarded-For can be a comma-separated list: "client, proxy1, proxy2"
    // The leftmost value is the originating client IP.
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim()
    if (ip) return ip
  }
  // Authoritative fallback: actual socket address, not spoofable.
  return req.socket.remoteAddress ?? 'unknown'
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs = 60_000,
    max = 10,
    message = 'Too many requests',
    trustProxy = false,
  } = options

  // Store is scoped per rateLimiter() instance — each middleware call gets
  // its own isolated store. This is correct design and enables clean testing.
  const store: RateLimitStore = new Map()

  return function (req: Request, res: Response, next: NextFunction): void {
    const now = Date.now()
    const ip = resolveClientIp(req, trustProxy)
    const key = `rate:${ip}`
    const entry: WindowEntry | undefined = store.get(key)

    if (entry && now < entry.resetAt) {
      entry.count++
      store.set(key, entry)

      if (entry.count > max) {
        // ✓ Retry-After header added — RFC 6585 compliance
        const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
        res.set('Retry-After', retryAfterSeconds.toString())
        res.status(429).json({
          error: message,
          limit: max,
          remaining: 0,
          retryAfter: retryAfterSeconds,
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
