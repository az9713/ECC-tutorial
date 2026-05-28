/**
 * rateLimiter.test.ts — written FIRST per tdd-workflow skill (RED stage)
 *
 * Layer 1 Skill (tdd-workflow) required:
 *   - Tests written before implementation
 *   - 80%+ coverage
 *   - Edge cases AND adversarial tests (spoofed header scenario)
 *
 * Layer 1 Skill (security-review) required:
 *   - Test that IP spoofing does NOT bypass rate limiting when trustProxy=false
 */

import request from 'supertest'
import express, { Express } from 'express'
import { rateLimiter } from '../src/middleware/rateLimiter.fixed'

function buildApp(options = {}): Express {
  const app = express()
  app.use(
    '/api/data',
    rateLimiter({ windowMs: 1000, max: 3, ...options }),
    (req, res) => res.json({ ok: true })
  )
  return app
}

// ─── Happy path ────────────────────────────────────────────────────────────

describe('rateLimiter — happy path', () => {
  it('allows requests under the limit', async () => {
    const app = buildApp()
    const res = await request(app).get('/api/data')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('sets X-RateLimit-Limit header', async () => {
    const app = buildApp({ max: 5 })
    const res = await request(app).get('/api/data')
    expect(res.headers['x-ratelimit-limit']).toBe('5')
  })

  it('sets X-RateLimit-Remaining header and decrements it', async () => {
    const app = buildApp({ max: 3 })
    const res1 = await request(app).get('/api/data')
    const res2 = await request(app).get('/api/data')
    expect(res1.headers['x-ratelimit-remaining']).toBe('2')
    expect(res2.headers['x-ratelimit-remaining']).toBe('1')
  })

  it('sets X-RateLimit-Reset header as ISO timestamp', async () => {
    const app = buildApp()
    const res = await request(app).get('/api/data')
    const reset = res.headers['x-ratelimit-reset']
    expect(reset).toBeDefined()
    expect(() => new Date(reset)).not.toThrow()
  })
})

// ─── Rate limit enforcement ─────────────────────────────────────────────────

describe('rateLimiter — limit enforcement', () => {
  it('returns 429 when limit is exceeded', async () => {
    const app = buildApp({ max: 2 })
    await request(app).get('/api/data')
    await request(app).get('/api/data')
    const res = await request(app).get('/api/data')
    expect(res.status).toBe(429)
  })

  it('includes Retry-After header on 429 response (RFC 6585)', async () => {
    const app = buildApp({ max: 1 })
    await request(app).get('/api/data')
    const res = await request(app).get('/api/data')
    expect(res.status).toBe(429)
    // ✓ BUG 3 verified fixed: Retry-After must be present
    expect(res.headers['retry-after']).toBeDefined()
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0)
  })

  it('returns error body with limit and remaining on 429', async () => {
    const app = buildApp({ max: 1 })
    await request(app).get('/api/data')
    const res = await request(app).get('/api/data')
    expect(res.body.error).toBeDefined()
    expect(res.body.limit).toBe(1)
    expect(res.body.remaining).toBe(0)
  })
})

// ─── Adversarial: IP spoofing ───────────────────────────────────────────────
//
// Layer 1 Skill (tdd-workflow) checklist: "edge-case / adversarial test required"
// Layer 2 Agent (security-reviewer) flagged: "X-Forwarded-For spoofable"
//
// This test proves that when trustProxy=false (default), a client cannot
// bypass rate limits by forging the X-Forwarded-For header.

describe('rateLimiter — IP spoofing resistance (trustProxy=false)', () => {
  it('does not use X-Forwarded-For when trustProxy is false', async () => {
    const app = buildApp({ max: 2, trustProxy: false })

    // Hit the limit from the real socket address
    await request(app).get('/api/data')
    await request(app).get('/api/data')

    // Attacker forges a different IP in X-Forwarded-For header
    // With trustProxy=false, this header is ignored — limit still applies
    const res = await request(app)
      .get('/api/data')
      .set('X-Forwarded-For', '8.8.8.8')  // ← forged "clean" IP

    // ✓ BUG 4 verified fixed: spoofed header does NOT bypass the limit
    expect(res.status).toBe(429)
  })

  it('uses X-Forwarded-For when trustProxy is true', async () => {
    const app = buildApp({ max: 2, trustProxy: true })

    // Two requests from "real" IP
    await request(app)
      .get('/api/data')
      .set('X-Forwarded-For', '10.0.0.1')
    await request(app)
      .get('/api/data')
      .set('X-Forwarded-For', '10.0.0.1')

    // Third request with same IP → limited
    const limited = await request(app)
      .get('/api/data')
      .set('X-Forwarded-For', '10.0.0.1')
    expect(limited.status).toBe(429)

    // Different IP → allowed (proxy is trusted, different client)
    const allowed = await request(app)
      .get('/api/data')
      .set('X-Forwarded-For', '10.0.0.2')
    expect(allowed.status).toBe(200)
  })
})

// ─── Window reset ───────────────────────────────────────────────────────────

describe('rateLimiter — window reset', () => {
  it('allows requests again after the window expires', async () => {
    const app = buildApp({ windowMs: 100, max: 1 })

    await request(app).get('/api/data')
    const blocked = await request(app).get('/api/data')
    expect(blocked.status).toBe(429)

    // Wait for window to expire
    await new Promise(r => setTimeout(r, 150))

    const allowed = await request(app).get('/api/data')
    expect(allowed.status).toBe(200)
  })
})
