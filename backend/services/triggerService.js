const { calculateDistanceKM, calculateETA } = require('./geoService');
const redisClient = require('../config/redis');

// In-memory idempotency set fallback
const inMemoryAlertSet = new Set();

/**
 * SmartRoute Idempotent Waypoint & Toll Trigger Engine
 * Evaluates live vehicle proximity against upcoming corridor waypoints.
 *
 * Requirements:
 * 1. Proximity Trigger Window: Dispatches notification when vehicle is between 15 and 30 minutes away.
 * 2. Strict Idempotency Guarantee: Uses atomic Redis key `alert:<tripId>:<waypointId>` with a 24-hour TTL (86400s)
 *    to guarantee that exactly ONE notification is emitted per waypoint per trip, avoiding alert spam across 100+ GPS updates.
 */

const NOTIFICATION_WINDOW_MIN_MINUTES = 15;
const NOTIFICATION_WINDOW_MAX_MINUTES = 30;
const ALERT_LOCK_TTL_SECONDS = 86400; // 24 hours

async function processWaypointAlerts(io, telemetry) {
  const {
    tripId,
    busId,
    currentLat,
    currentLng,
    speedKmph,
    destination,
    waypoints = []
  } = telemetry;

  if (!tripId || !waypoints || !Array.isArray(waypoints)) {
    return null;
  }

  // Calculate overall destination ETA
  const overallETA = calculateETA(
    currentLat,
    currentLng,
    destination.lat,
    destination.lng,
    speedKmph
  );

  const triggeredAlerts = [];

  for (const waypoint of waypoints) {
    const distToWaypoint = calculateDistanceKM(
      currentLat,
      currentLng,
      waypoint.lat,
      waypoint.lng
    );

    const effectiveSpeed = speedKmph >= 15 ? speedKmph : 40.0;
    const etaToWaypointMins = (distToWaypoint / effectiveSpeed) * 60;

    // Check trigger threshold: between 15 and 30 minutes
    if (
      etaToWaypointMins <= NOTIFICATION_WINDOW_MAX_MINUTES &&
      etaToWaypointMins >= NOTIFICATION_WINDOW_MIN_MINUTES
    ) {
      const idempotencyKey = `alert:${tripId}:${waypoint.id}`;

      let lockAcquired = false;
      try {
        // Atomic lock attempt: returns 'OK' if not yet sent
        const redisReply = await redisClient.set(
          idempotencyKey,
          '1',
          'NX',
          'EX',
          ALERT_LOCK_TTL_SECONDS
        );
        lockAcquired = redisReply === 'OK';
      } catch (err) {
        if (!inMemoryAlertSet.has(idempotencyKey)) {
          inMemoryAlertSet.add(idempotencyKey);
          lockAcquired = true;
        }
      }

      if (lockAcquired) {
        let title = '';
        let body = '';
        let category = 'GENERAL';

        if (waypoint.type === 'TOLL_PLAZA') {
          category = 'TOLL';
          title = `Toll Plaza Ahead: ${waypoint.name}`;
          body = `Approaching ${waypoint.name} in ~${Math.round(etaToWaypointMins)} mins (${distToWaypoint.toFixed(1)} km). FASTag automated clearance active. Final ETA: ${overallETA.etaText}.`;
        } else if (waypoint.type === 'RESTAURANT_HALT') {
          category = 'HALT';
          title = `Midpoint Meal Halt: ${waypoint.name}`;
          body = `Scheduled ${waypoint.haltDuration || 15}-minute rest stop approaching in ~${Math.round(etaToWaypointMins)} mins. Hygienic dining and washroom facilities available.`;
        } else if (waypoint.type === 'BOARDING') {
          category = 'BOARDING';
          title = `Boarding Stop Approaching: ${waypoint.name}`;
          body = `Bus arriving at ${waypoint.name} in ~${Math.round(etaToWaypointMins)} mins. Please report to the platform.`;
        } else {
          category = 'WAYPOINT';
          title = `Approaching ${waypoint.name}`;
          body = `Estimated reach in ${Math.round(etaToWaypointMins)} mins. Current speed: ${Math.round(speedKmph)} km/h.`;
        }

        const alertPayload = {
          tripId,
          busId,
          waypointId: waypoint.id,
          waypointName: waypoint.name,
          category,
          title,
          body,
          distanceKm: parseFloat(distToWaypoint.toFixed(1)),
          etaToWaypointMins: Math.round(etaToWaypointMins),
          overallETA: overallETA.etaText,
          timestamp: new Date().toISOString()
        };

        triggeredAlerts.push(alertPayload);

        // Emit to passengers subscribed to this specific bus room
        if (io) {
          io.to(`bus_${busId}`).emit('LIVE_NOTIFICATION_ALERT', alertPayload);
          // Also broadcast to admin monitoring room
          io.to('admin_fleet_room').emit('FLEET_NOTIFICATION_ALERT', alertPayload);
        }
      }
    }
  }

  return {
    overallETA,
    triggeredAlerts
  };
}

module.exports = {
  processWaypointAlerts,
  NOTIFICATION_WINDOW_MIN_MINUTES,
  NOTIFICATION_WINDOW_MAX_MINUTES
};
