/**
 * Rate Limiting System for Message Attachments
 * 
 * Implements rate limiting based on user plan tiers:
 * - FREE: 15 uploads/minute
 * - PRO: 60 uploads/minute  
 * - BUSINESS: 60 uploads/minute
 * 
 * Uses in-memory storage (suitable for single server).
 * For multi-server deployments, consider Redis.
 * 
 * @module rate-limit
 */

interface RateLimitConfig {
  uploadsPerMinute: number
}

const RATE_LIMITS: Record<'free' | 'pro' | 'business', RateLimitConfig> = {
  free: { uploadsPerMinute: 15 },
  pro: { uploadsPerMinute: 60 },
  business: { uploadsPerMinute: 60 }
}

// In-memory storage for rate limiting
// Key format: "upload:{userId}"
// In production with multiple servers, use Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if user can upload based on rate limits
 * 
 * @param userId - User ID
 * @param planTier - User's plan tier (free, pro, business)
 * @returns Promise with allowed status and metadata
 */
export async function checkRateLimit(
  userId: string,
  planTier: 'free' | 'pro' | 'business' = 'free'
): Promise<{ 
  allowed: boolean
  error?: string
  remaining?: number
  resetIn?: number
  limit?: number
}> {
  const config = RATE_LIMITS[planTier] || RATE_LIMITS.free
  const key = `upload:${userId}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window

  const record = rateLimitStore.get(key)

  // First request or window expired - reset counter
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    
    console.log('[RATE_LIMIT] New window started', {
      userId,
      planTier,
      limit: config.uploadsPerMinute
    })
    
    return {
      allowed: true,
      remaining: config.uploadsPerMinute - 1,
      resetIn: windowMs,
      limit: config.uploadsPerMinute
    }
  }

  // Check if limit exceeded
  if (record.count >= config.uploadsPerMinute) {
    const resetIn = Math.max(0, record.resetTime - now)
    const resetInSeconds = Math.ceil(resetIn / 1000)
    
    console.warn('[RATE_LIMIT] Limit exceeded', {
      userId,
      planTier,
      count: record.count,
      limit: config.uploadsPerMinute,
      resetInSeconds
    })
    
    return {
      allowed: false,
      error: `Rate limit exceeded. You can upload ${config.uploadsPerMinute} files per minute. Try again in ${resetInSeconds} seconds.`,
      remaining: 0,
      resetIn,
      limit: config.uploadsPerMinute
    }
  }

  // Increment counter
  record.count++
  const remaining = config.uploadsPerMinute - record.count
  const resetIn = Math.max(0, record.resetTime - now)

  console.log('[RATE_LIMIT] Upload allowed', {
    userId,
    planTier,
    count: record.count,
    remaining,
    limit: config.uploadsPerMinute
  })

  return {
    allowed: true,
    remaining,
    resetIn,
    limit: config.uploadsPerMinute
  }
}

/**
 * Get current rate limit status for a user without incrementing
 * Useful for displaying current usage in UI
 * 
 * @param userId - User ID
 * @param planTier - User's plan tier
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  userId: string,
  planTier: 'free' | 'pro' | 'business' = 'free'
): { 
  current: number
  limit: number
  resetIn: number
  percentage: number
} {
  const config = RATE_LIMITS[planTier] || RATE_LIMITS.free
  const key = `upload:${userId}`
  const now = Date.now()

  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    return {
      current: 0,
      limit: config.uploadsPerMinute,
      resetIn: 0,
      percentage: 0
    }
  }

  const resetIn = Math.max(0, record.resetTime - now)
  const percentage = Math.round((record.count / config.uploadsPerMinute) * 100)

  return {
    current: record.count,
    limit: config.uploadsPerMinute,
    resetIn,
    percentage
  }
}

/**
 * Reset rate limit for a specific user
 * Useful for testing or admin actions
 * 
 * @param userId - User ID to reset
 */
export function resetRateLimit(userId: string): void {
  const key = `upload:${userId}`
  rateLimitStore.delete(key)
  console.log('[RATE_LIMIT] Manual reset', { userId })
}

/**
 * Clean up expired rate limit records
 * Prevents memory leaks by removing old entries
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now()
  const keysToDelete: string[] = []

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      keysToDelete.push(key)
    }
  }

  if (keysToDelete.length > 0) {
    keysToDelete.forEach(key => rateLimitStore.delete(key))
    console.log('[RATE_LIMIT] Cleanup completed', {
      removed: keysToDelete.length
    })
  }
}

// Auto-cleanup every 5 minutes to prevent memory leaks
if (typeof globalThis !== 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 5 * 60 * 1000)
}

/**
 * Get rate limit configuration for a plan tier
 * 
 * @param planTier - Plan tier
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(
  planTier: 'free' | 'pro' | 'business' = 'free'
): RateLimitConfig {
  return RATE_LIMITS[planTier] || RATE_LIMITS.free
}
