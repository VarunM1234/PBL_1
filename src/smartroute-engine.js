// SmartRoute - Simulated Redis, Pricing & Tracking Engine

// Simulated Redis in-memory Map
class SimulatedRedis {
  constructor() {
    this.store = new Map();
  }
  // SET key value NX EX ttl (seconds)
  setNX(key, value, ttlSec) {
    const now = Date.now();
    const existing = this.store.get(key);
    if (existing && existing.expireAt > now) {
      return false; // key exists
    }
    this.store.set(key, { value, expireAt: now + (ttlSec * 1000) });
    return true;
  }
  // lockSeat: acquire if free or already owned by same owner (extends TTL); otherwise fail
  lockSeat(key, owner, ttlSec) {
    const now = Date.now();
    const existing = this.store.get(key);
    if (!existing || existing.expireAt <= now || existing.value === owner) {
      this.store.set(key, { value: owner, expireAt: now + (ttlSec * 1000) });
      return true;
    }
    return false;
  }
  // unlock: delete only if owner matches
  unlock(key, owner) {
    const existing = this.store.get(key);
    if (existing && existing.value === owner) {
      this.store.delete(key);
      return true;
    }
    return false;
  }
  get(key) {
    const existing = this.store.get(key);
    if (!existing) return null;
    if (existing.expireAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return existing.value;
  }
  del(key) {
    this.store.delete(key);
  }
}

const redis = new SimulatedRedis();
window.redis = redis;

// Seeded PRNG for deterministic inventory
function createSeededPRNG(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = ["Amit", "Rahul", "Priya", "Neha", "Rohit", "Sneha", "Karan", "Pooja", "Vikram", "Ananya", "Deepak", "Ritu"];
const LAST_NAMES = ["Sharma", "Verma", "Singh", "Yadav", "Gupta", "Meena", "Chauhan", "Joshi", "Malhotra", "Patel"];

function generateSeatInventory(busId, dateStr) {
  const seed = `${busId}|${dateStr}`;
  const rng = createSeededPRNG(seed);
  const bus = BUSES.find(b => b.id === Number(busId)) || BUSES[0];
  const seats = {};

  const seatIds = [];
  if (bus.layout === "seater") {
    const cols = ["A", "B", "C", "D"];
    for (let r = 1; r <= 10; r++) {
      for (const c of cols) seatIds.push(`${r}${c}`);
    }
  } else {
    for (let i = 1; i <= 18; i++) seatIds.push(`L${i}`);
    for (let i = 1; i <= 18; i++) seatIds.push(`U${i}`);
  }

  seatIds.forEach(id => {
    const val = rng();
    if (val < 0.30) {
      // 30% booked
      const fn = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
      const ln = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
      seats[id] = {
        id,
        status: "BOOKED",
        passenger: {
          name: `${fn} ${ln}`,
          age: Math.floor(rng() * 45) + 18,
          gender: rng() > 0.5 ? "Male" : "Female",
          boardingPoint: rng() > 0.3 ? "Kashmere Gate ISBT" : "Dhaula Kuan"
        }
      };
    } else if (val < 0.38) {
      // 8% locked by others with TTL 30-200s
      const ttl = Math.floor(rng() * 170) + 30;
      const lockKey = `seatlock:${busId}-${dateStr}:${id}`;
      redis.lockSeat(lockKey, "simulated_user_" + Math.floor(rng()*1000), ttl);
      seats[id] = { id, status: "LOCKED", expireAt: Date.now() + ttl * 1000 };
    } else {
      seats[id] = { id, status: "AVAILABLE" };
    }
  });

  return seats;
}

// Pure fare calculation engine
function calculateFare(seatCount, busFare, hasInsurance, couponCode) {
  const base = Math.round(busFare * seatCount);
  const service = Math.round(base * 0.02);
  const insurance = hasInsurance ? Math.round(15 * seatCount) : 0;
  const tax = Math.round((base + service) * 0.05);

  let discount = 0;
  let couponMessage = "";
  let couponValid = false;

  const code = (couponCode || "").trim().toUpperCase();
  if (code) {
    if (code === "SMART100") {
      if (base >= 500) {
        discount = 100;
        couponMessage = "SMART100 applied. You save ₹100.";
        couponValid = true;
      } else {
        const needed = 500 - base;
        couponMessage = `Add ₹${needed} more to use SMART100.`;
      }
    } else if (code === "ROUTE10") {
      if (base >= 300) {
        discount = Math.min(150, Math.round(base * 0.10));
        couponMessage = `ROUTE10 applied. You save ₹${discount}.`;
        couponValid = true;
      } else {
        const needed = 300 - base;
        couponMessage = `Add ₹${needed} more to use ROUTE10.`;
      }
    } else {
      couponMessage = "Coupon not found.";
    }
  }

  const total = Math.max(0, base + service + insurance + tax - discount);
  return { base, service, insurance, tax, discount, total, couponMessage, couponValid };
}

window.SimulatedRedis = SimulatedRedis;
window.generateSeatInventory = generateSeatInventory;
window.calculateFare = calculateFare;
