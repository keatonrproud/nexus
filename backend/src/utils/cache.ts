interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Clear all cache entries for a specific user
  clearUserCache(userId: string): number {
    const userPrefix = `user:${userId}:`;
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(userPrefix)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Get statistics for a specific user's cache
  getUserStats(userId: string) {
    const userPrefix = `user:${userId}:`;
    const userKeys = Array.from(this.cache.keys()).filter((key) =>
      key.startsWith(userPrefix)
    );

    return {
      size: userKeys.length,
      keys: userKeys,
    };
  }
}

// Create a singleton instance
export const cache = new MemoryCache();

// Clean up expired entries every 10 minutes
setInterval(
  () => {
    cache.cleanup();
  },
  10 * 60 * 1000
);

// Cache middleware factory
export const cacheMiddleware = (ttl?: number) => {
  return (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Include user ID in cache key to prevent cross-user data sharing
    const userId = req.user?.userId || 'anonymous';
    const key = `user:${userId}:${req.originalUrl || req.url}`;
    const cachedData = cache.get(key);

    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response
    res.json = function (data: any) {
      cache.set(key, data, ttl);
      return originalJson.call(this, data);
    };

    next();
  };
};
