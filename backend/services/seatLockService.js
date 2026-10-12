const redisClient = require('../config/redis');

// In-memory fallback map if Redis cluster is temporarily unreachable in development
const inMemoryFallbackLockMap = new Map();

/**
 * SmartRoute Distributed Seat Locking Service
 * Prevents double-booking race conditions during high-concurrency ticket checkouts.
 * Enforces an atomic 10-minute hold window (600 seconds) using Redis SET NX EX.
 */

const SEAT_LOCK_TTL_SECONDS = 600; // 10 minutes

/**
 * Atomically acquires a temporary hold lock on a seat for 10 minutes.
 *
 * @param {string|number} tripId ID of the scheduled trip
 * @param {string} seatNumber Identifier of the seat (e.g. "1A", "L4", "U2")
 * @param {string|number} userId Identifier of the acquiring passenger
 * @returns {Promise<{ success: boolean, ttlSeconds: number, lockedBy?: string }>}
 */
async function acquireSeatLock(tripId, seatNumber, userId) {
  const lockKey = `seatlock:${tripId}:${seatNumber}`;
  const lockValue = String(userId);

  try {
    // Redis atomic command: SET key value NX EX 600
    // Returns 'OK' if key did not exist and was acquired, null otherwise
    const reply = await redisClient.set(lockKey, lockValue, 'NX', 'EX', SEAT_LOCK_TTL_SECONDS);

    if (reply === 'OK') {
      return { success: true, ttlSeconds: SEAT_LOCK_TTL_SECONDS };
    }

    const currentOwner = await redisClient.get(lockKey);
    return { success: false, ttlSeconds: 0, lockedBy: currentOwner || 'ANOTHER_PASSENGER' };
  } catch (error) {
    // Resilient fallback to memory map
    const existing = inMemoryFallbackLockMap.get(lockKey);
    if (!existing || existing.expiresAt <= Date.now()) {
      inMemoryFallbackLockMap.set(lockKey, {
        userId: lockValue,
        expiresAt: Date.now() + SEAT_LOCK_TTL_SECONDS * 1000
      });
      return { success: true, ttlSeconds: SEAT_LOCK_TTL_SECONDS };
    }
    return { success: false, ttlSeconds: 0, lockedBy: existing.userId };
  }
}

/**
 * Checks current owner and remaining TTL for a seat lock.
 *
 * @param {string|number} tripId
 * @param {string} seatNumber
 * @returns {Promise<{ isLocked: boolean, owner: string|null, remainingSeconds: number }>}
 */
async function getSeatLockStatus(tripId, seatNumber) {
  const lockKey = `seatlock:${tripId}:${seatNumber}`;
  try {
    const owner = await redisClient.get(lockKey);
    if (!owner) return { isLocked: false, owner: null, remainingSeconds: 0 };

    const ttl = await redisClient.ttl(lockKey);
    return { isLocked: true, owner, remainingSeconds: Math.max(0, ttl) };
  } catch (err) {
    const existing = inMemoryFallbackLockMap.get(lockKey);
    if (existing && existing.expiresAt > Date.now()) {
      const remainingSeconds = Math.round((existing.expiresAt - Date.now()) / 1000);
      return { isLocked: true, owner: existing.userId, remainingSeconds };
    }
    return { isLocked: false, owner: null, remainingSeconds: 0 };
  }
}

/**
 * Safely releases a held seat lock using an atomic Lua script to guarantee
 * that only the user who holds the lock can release it (preventing accidental release of expired locks).
 *
 * @param {string|number} tripId
 * @param {string} seatNumber
 * @param {string|number} userId
 * @returns {Promise<boolean>}
 */
async function releaseSeatLock(tripId, seatNumber, userId) {
  const lockKey = `seatlock:${tripId}:${seatNumber}`;
  const lockValue = String(userId);

  const LUA_RELEASE_SCRIPT = `
    if redis.call("GET", KEYS[1]) == ARGV[1] then
      return redis.call("DEL", KEYS[1])
    else
      return 0
    end
  `;

  try {
    const result = await redisClient.eval(LUA_RELEASE_SCRIPT, 1, lockKey, lockValue);
    return result === 1;
  } catch (error) {
    const existing = inMemoryFallbackLockMap.get(lockKey);
    if (existing && existing.userId === lockValue) {
      inMemoryFallbackLockMap.delete(lockKey);
      return true;
    }
    return false;
  }
}

module.exports = {
  acquireSeatLock,
  getSeatLockStatus,
  releaseSeatLock,
  SEAT_LOCK_TTL_SECONDS
};
