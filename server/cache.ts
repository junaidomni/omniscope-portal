/**
 * Server-side in-memory cache with TTL.
 *
 * Used for expensive operations that don't need real-time freshness:
 * - Gmail thread metadata (~10s API call → cached for 5 min)
 * - Analytics aggregations (~3s query → cached for 2 min)
 * - AI-generated insights (~15s LLM call → cached for 10 min)
 *
 * This is a simple Map-based cache suitable for single-process deployments.
 * For multi-process or distributed deployments, replace with Redis.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Periodic cleanup every 60 seconds to prevent memory leaks
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  /**
   * Get a cached value, or compute and cache it if missing/expired.
   *
   * @param key   Unique cache key (e.g., `gmail:threads:${userId}`)
   * @param ttlMs Time-to-live in milliseconds
   * @param fn    Async function to compute the value if not cached
   */
  async getOrSet<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const existing = this.store.get(key) as CacheEntry<T> | undefined;
    if (existing && existing.expiresAt > Date.now()) {
      return existing.data;
    }

    const data = await fn();
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
    return data;
  }

  /**
   * Get a cached value without computing.
   * Returns undefined if not found or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry || entry.expiresAt <= Date.now()) {
      if (entry) this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  /**
   * Manually set a cache entry.
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
  }

  /**
   * Invalidate a specific key or all keys matching a prefix.
   */
  invalidate(keyOrPrefix: string): number {
    let count = 0;
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);
      count++;
    } else {
      // Prefix-based invalidation
      for (const key of this.store.keys()) {
        if (key.startsWith(keyOrPrefix)) {
          this.store.delete(key);
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache stats for monitoring.
   */
  stats(): { size: number; keys: string[] } {
    this.cleanup(); // Clean expired entries first
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance — shared across all server modules
export const cache = new MemoryCache();

// Common TTL constants
export const CACHE_TTL = {
  /** Gmail thread metadata — 5 minutes */
  GMAIL_THREADS: 5 * 60 * 1000,
  /** Analytics aggregations — 2 minutes */
  ANALYTICS: 2 * 60 * 1000,
  /** AI-generated insights — 10 minutes */
  AI_INSIGHTS: 10 * 60 * 1000,
  /** Contact/company lists — 30 seconds */
  ENTITY_LIST: 30 * 1000,
  /** Dashboard metrics — 1 minute */
  DASHBOARD: 60 * 1000,
} as const;
