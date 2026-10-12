const Redis = require('ioredis');
require('dotenv').config();

/**
 * SmartRoute Distributed Redis Client
 * Used for:
 * 1. Atomic 10-Minute Seat Locks (SET NX EX)
 * 2. High-Frequency Live Telemetry Cache
 * 3. Idempotent Waypoint Notification Locks
 */
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Exponential backoff capped at 2 seconds
    return Math.min(times * 50, 2000);
  },
  enableOfflineQueue: true,
  lazyConnect: true
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected to Distributed In-Memory Cluster.');
});

redisClient.on('error', (err) => {
  console.warn('[Redis] Connection warning (using fallback cache if disconnected):', err?.message || err);
});

module.exports = redisClient;
