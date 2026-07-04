/**
 * Rate Limiting Utility
 * 
 * Simple in-memory rate limiter for API routes.
 * For production at scale, consider Redis-based rate limiting.
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Rate limit by identifier (user ID, IP, etc.)
 * 
 * @param identifier - Unique identifier (userId, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining count
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 requests per minute
  }
): RateLimitResult {
  const now = Date.now()
  const key = `${identifier}`

  // Initialize or get existing record
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 0,
      resetTime: now + config.interval,
    }
  }

  // Increment counter
  store[key].count++

  const success = store[key].count <= config.uniqueTokenPerInterval
  const remaining = Math.max(0, config.uniqueTokenPerInterval - store[key].count)

  return {
    success,
    limit: config.uniqueTokenPerInterval,
    remaining,
    reset: store[key].resetTime,
  }
}

/**
 * Rate limit middleware for Next.js API routes
 * 
 * @param identifier - Unique identifier
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null if allowed
 */
export function checkRateLimit(
  identifier: string,
  config?: RateLimitConfig
): Response | null {
  const result = rateLimit(identifier, config)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${Math.ceil(
          (result.reset - Date.now()) / 1000
        )} seconds.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return null
}

/**
 * Get client IP address from request
 * 
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIP(request: Request): string {
  // Try various headers in order of preference
  const headers = request.headers
  
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  )
}
