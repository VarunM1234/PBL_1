// SmartRoute - Live Fleet Simulation & Waypoint Alert Engine

class TripSimulator {
  constructor() {
    this.multiplier = 120; // Default x120 (3h in ~90s)
    this.trips = {};
    this.listeners = new Set();
    this.notifications = [];
    this.unreadNotifs = 0;
    this.alertsFeed = []; // Global alerts feed

    this.initFleet();
    this.startLoop();
  }

  initFleet() {
    const trackedBuses = [101, 102, 103, 104, 106];
    trackedBuses.forEach(id => {
      const bus = BUSES.find(b => b.id === id);
      let initialProgress = 0;
      let status = "SCHEDULED";

      if (id === 102) { initialProgress = 0.22; status = "IN_TRANSIT"; }
      else if (id === 103) { initialProgress = 0.58; status = "IN_TRANSIT"; }
      else if (id === 104) { initialProgress = 0.80; status = "IN_TRANSIT"; }

      this.trips[id] = {
        busId: id,
        busName: bus.operator,
        reg: bus.reg,
        status: status,
        progress: initialProgress, // 0.0 to 1.0
        speed: status === "IN_TRANSIT" ? CRUISE_SPEED * 0.95 : 0,
        smoothedSpeed: CRUISE_SPEED,
        targetSpeed: CRUISE_SPEED,
        haltRemainingMin: 0,
        trafficJamRemainingMin: 0,
        elapsedMin: initialProgress * 180,
        displayedDestEtaMin: Math.max(0, Math.round(180 * (1 - initialProgress))),
        parkedTimer: 0,
        alerts: []
      };

      // Suppress earlier alerts for initially running buses
      if (initialProgress > 0) {
        redis.setNX(`alert:${id}:start`, 1, 86400);
        STOPS.forEach(stop => {
          if (stop.f <= initialProgress) {
            redis.setNX(`alert:${id}:${stop.id}`, 1, 86400);
          }
        });
      }
    });
  }

  startTrip(busId) {
    const trip = this.trips[busId];
    if (!trip || trip.status !== "SCHEDULED") return;
    trip.status = "IN_TRANSIT";
    trip.speed = CRUISE_SPEED * 0.9;
    trip.smoothedSpeed = CRUISE_SPEED;
    trip.progress = 0;
    trip.elapsedMin = 0;
    this.checkAlerts(trip);
    this.notify();
  }

  setTrafficJam(busId) {
    const trip = this.trips[busId];
    if (!trip || trip.status === "COMPLETED") return;
    trip.trafficJamRemainingMin = 15;
    trip.speed = 6;
    this.notify();
  }

  resetTrip(busId) {
    const trip = this.trips[busId];
    if (!trip) return;
    trip.status = "SCHEDULED";
    trip.progress = 0;
    trip.speed = 0;
    trip.smoothedSpeed = CRUISE_SPEED;
    trip.haltRemainingMin = 0;
    trip.trafficJamRemainingMin = 0;
    trip.elapsedMin = 0;
    trip.displayedDestEtaMin = 180;
    trip.parkedTimer = 0;
    this.notify();
  }

  setMultiplier(mult) {
    this.multiplier = mult;
    this.notify();
  }

  startLoop() {
    setInterval(() => {
      this.tick();
    }, CONFIG.tickMs);
  }

  tick() {
    const simMinutesPerTick = (0.25 * this.multiplier) / 60;

    Object.values(this.trips).forEach(trip => {
      if (trip.status === "SCHEDULED") return;

      if (trip.status === "COMPLETED") {
        trip.parkedTimer += (CONFIG.tickMs / 1000);
        if ([102, 103, 104].includes(trip.busId) && trip.parkedTimer >= 8) {
          // Restart at 2% to keep fleet view alive
          trip.status = "IN_TRANSIT";
          trip.progress = 0.02;
          trip.elapsedMin = 3.6;
          trip.speed = CRUISE_SPEED * 0.9;
          trip.smoothedSpeed = CRUISE_SPEED;
          trip.haltRemainingMin = 0;
          trip.parkedTimer = 0;
          trip.displayedDestEtaMin = 175;
          // reset alerts
          redis.del(`alert:${trip.busId}:dest`);
        }
        return;
      }

      trip.elapsedMin += simMinutesPerTick;

      // Handle halt
      if (trip.status === "HALTED") {
        trip.speed = 0;
        trip.haltRemainingMin -= simMinutesPerTick;
        if (trip.haltRemainingMin <= 0) {
          trip.status = "IN_TRANSIT";
          trip.haltRemainingMin = 0;
          trip.speed = CRUISE_SPEED * 0.9;
        }
      } else {
        // Handle traffic jam
        if (trip.trafficJamRemainingMin > 0) {
          trip.trafficJamRemainingMin -= simMinutesPerTick;
          trip.speed = 6;
        } else {
          // Normal cruising with slight noise
          const target = CRUISE_SPEED + (Math.random() * 10 - 5);
          trip.speed = 0.5 * trip.speed + 0.5 * target;
        }

        // Smoothed speed exponential average (weight 0.08, only when > 10 km/h)
        if (trip.speed > 10) {
          trip.smoothedSpeed = 0.92 * trip.smoothedSpeed + 0.08 * trip.speed;
        }

        // Distance advance in this tick
        const distAdvancedKm = (trip.speed * simMinutesPerTick) / 60;
        trip.progress += distAdvancedKm / ROUTE_KM;

        // Check food stop arrival (halt 15 simulated minutes)
        const foodStopF = 0.50;
        if (trip.progress >= foodStopF && trip.progress < 0.53 && !trip.haltDone) {
          trip.status = "HALTED";
          trip.haltRemainingMin = 15;
          trip.haltDone = true;
          trip.speed = 0;
        }

        // Destination reached
        if (trip.progress >= 1.0) {
          trip.progress = 1.0;
          trip.status = "COMPLETED";
          trip.speed = 0;
        }
      }

      this.updateETA(trip);
      this.checkAlerts(trip);
    });

    this.notify();
  }

  updateETA(trip) {
    // Effective speed is the smoothed speed when the bus is moving or halted, and the 40 km/h fallback when speed is 10 or below (the Traffic jam button)
    const effectiveSpeed = (trip.status === "HALTED" || trip.speed > 10) ? trip.smoothedSpeed : CONFIG.defaultSpeed;
    const remainingKm = Math.max(0, ROUTE_KM * (1 - trip.progress));
    const remainingHaltMin = trip.progress < 0.50 ? 15 : (trip.status === "HALTED" ? Math.max(0, trip.haltRemainingMin) : 0);
    const rawDestEtaMin = Math.round((remainingKm / effectiveSpeed) * 60 + remainingHaltMin);

    // Displayed destination ETA monotonic check: only rises if raw exceeds shown by > 3 min
    if (rawDestEtaMin > trip.displayedDestEtaMin + 3) {
      trip.displayedDestEtaMin = rawDestEtaMin;
    } else if (rawDestEtaMin < trip.displayedDestEtaMin) {
      trip.displayedDestEtaMin = rawDestEtaMin;
    }

    // Delay calculation: ignored for first 10 minutes
    if (trip.elapsedMin > 10) {
      const projectedTotalMin = trip.elapsedMin + (remainingKm / trip.smoothedSpeed * 60) + remainingHaltMin;
      trip.delayMin = Math.max(0, Math.round(projectedTotalMin - 180));
    } else {
      trip.delayMin = 0;
    }
  }

  checkAlerts(trip) {
    const busId = trip.busId;
    const effectiveSpeed = (trip.status === "HALTED" || trip.speed > 10) ? trip.smoothedSpeed : CONFIG.defaultSpeed;

    // 1. Trip start alert
    if (trip.status === "IN_TRANSIT" && trip.progress < 0.05) {
      if (redis.setNX(`alert:${busId}:start`, 1, 86400)) {
        this.emitAlert(busId, "TRIP_START", "Your journey has started!", "Destination: Jaipur. Estimated journey time: 3 hours.", "normal");
      }
    }

    // 2. Waypoint alerts (Tolls & Food Stop)
    STOPS.forEach(stop => {
      if (stop.f > trip.progress) {
        const distKm = Math.max(0, (stop.f - trip.progress) * ROUTE_KM);
        const etaStopMin = (distKm / effectiveSpeed) * 60;
        const alertKey = `alert:${busId}:${stop.id}`;

        if (stop.type === "TOLL_PLAZA") {
          if (etaStopMin >= CONFIG.tollWindowMin && etaStopMin <= CONFIG.tollWindowMax) {
            if (redis.setNX(alertKey, 1, 86400)) {
              const destEtaStr = this.formatDuration(trip.displayedDestEtaMin);
              this.emitAlert(busId, "TOLL", `Toll Plaza approaching: ${stop.name}`, `Your bus is ${distKm.toFixed(1)} km from ${stop.name}. Destination ETA: ${destEtaStr}.`, "toll");
            }
          }
        } else if (stop.type === "RESTAURANT_HALT") {
          if (etaStopMin >= CONFIG.waypointWindowMin && etaStopMin <= CONFIG.waypointWindowMax) {
            if (redis.setNX(alertKey, 1, 86400)) {
              const destEtaStr = this.formatDuration(trip.displayedDestEtaMin);
              this.emitAlert(busId, "HALT", `Upcoming Stop: ${stop.name}`, `The bus will halt for approximately 15 minutes. Destination ETA: ${destEtaStr}.`, "halt");
            }
          }
        }
      }
    });

    // 3. Delay alert (fires once if delay >= 10 min)
    if (trip.delayMin >= 10) {
      if (redis.setNX(`alert:${busId}:delay`, 1, 86400)) {
        const destEtaStr = this.formatDuration(trip.displayedDestEtaMin);
        this.emitAlert(busId, "DELAY", "Bus delayed", `Your bus is running about ${trip.delayMin} minutes late. New destination ETA: ${destEtaStr}.`, "toll");
      }
    }

    // 4. Arrival alert
    if (trip.status === "COMPLETED") {
      if (redis.setNX(`alert:${busId}:dest`, 1, 86400)) {
        this.emitAlert(busId, "ARRIVAL", "You have arrived at Jaipur.", "Thank you for travelling with SmartRoute.", "normal");
      }
    }
  }

  emitAlert(busId, type, title, body, variant) {
    const alertObj = {
      id: "alt_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      busId,
      busName: this.trips[busId]?.busName || `Bus #${busId}`,
      type,
      title,
      body,
      variant,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (this.trips[busId]) {
      this.trips[busId].alerts.unshift(alertObj);
      if (this.trips[busId].alerts.length > 8) this.trips[busId].alerts.pop();
    }

    this.alertsFeed.unshift(alertObj);
    if (this.alertsFeed.length > 20) this.alertsFeed.pop();

    this.notifications.unshift(alertObj);
    if (this.notifications.length > 10) this.notifications.pop();
    this.unreadNotifs++;

    // Trigger toast in UI
    if (window.showLiveToast) {
      window.showLiveToast(alertObj);
    }
  }

  formatDuration(mins) {
    mins = Math.max(0, Math.round(mins));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.trips));
  }
}

const tracker = new TripSimulator();
window.tracker = tracker;
