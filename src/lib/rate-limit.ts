/**
 * Simple in-memory rate limiter
 * For production, consider using Redis with @upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests.entries()) {
        if (now > entry.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (IP, phone, etc)
   * @param limit - Max requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  check(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count < limit) {
      // Within limit
      entry.count++;
      return true;
    }

    // Rate limited
    return false;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string, limit: number = 10): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get reset time for identifier
   */
  getResetTime(identifier: string): number | null {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }
    return entry.resetTime;
  }

  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for API routes
 * @param identifier - Unique identifier (IP, user ID, phone number)
 * @param limit - Max requests per window (default: 10)
 * @param windowMs - Time window in ms (default: 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number | null } {
  const allowed = rateLimiter.check(identifier, limit, windowMs);
  const remaining = rateLimiter.getRemaining(identifier, limit);
  const resetTime = rateLimiter.getResetTime(identifier);

  return { allowed, remaining, resetTime };
}

/**
 * Create rate limit response with proper headers
 */
export function createRateLimitResponse(resetTime: number | null, message: string = 'Too many requests') {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Retry-After': resetTime ? Math.ceil((resetTime - Date.now()) / 1000).toString() : '60',
  };

  return new Response(
    JSON.stringify({
      error: message,
      retryAfter: resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60,
    }),
    {
      status: 429,
      headers,
    }
  );
}
