const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { searchBuses } = require('./controllers/searchController');
const {
  lockSeat,
  unlockSeat,
  checkSeatStatus,
  confirmBooking
} = require('./controllers/bookingController');
const {
  getFleetList,
  addBus,
  updateBusStatus,
  getStaffList,
  addStaffMember,
  getRouteWaypoints,
  addRouteWaypoint,
  getTripManifest,
  getCorridorAnalytics
} = require('./controllers/adminController');
const setupLiveTrackingSocket = require('./sockets/liveTrackingSocket');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'HEALTHY', service: 'SmartRoute Backend', timestamp: new Date().toISOString() });
});

// Search & Inventory
app.get('/api/search', searchBuses);

// Concurrency-Safe Seat Locking (Redis 10-min TTL)
app.post('/api/seats/lock', lockSeat);
app.post('/api/seats/unlock', unlockSeat);
app.get('/api/seats/status', checkSeatStatus);

// Booking Confirmation & Transactions
app.post('/api/bookings/confirm', confirmBooking);

// Operator & Admin CRUD Portals
app.get('/api/admin/fleet', getFleetList);
app.post('/api/admin/fleet', addBus);
app.patch('/api/admin/fleet/:id/status', updateBusStatus);

app.get('/api/admin/staff', getStaffList);
app.post('/api/admin/staff', addStaffMember);

app.get('/api/admin/routes/:routeId/stops', getRouteWaypoints);
app.post('/api/admin/routes/:routeId/stops', addRouteWaypoint);

app.get('/api/admin/trips/:tripId/manifest', getTripManifest);
app.get('/api/admin/analytics', getCorridorAnalytics);

// Setup Socket.IO Server for live telemetry
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupLiveTrackingSocket(io);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`SmartRoute Production Server running on port ${PORT}`);
    console.log(`Socket.IO Live Telemetry & Waypoint Alerts Initialized`);
    console.log(`====================================================`);
  });
}

module.exports = { app, server, io };
