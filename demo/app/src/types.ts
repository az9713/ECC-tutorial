/**
 * A single window entry in the rate limit store.
 */
export interface WindowEntry {
  count: number
  resetAt: number
}

/**
 * In-memory store mapping client keys to their window entries.
 */
export type RateLimitStore = Map<string, WindowEntry>

/**
 * Options for configuring the rate limiter middleware.
 */
export interface RateLimitOptions {
  /** Duration of the sliding window in milliseconds. Default: 60000 (1 minute). */
  windowMs: number
  /** Maximum number of requests allowed per window. Default: 10. */
  max: number
  /** Custom message sent when limit is exceeded. */
  message?: string
  /**
   * When true, trust X-Forwarded-For header for client IP.
   * Only enable if your app sits behind a trusted reverse proxy.
   * Default: false.
   */
  trustProxy?: boolean
}
