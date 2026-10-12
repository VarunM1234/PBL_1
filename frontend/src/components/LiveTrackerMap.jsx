import React, { useEffect, useState } from 'react';

/**
 * SmartRoute LiveTrackerMap Component
 * Features:
 * 1. Vector Schematic SVG Highway Map for NH-48 (Delhi ⇄ Jaipur)
 * 2. Real-time decreasing ETA calculation and speed telemetry
 * 3. Idempotent Waypoint Alerts Banner Stack (Tolls, Meal Stops)
 * 4. Driver Simulation controls for instant verification
 */
export default function LiveTrackerMap({ busId = 101, socket }) {
  const [telemetry, setTelemetry] = useState({
    busId: 101,
    tripId: 5001,
    operator: 'Orbit Express Travels',
    currentLat: 28.2541,
    currentLng: 76.8912,
    speedKmph: 74,
    distanceKm: 142.0,
    etaText: '2h 18m',
    progress: 0.48,
    status: 'IN_TRANSIT',
    nextStop: 'Highway Food Mall (Midway Halt)'
  });

  const [activeAlert, setActiveAlert] = useState(null);
  const [simSpeed, setSimSpeed] = useState(60);

  useEffect(() => {
    if (!socket) return;

    socket.emit('TRACK_BUS', { busId });

    socket.on('BUS_LOCATION_UPDATED', (packet) => {
      if (packet.busId === Number(busId)) {
        setTelemetry(packet);
      }
    });

    socket.on('LIVE_NOTIFICATION_ALERT', (alert) => {
      setActiveAlert(alert);
      setTimeout(() => {
        setActiveAlert(null);
      }, 9000);
    });

    return () => {
      socket.emit('UNTRACK_BUS', { busId });
      socket.off('BUS_LOCATION_UPDATED');
      socket.off('LIVE_NOTIFICATION_ALERT');
    };
  }, [busId, socket]);

  // Waypoints along NH-48
  const stops = [
    { name: 'Kashmere Gate ISBT', f: 0.00, km: 0, type: 'ORIGIN' },
    { name: 'Dhaula Kuan', f: 0.05, km: 14, type: 'BOARDING' },
    { name: 'Shahjahanpur Toll', f: 0.33, km: 92, type: 'TOLL' },
    { name: 'Highway Food Mall', f: 0.50, km: 140, type: 'HALT' },
    { name: 'Kotputli Toll', f: 0.83, km: 232, type: 'TOLL' },
    { name: 'Sindhi Camp Jaipur', f: 1.00, km: 280, type: 'DESTINATION' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'flex-start' }}>
      {/* Schematic Map & Driver Controls */}
      <div>
        {activeAlert && (
          <div className={`toast-item alert-banner ${activeAlert.category === 'TOLL' ? 'toll' : 'halt'}`} style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800 }}>{activeAlert.title}</span>
              <span className="badge badge-amber">{activeAlert.overallETA} ETA</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
              {activeAlert.body}
            </div>
          </div>
        )}

        <div className="box" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif' }}>
                Schematic Route Corridor (NH-48)
              </h3>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Delhi Kashmere Gate ➔ Jaipur Sindhi Camp</div>
            </div>
            <span className="badge badge-route">
              ● {(telemetry.progress * 100).toFixed(0)}% Completed
            </span>
          </div>

          {/* SVG Highway Path */}
          <svg viewBox="0 0 760 220" className="schematic-svg">
            <path
              d="M40 180 C 180 180, 240 70, 380 90 S 600 170, 720 50"
              fill="none"
              stroke="var(--line)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M40 180 C 180 180, 240 70, 380 90 S 600 170, 720 50"
              fill="none"
              stroke="var(--route)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="100"
              strokeDashoffset={100 - (telemetry.progress * 100)}
              pathLength="100"
            />
            {stops.map((s, idx) => {
              const cx = 40 + s.f * (720 - 40);
              const cy = 180 - Math.sin(s.f * Math.PI) * 90;
              return (
                <g key={idx}>
                  <circle cx={cx} cy={cy} r="6" fill={s.f <= telemetry.progress ? 'var(--route)' : 'var(--panel)'} stroke="var(--ink)" strokeWidth="2" />
                  <text x={cx} y={cy + 18} fontSize="9" fontWeight="700" textAnchor="middle" fill="var(--ink)">
                    {s.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Driver Simulation Box */}
        <div className="box" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Driver Telemetry Simulator</span>
            <div className="segmented-control">
              <button className={`segmented-btn ${simSpeed === 60 ? 'active' : ''}`} onClick={() => setSimSpeed(60)}>×60</button>
              <button className={`segmented-btn ${simSpeed === 120 ? 'active' : ''}`} onClick={() => setSimSpeed(120)}>×120</button>
              <button className={`segmented-btn ${simSpeed === 300 ? 'active' : ''}`} onClick={() => setSimSpeed(300)}>×300</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setTelemetry(t => ({ ...t, progress: Math.min(1, t.progress + 0.1) }))}>
              Step Telemetry (+10%)
            </button>
            <button className="btn btn-warn" onClick={() => setTelemetry(t => ({ ...t, speedKmph: 12, delayMinutes: (t.delayMinutes || 0) + 15 }))}>
              Simulate Traffic Jam
            </button>
            <button className="btn" onClick={() => setTelemetry(t => ({ ...t, progress: 0.05, speedKmph: 74, delayMinutes: 0 }))}>
              Reset Corridor
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="box" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            Destination Arrival Time
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--route)', fontFamily: 'Outfit, sans-serif' }}>
            {telemetry.etaText}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
            {telemetry.distanceKm} km remaining to Jaipur
          </div>
        </div>

        <div className="box" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.65rem' }}>Corridor Telemetry</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'var(--soft)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Live Speed</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                {telemetry.speedKmph} <span style={{ fontSize: '0.75rem' }}>km/h</span>
              </div>
            </div>
            <div style={{ background: 'var(--soft)', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Next Stop</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Food Mall
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
