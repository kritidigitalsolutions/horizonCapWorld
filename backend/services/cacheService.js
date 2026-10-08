/**
 * Production-Grade Universal Cache Service (Redis + Fast In-Memory Fallback)
 * 
 * Features:
 * - Seamless Redis connection via ioredis (REDIS_URL or REDIS_HOST)
 * - Safe fallback to in-memory TTL cache when Redis is offline or not installed locally
 * - Event-driven cache invalidation for real-time investor accuracy
 * - Zero breaking changes, high fault tolerance
 */

let Redis;
try {
  Redis = require("ioredis");
} catch (e) {
  Redis = null;
}

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
    this.isRedisReady = false;
    this.initRedis();

    // In-memory periodic cleanup every 60 seconds
    setInterval(() => this.cleanupMemoryCache(), 60000).unref();
  }

  initRedis() {
    if (!Redis) return;

    const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL;
    const redisHost = process.env.REDIS_HOST;

    // Only attempt if explicit REDIS_URL/REDIS_HOST or production environment
    if (!redisUrl && !redisHost && process.env.NODE_ENV !== "production") {
      return;
    }

    try {
      const options = {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        enableOfflineQueue: false,
        retryStrategy: () => null, // Do not infinite loop reconnect if offline
      };

      if (redisUrl) {
        this.redisClient = new Redis(redisUrl, options);
      } else {
        this.redisClient = new Redis({
          host: redisHost || "127.0.0.1",
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          password: process.env.REDIS_PASSWORD || undefined,
          ...options,
        });
      }

      this.redisClient.connect().then(() => {
        this.isRedisReady = true;
        console.log("[CacheService] Connected to Redis successfully.");
      }).catch((err) => {
        this.isRedisReady = false;
        // Silent fallback without spamming logs
        console.log("[CacheService] Redis offline, active fallback to high-speed in-memory cache.");
      });

      this.redisClient.on("error", (err) => {
        this.isRedisReady = false;
      });

      this.redisClient.on("close", () => {
        this.isRedisReady = false;
      });
    } catch (err) {
      this.isRedisReady = false;
    }
  }

  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt && item.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async get(key) {
    try {
      if (this.isRedisReady && this.redisClient) {
        const val = await this.redisClient.get(key);
        if (val !== null && val !== undefined) {
          try {
            return JSON.parse(val);
          } catch (e) {
            return val;
          }
        }
      }
    } catch (err) {
      // Fall through to memoryCache on redis error
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value;
  }

  async set(key, value, ttlSeconds = 120) {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;

    // Save in memory cache
    this.memoryCache.set(key, { value, expiresAt });

    // Save in Redis if available
    try {
      if (this.isRedisReady && this.redisClient) {
        const serialized = JSON.stringify(value);
        if (ttlSeconds > 0) {
          await this.redisClient.set(key, serialized, "EX", ttlSeconds);
        } else {
          await this.redisClient.set(key, serialized);
        }
      }
    } catch (err) {
      // Fail silently, memoryCache is already updated
    }

    return true;
  }

  async del(key) {
    this.memoryCache.delete(key);
    try {
      if (this.isRedisReady && this.redisClient) {
        await this.redisClient.del(key);
      }
    } catch (err) {
      // Ignore
    }
    return true;
  }

  async delPattern(pattern) {
    // 1. Clear matching in memory
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // 2. Clear matching in Redis
    try {
      if (this.isRedisReady && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys && keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      }
    } catch (err) {
      // Ignore
    }
    return true;
  }

  /**
   * Specifically invalidates referral & team network cache for a user and their immediate sponsors
   */
  async invalidateUserReferrals(userId, customId, sponsorId) {
    const keysToDelete = [
      userId && `referral:network:${userId}`,
      customId && `referral:network:${customId}`,
      userId && `referral:overview:${userId}`,
      customId && `referral:overview:${customId}`,
      userId && `referral:commissions:${userId}`,
      customId && `referral:commissions:${customId}`,
      sponsorId && `referral:network:${sponsorId}`,
      sponsorId && `referral:overview:${sponsorId}`,
      sponsorId && `referral:commissions:${sponsorId}`,
    ].filter(Boolean);

    for (const key of keysToDelete) {
      await this.del(key);
    }
  }

  /**
   * Invalidate all referral settings, network, and tree caches
   */
  async invalidateAllReferralCaches() {
    await this.delPattern("referral:*");
  }
}

const cacheService = new CacheService();
module.exports = cacheService;
