// SmartRoute - Live Tracking & Operator Portal Views

// SVG Route Path Definition
const ROUTE_PATH_D = "M40 205 C 190 205, 210 95, 370 112 S 600 195, 720 62";

function getStopPointOnSvg(f) {
  // Approximate points along SVG curve for stops: M40 205 ... 720 62
  // We can measure using a hidden svg or interpolate coordinates
  const stopsCoords = [
    { x: 40, y: 205, angle: 0 },    // 0: Kashmere Gate
    { x: 74, y: 198, angle: -12 },  // 0.05: Dhaula Kuan
    { x: 254, y: 110, angle: 2 },   // 0.33: Shahjahanpur
    { x: 370, y: 112, angle: 22 },  // 0.50: Food Mall
    { x: 592, y: 192, angle: -42 }, // 0.83: Kotputli
    { x: 708, y: 72, angle: -52 },  // 0.985: Narayan Singh
    { x: 720, y: 62, angle: -52 }   // 1.0: Sindhi Camp
  ];
  return stopsCoords;
}

// 7. Live Tracking View
function renderTrackView() {
  const busId = Number(state.routeParam) || state.currentTrackedBusId || 101;
  state.currentTrackedBusId = busId;
  const bus = BUSES.find(b => b.id === busId) || BUSES[0];
  const trip = tracker.trips[busId] || {
    busId,
    status: "SCHEDULED",
    progress: 0,
    speed: 0,
    smoothedSpeed: CRUISE_SPEED,
    displayedDestEtaMin: 180,
    delayMin: 0,
    alerts: []
  };

  const statusLabel = trip.status === "IN_TRANSIT" ? "🚌 Live" :
                      (trip.status === "HALTED" ? "☕ Food Stop" :
                      (trip.status === "COMPLETED" ? "📍 Arrived" : "Not started"));

  const statusChipClass = trip.status === "IN_TRANSIT" ? "chip-green" :
                          (trip.status === "HALTED" ? "chip-amber" :
                          (trip.status === "COMPLETED" ? "chip-soft" : "chip-soft"));

  // Distance & Next Stop calculation
  const effectiveSpeed = trip.speed > 10 ? trip.smoothedSpeed : CONFIG.defaultSpeed;
  const remainingKm = Math.max(0, ROUTE_KM * (1 - trip.progress));
  
  let nextStop = STOPS[STOPS.length - 1];
  for (const st of STOPS) {
    if (st.f > trip.progress) {
      nextStop = st;
      break;
    }
  }
  const distToNextKm = Math.max(0, (nextStop.f - trip.progress) * ROUTE_KM);
  const etaNextMin = Math.round((distToNextKm / effectiveSpeed) * 60);

  // Position coordinates interpolation
  const curLat = 28.6676 + (26.9196 - 28.6676) * trip.progress;
  const curLng = 77.2290 + (75.7878 - 77.2290) * trip.progress;

  // Expected clock arrival time
  const now = new Date();
  const arrDate = new Date(now.getTime() + trip.displayedDestEtaMin * 60000);
  const arrClockStr = arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.25rem;">
          <h2 style="margin:0; font-size:1.6rem;">${bus.operator}</h2>
          <span class="badge ${trip.status === 'IN_TRANSIT' ? 'badge-green' : (trip.status === 'HALTED' ? 'badge-amber' : 'badge-soft')}">${statusLabel}</span>
          ${trip.delayMin >= 10 ? `<span class="badge badge-toll">Delayed by ${trip.delayMin}m</span>` : ''}
        </div>
        <div style="color:var(--muted); font-size:0.88rem;">
          Delhi to Jaipur <span aria-hidden="true">·</span> Reg: <span style="font-family:'JetBrains Mono', monospace; font-weight:700;">${bus.reg}</span> <span aria-hidden="true">·</span> Driver: ${bus.driver}
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <select onchange="window.location.hash='#/track/'+this.value" style="padding:0.45rem 0.75rem; border:1.5px solid var(--line); border-radius:var(--radius-sm); font-weight:700; background:var(--panel);">
          ${BUSES.filter(b => b.liveTracking).map(b => `
            <option value="${b.id}" ${b.id === busId ? 'selected' : ''}>${b.operator} (#${b.id})</option>
          `).join('')}
        </select>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 340px; gap:2rem; align-items:flex-start;">
      <!-- Left Column: Schematic SVG Map & Driver Console -->
      <div>
        <div class="box" style="padding:1.25rem; margin-bottom:1.5rem; position:relative; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.85rem;">
            <span style="font-weight:700; font-size:0.95rem;">Schematic Route Map (NH-48 Corridor)</span>
            <span style="font-size:0.82rem; color:var(--muted); font-weight:700; font-family:'JetBrains Mono', monospace;">${(trip.progress * 100).toFixed(0)}% Completed</span>
          </div>

          <svg viewBox="0 0 760 270" class="schematic-svg" id="routeSvgMap">
            <!-- Background base route path -->
            <path d="${ROUTE_PATH_D}" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
            
            <!-- Dynamic Green trail -->
            <path id="greenTrailPath" d="${ROUTE_PATH_D}" fill="none" stroke="var(--route)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"
              pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100 - (trip.progress * 100)}" />

            <!-- Waypoint Markers along Route -->
            ${renderSvgWaypoints()}

            <!-- Live Bus Marker -->
            ${renderSvgBusMarker(trip)}
          </svg>
        </div>

        <!-- Driver Console (Demo) Box -->
        <div class="box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--line); padding-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <span style="font-weight:700; font-size:0.95rem;">Driver Console (Telemetry Simulation)</span>
            <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.82rem; font-weight:700; color:var(--muted);">
              <span>Sim Speed:</span>
              <div class="segmented-control">
                <button class="segmented-btn ${tracker.multiplier === 60 ? 'active' : ''}" onclick="tracker.setMultiplier(60)">×60</button>
                <button class="segmented-btn ${tracker.multiplier === 120 ? 'active' : ''}" onclick="tracker.setMultiplier(120)">×120</button>
                <button class="segmented-btn ${tracker.multiplier === 300 ? 'active' : ''}" onclick="tracker.setMultiplier(300)">×300</button>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:0.65rem; flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="tracker.startTrip(${busId})" ${trip.status !== 'SCHEDULED' ? 'disabled' : ''}>Start trip</button>
            <button class="btn btn-warn" onclick="tracker.setTrafficJam(${busId})" ${trip.status === 'COMPLETED' ? 'disabled' : ''}>Traffic jam (+15 min)</button>
            <button class="btn" onclick="tracker.resetTrip(${busId})">Reset trip</button>
          </div>
          <div style="font-size:0.8rem; color:var(--muted); margin-top:0.75rem;">
            Simulation controls let you observe toll alerts, rest stop halts and traffic jam delay handling in real-time.
          </div>
        </div>
      </div>

      <!-- Right Column: Time to Destination & Alerts -->
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        <div class="box">
          <div style="font-weight:900; font-size:1.1rem; margin-bottom:0.75rem;">Time to Destination</div>
          
          <div style="display:flex; align-items:baseline; gap:0.6rem; margin-bottom:0.25rem;">
            <span style="font-weight:900; font-size:2.4rem; color:var(--route); letter-spacing:-0.03em;">
              ${trip.status === 'COMPLETED' ? '0m' : tracker.formatDuration(trip.displayedDestEtaMin)}
            </span>
            <span style="color:var(--muted); font-size:0.9rem;">
              ${trip.status === 'COMPLETED' ? 'Arrived' : `Expected ${arrClockStr}`}
            </span>
          </div>

          <!-- Progress Bar -->
          <div style="width:100%; height:8px; background:var(--line); border-radius:999px; overflow:hidden; margin:0.75rem 0 1.25rem 0;">
            <div style="width:${(trip.progress * 100).toFixed(1)}%; height:100%; background:var(--route);"></div>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.88rem;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding-bottom:0.4rem;">
              <span style="color:var(--muted);">Current Speed</span>
              <span style="font-weight:800;">${Math.round(trip.speed)} km/h</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding-bottom:0.4rem;">
              <span style="color:var(--muted);">Distance Left</span>
              <span style="font-weight:800;">${remainingKm.toFixed(1)} km</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding-bottom:0.4rem;">
              <span style="color:var(--muted);">Next Stop</span>
              <span style="font-weight:800; text-align:right;">${nextStop.name} (~${etaNextMin}m)</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--muted);">Coordinates</span>
              <span style="font-family:monospace; font-size:0.8rem;">${curLat.toFixed(4)}, ${curLng.toFixed(4)}</span>
            </div>
          </div>

          ${trip.status === 'COMPLETED' ? `
            <div style="margin-top:1.25rem; background:var(--soft); padding:0.85rem; border-radius:6px; border:2px solid var(--line);">
              <div style="font-weight:900; color:var(--route); margin-bottom:0.25rem;">Trip Completed!</div>
              <div style="font-size:0.8rem; color:var(--muted);">Journey completed in ~180 simulated minutes across 240.6 km.</div>
            </div>
          ` : ''}
        </div>

        <!-- AI Trip Copilot Box -->
        <div class="box" style="background:var(--soft);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
            <div style="display:flex; align-items:center; gap:0.4rem; font-weight:900; font-size:0.95rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              AI Trip Copilot
            </div>
            <button class="chip chip-green" style="font-size:0.7rem; cursor:pointer;" onclick="fetchAiTripAdvisory(${bus.id})">Refresh ✨</button>
          </div>

          <div id="aiCopilotContent" style="font-size:0.82rem; line-height:1.4; color:var(--ink);">
            ${trip.aiAdvisory ? `
              <div style="margin-bottom:0.5rem;"><strong>Advisory:</strong> ${trip.aiAdvisory.advisory}</div>
              <div style="margin-bottom:0.5rem; color:var(--muted);"><strong>Dining tip:</strong> ${trip.aiAdvisory.foodTip}</div>
              <div style="color:var(--route); font-weight:700;"><strong>Traffic:</strong> ${trip.aiAdvisory.trafficOutlook}</div>
            ` : `
              <div style="color:var(--muted); font-size:0.82rem;">
                Click "Refresh ✨" to generate a live AI transit advisory for NH 48 based on real-time bus telemetry.
              </div>
            `}
          </div>
        </div>

        <!-- Trip Alerts List -->
        <div class="box">
          <div style="font-weight:900; margin-bottom:0.75rem;">Trip Alerts</div>
          <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:280px; overflow-y:auto;">
            ${trip.alerts.length === 0 ? `
              <div style="color:var(--muted); font-size:0.85rem; padding:0.5rem 0;">
                No alerts yet. They appear here as the bus reaches each alert window.
              </div>
            ` : trip.alerts.map(a => `
              <div style="padding:0.5rem; border-radius:6px; background:var(--soft); border-left:4px solid ${a.variant === 'toll' ? 'var(--toll)' : (a.variant === 'halt' ? 'var(--amber)' : 'var(--route)')};">
                <div style="display:flex; justify-content:space-between; font-weight:800; font-size:0.82rem;">
                  <span>${a.title}</span>
                  <span style="color:var(--muted); font-size:0.75rem;">${a.time}</span>
                </div>
                <div style="font-size:0.78rem; color:var(--ink); margin-top:2px;">${a.body}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSvgWaypoints() {
  const points = getStopPointOnSvg();
  return points.map((p, idx) => {
    const stop = STOPS[idx];
    if (stop.type === "TOLL_PLAZA") {
      // Barrier gate with red and white stripes
      return `
        <g transform="translate(${p.x - 14}, ${p.y - 14})">
          <rect width="28" height="12" fill="#fff" stroke="var(--toll)" stroke-width="2" rx="2" />
          <line x1="6" y1="0" x2="6" y2="12" stroke="var(--toll)" stroke-width="3" />
          <line x1="14" y1="0" x2="14" y2="12" stroke="var(--toll)" stroke-width="3" />
          <line x1="22" y1="0" x2="22" y2="12" stroke="var(--toll)" stroke-width="3" />
          <text x="14" y="24" text-anchor="middle" fill="var(--toll)" font-size="9" font-weight="800">${stop.name.split(' ')[0]}</text>
        </g>
      `;
    } else if (stop.type === "RESTAURANT_HALT") {
      // Amber circle with fork icon
      return `
        <g transform="translate(${p.x}, ${p.y})">
          <circle r="14" fill="var(--amber)" stroke="var(--ink)" stroke-width="2" />
          <path d="M-4 -6 L-4 0 L0 3 L0 7 M0 3 L4 0 L4 -6" stroke="var(--ink)" stroke-width="1.8" fill="none" />
          <text x="0" y="24" text-anchor="middle" fill="var(--ink)" font-size="9" font-weight="800">Food Halt</text>
        </g>
      `;
    } else {
      // Start or drop stop dot
      return `
        <g transform="translate(${p.x}, ${p.y})">
          <circle r="6" fill="var(--ink)" stroke="#fff" stroke-width="2" />
          <text x="0" y="${idx === 0 ? -10 : 20}" text-anchor="middle" fill="var(--ink)" font-size="9" font-weight="800">${stop.name.split(' ')[0]}</text>
        </g>
      `;
    }
  }).join('');
}

function renderSvgBusMarker(trip) {
  // Interpolate along approximate SVG route
  const stops = getStopPointOnSvg();
  // Find segment
  const f = Math.min(1.0, Math.max(0, trip.progress));
  let segIdx = 0;
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (f >= STOPS[i].f && f <= STOPS[i+1].f) {
      segIdx = i;
      break;
    }
  }
  const s0 = STOPS[segIdx];
  const s1 = STOPS[segIdx + 1] || s0;
  const p0 = stops[segIdx];
  const p1 = stops[segIdx + 1] || p0;
  const ratio = (s1.f - s0.f) === 0 ? 0 : (f - s0.f) / (s1.f - s0.f);

  const curX = p0.x + (p1.x - p0.x) * ratio;
  const curY = p0.y + (p1.y - p0.y) * ratio;
  const curAngle = p0.angle + (p1.angle - p0.angle) * ratio;

  return `
    <g transform="translate(${curX}, ${curY}) rotate(${curAngle})">
      <rect x="-16" y="-10" width="32" height="20" rx="4" fill="var(--amber)" stroke="var(--ink)" stroke-width="2" />
      <rect x="-12" y="-7" width="6" height="5" rx="1" fill="#fff" stroke="var(--ink)" stroke-width="1" />
      <rect x="-4" y="-7" width="6" height="5" rx="1" fill="#fff" stroke="var(--ink)" stroke-width="1" />
      <rect x="4" y="-7" width="8" height="14" rx="1" fill="#fff" stroke="var(--ink)" stroke-width="1" />
      <circle cx="-10" cy="11" r="2.5" fill="var(--ink)" />
      <circle cx="8" cy="11" r="2.5" fill="var(--ink)" />
    </g>
  `;
}

// 8. Operator Portal View
function renderAdminView() {
  const selectedBusId = state.adminSelectedBusId || 102;
  const selectedBus = BUSES.find(b => b.id === selectedBusId) || BUSES[0];
  const trips = Object.values(tracker.trips);

  // 5 KPIs
  const runningCount = trips.filter(t => t.status === "IN_TRANSIT" || t.status === "HALTED").length;
  const bookingsList = getSavedBookings();
  const confirmedCount = bookingsList.filter(b => b.status === "CONFIRMED").length;
  const todayBookings = 128 + confirmedCount;
  
  const additionalRev = bookingsList.filter(b => b.status === "CONFIRMED").reduce((sum, b) => sum + b.totalAmount, 0);
  const totalRev = 184200 + additionalRev;

  // Average occupancy
  const todayDate = state.search.date;
  let totalCap = 0;
  let totalBooked = 0;
  BUSES.forEach(b => {
    const inv = generateSeatInventory(b.id, todayDate);
    const count = Object.keys(inv).length;
    const booked = Object.values(inv).filter(s => s.status === 'BOOKED').length;
    totalCap += count;
    totalBooked += booked;
  });
  const avgOccupancy = Math.round((totalBooked / totalCap) * 100);
  const delayedCount = trips.filter(t => t.delayMin >= 10).length;

  // Passenger manifest for selected bus
  const inv = generateSeatInventory(selectedBusId, todayDate);
  const manifest = [];
  // add existing booked
  Object.values(inv).forEach(s => {
    if (s.status === 'BOOKED' && s.passenger) {
      manifest.push({ seat: s.id, name: s.passenger.name, age: s.passenger.age, gender: s.passenger.gender, boarding: s.passenger.boardingPoint });
    }
  });
  // add user's confirmed bookings for this bus
  bookingsList.forEach(b => {
    if (b.busId === selectedBusId && b.status === 'CONFIRMED') {
      b.passengers.forEach(p => {
        manifest.unshift({ seat: p.seat, name: p.name, age: p.age, gender: p.gender, boarding: b.boardingStop });
      });
    }
  });

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <h2 style="font-size:1.6rem; margin:0;">Operator Portal</h2>
      <div style="font-size:0.85rem; color:var(--muted); font-weight:700;">Live Dispatcher Dashboard</div>
    </div>

    <!-- 5 KPI cells in one bordered strip -->
    <div class="box" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:1rem; padding:1rem; margin-bottom:2rem;">
      <div>
        <div style="font-size:0.8rem; color:var(--muted); font-weight:700;">Running Trips</div>
        <div style="font-weight:900; font-size:1.6rem; color:var(--route);">${runningCount}</div>
      </div>
      <div style="border-left:2px solid var(--line); padding-left:1rem;">
        <div style="font-size:0.8rem; color:var(--muted); font-weight:700;">Bookings Today</div>
        <div style="font-weight:900; font-size:1.6rem;">${todayBookings}</div>
      </div>
      <div style="border-left:2px solid var(--line); padding-left:1rem;">
        <div style="font-size:0.8rem; color:var(--muted); font-weight:700;">Revenue Today</div>
        <div style="font-weight:900; font-size:1.6rem;">₹${totalRev.toLocaleString()}</div>
      </div>
      <div style="border-left:2px solid var(--line); padding-left:1rem;">
        <div style="font-size:0.8rem; color:var(--muted); font-weight:700;">Avg. Occupancy</div>
        <div style="font-weight:900; font-size:1.6rem;">${avgOccupancy}%</div>
      </div>
      <div style="border-left:2px solid var(--line); padding-left:1rem;">
        <div style="font-size:0.8rem; color:var(--muted); font-weight:700;">Delayed Buses</div>
        <div style="font-weight:900; font-size:1.6rem; color:${delayedCount > 0 ? 'var(--toll)' : 'var(--ink)'};">${delayedCount}</div>
      </div>
    </div>

    <!-- Grid Layout -->
    <div style="display:grid; grid-template-columns:1fr 360px; gap:2rem; align-items:flex-start;">
      <!-- Left: Fleet Map & Fleet Table -->
      <div>
        <div class="box" style="padding:1rem; margin-bottom:1.5rem;">
          <div style="font-weight:900; font-size:0.95rem; margin-bottom:0.75rem;">Multi-Bus Fleet Map</div>
          <svg viewBox="0 0 760 270" class="schematic-svg">
            <path d="${ROUTE_PATH_D}" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
            ${renderSvgWaypoints()}
            ${trips.map(t => renderSvgBusMarker(t)).join('')}
          </svg>
        </div>

        <div class="box" style="padding:1.25rem;">
          <div style="font-weight:900; font-size:1.1rem; margin-bottom:0.75rem;">Active Fleet Status</div>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
              <thead>
                <tr style="border-bottom:2px solid var(--ink);">
                  <th style="padding:0.4rem;">Bus</th>
                  <th style="padding:0.4rem;">Driver</th>
                  <th style="padding:0.4rem;">Status</th>
                  <th style="padding:0.4rem;">Speed</th>
                  <th style="padding:0.4rem;">Km Left</th>
                  <th style="padding:0.4rem;">ETA</th>
                </tr>
              </thead>
              <tbody>
                ${trips.map(t => {
                  const b = BUSES.find(item => item.id === t.busId) || BUSES[0];
                  const isSel = t.busId === selectedBusId;
                  const kmLeft = Math.max(0, ROUTE_KM * (1 - t.progress));
                  const statusChip = t.status === 'IN_TRANSIT' ? 'chip-green' : (t.status === 'HALTED' ? 'chip-amber' : (t.status === 'COMPLETED' ? 'chip-soft' : 'chip-soft'));
                  return `
                    <tr style="border-bottom:1px solid var(--line); cursor:pointer; background:${isSel ? 'var(--soft)' : 'transparent'};" onclick="selectAdminBus(${t.busId})">
                      <td style="padding:0.5rem; font-weight:800;">#${t.busId} ${t.busName}</td>
                      <td style="padding:0.5rem; color:var(--muted);">${b.driver.split('/')[0]}</td>
                      <td style="padding:0.5rem;"><span class="chip ${statusChip}" style="font-size:0.7rem;">${t.status}</span></td>
                      <td style="padding:0.5rem;">${Math.round(t.speed)} km/h</td>
                      <td style="padding:0.5rem;">${kmLeft.toFixed(0)} km</td>
                      <td style="padding:0.5rem; font-weight:800; color:var(--route);">${tracker.formatDuration(t.displayedDestEtaMin)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: Selected Bus Manifest & Recent Alerts -->
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        <div class="box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div>
              <span style="font-weight:900;">Manifest: Bus #${selectedBus.id}</span>
              <div style="font-size:0.8rem; color:var(--muted);">${manifest.length} passengers booked</div>
            </div>
            <a href="#/track/${selectedBus.id}" class="btn btn-primary" style="padding:0.25rem 0.6rem; font-size:0.8rem;">Track 🚌</a>
          </div>

          <div style="max-height:260px; overflow-y:auto; border-top:1px solid var(--line); padding-top:0.5rem;">
            ${manifest.length === 0 ? '<div style="color:var(--muted); font-size:0.85rem;">No passengers yet.</div>' : `
              <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                <thead>
                  <tr style="border-bottom:1px solid var(--line); color:var(--muted);">
                    <th style="padding:0.25rem;">Seat</th>
                    <th style="padding:0.25rem;">Passenger</th>
                    <th style="padding:0.25rem;">Age</th>
                    <th style="padding:0.25rem;">Boarding</th>
                  </tr>
                </thead>
                <tbody>
                  ${manifest.map(m => `
                    <tr style="border-bottom:1px solid var(--line);">
                      <td style="padding:0.35rem 0.25rem; font-weight:800; color:var(--route);">${m.seat}</td>
                      <td style="padding:0.35rem 0.25rem; font-weight:700;">${m.name}</td>
                      <td style="padding:0.35rem 0.25rem;">${m.age} (${m.gender[0]})</td>
                      <td style="padding:0.35rem 0.25rem; font-size:0.75rem; color:var(--muted);">${m.boarding.split(' ')[0]}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>
        </div>

        <!-- Recent Alerts Across Fleet -->
        <div class="box">
          <div style="font-weight:900; margin-bottom:0.75rem;">Recent Fleet Alerts</div>
          <div style="display:flex; flex-direction:column; gap:0.5rem; max-height:260px; overflow-y:auto;">
            ${tracker.alertsFeed.slice(0, 6).map(a => `
              <div style="padding:0.4rem; background:var(--soft); border-radius:6px; font-size:0.8rem; border-left:3px solid ${a.variant === 'toll' ? 'var(--toll)' : (a.variant === 'halt' ? 'var(--amber)' : 'var(--route)')};">
                <div style="display:flex; justify-content:space-between; font-weight:800;">
                  <span>${a.busName}: ${a.title}</span>
                  <span style="color:var(--muted); font-size:0.72rem;">${a.time}</span>
                </div>
                <div style="color:var(--muted); font-size:0.75rem; margin-top:2px;">${a.body}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

window.renderTrackView = renderTrackView;
window.renderAdminView = renderAdminView;
