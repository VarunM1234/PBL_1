const { calculateETA } = require('../services/geoService');
const { processWaypointAlerts } = require('../services/triggerService');

/**
 * SmartRoute Real-Time Socket.IO Telemetry Engine
 * Manages WebSocket rooms for passenger tracking and admin fleet consoles.
 */
module.exports = function setupLiveTrackingSocket(io) {
  // In-memory cache of latest telemetry per active bus
  const activeFleetTelemetry = new Map();

  io.on('connection', (socket) => {
    // 1. Passenger subscribes to a specific bus telemetry stream
    socket.on('TRACK_BUS', ({ busId }) => {
      const roomName = `bus_${busId}`;
      socket.join(roomName);

      // Immediately send last known telemetry if available
      if (activeFleetTelemetry.has(Number(busId))) {
        socket.emit('BUS_LOCATION_UPDATED', activeFleetTelemetry.get(Number(busId)));
      }
    });

    // 2. Passenger leaves bus room
    socket.on('UNTRACK_BUS', ({ busId }) => {
      socket.leave(`bus_${busId}`);
    });

    // 3. Admin joins multi-bus fleet monitoring room
    socket.on('JOIN_ADMIN_FLEET', () => {
      socket.join('admin_fleet_room');

      // Send initial snapshot of all active buses
      const snapshot = Array.from(activeFleetTelemetry.values());
      socket.emit('FLEET_SNAPSHOT', snapshot);
    });

    // 4. Driver App or Telemetry Streamer emits live GPS telemetry frame
    socket.on('DRIVER_GPS_STREAM', async (telemetryPacket) => {
      const {
        tripId,
        busId,
        currentLat,
        currentLng,
        speedKmph,
        destination,
        waypoints = []
      } = telemetryPacket;

      if (!busId || !destination || currentLat == null || currentLng == null) {
        return;
      }

      // Calculate decreasing ETA
      const etaDetails = calculateETA(
        currentLat,
        currentLng,
        destination.lat,
        destination.lng,
        speedKmph
      );

      const enrichedPacket = {
        ...telemetryPacket,
        busId: Number(busId),
        distanceKm: etaDetails.distanceKm,
        etaText: etaDetails.etaText,
        etaMinutes: etaDetails.etaMinutes,
        updatedAt: new Date().toISOString()
      };

      // Update in-memory snapshot
      activeFleetTelemetry.set(Number(busId), enrichedPacket);

      // Broadcast live packet to passengers tracking this bus
      io.to(`bus_${busId}`).emit('BUS_LOCATION_UPDATED', enrichedPacket);

      // Broadcast to admin fleet overview
      io.to('admin_fleet_room').emit('FLEET_LOCATION_UPDATED', enrichedPacket);

      // Run idempotent alert engine against route waypoints
      await processWaypointAlerts(io, telemetryPacket);
    });

    // 5. Client disconnect cleanup
    socket.on('disconnect', () => {
      // Room memberships cleaned automatically by socket.io
    });
  });
};
