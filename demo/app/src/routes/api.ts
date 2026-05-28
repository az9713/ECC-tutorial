import { Router } from 'express'
import { rateLimiter } from '../middleware/rateLimiter.fixed'

const router = Router()

const limiter = rateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '10'),
  message: 'Rate limit exceeded. Check the Retry-After header.',
  trustProxy: false, // Set to true only behind a trusted reverse proxy
})

/**
 * GET /api/data
 * Rate-limited endpoint. Returns sample data.
 */
router.get('/data', limiter, (req, res) => {
  res.json({
    message: 'Success',
    data: { value: 42, timestamp: new Date().toISOString() },
  })
})

/**
 * GET /api/health
 * Health check — not rate limited.
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

export default router
