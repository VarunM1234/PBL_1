import React, { useState } from 'react';

export interface Waypoint {
  id: string;
  name: string;
  km: number;
  f: number; // Fraction 0.0 to 1.0 along route
  type: 'ORIGIN' | 'BOARDING' | 'TOLL' | 'HALT' | 'DROPPING' | 'DESTINATION';
  description: string;
}

const NH48_WAYPOINTS: Waypoint[] = [
  {
    id: 'wp_delhi',
    name: 'Kashmere Gate ISBT, Delhi',
    km: 0,
    f: 0.00,
    type: 'ORIGIN',
    description: 'Starting terminal & platform departure gate'
  },
  {
    id: 'wp_dhaula_kuan',
    name: 'Dhaula Kuan Metro, Delhi',
    km: 14,
    f: 0.05,
    type: 'BOARDING',
    description: 'South Delhi primary passenger pickup point'
  },
  {
    id: 'wp_shahjahanpur',
    name: 'Shahjahanpur Toll Plaza',
    km: 92,
    f: 0.33,
    type: 'TOLL',
    description: 'Haryana-Rajasthan state border FASTag automated toll barrier'
  },
  {
    id: 'wp_food_mall',
    name: 'Highway Food Mall (Midway Halt)',
    km: 140,
    f: 0.50,
    type: 'HALT',
    description: 'Scheduled 15-minute hygiene break with dining & clean restrooms'
  },
  {
    id: 'wp_kotputli',
    name: 'Kotputli Toll Plaza',
    km: 232,
    f: 0.83,
    type: 'TOLL',
    description: 'Mid-corridor express toll barrier'
  },
  {
    id: 'wp_narayan_singh',
    name: 'Narayan Singh Circle, Jaipur',
    km: 276,
    f: 0.985,
    type: 'DROPPING',
    description: 'East Jaipur passenger dropping point'
  },
  {
    id: 'wp_sindhi_camp',
    name: 'Sindhi Camp Central, Jaipur',
    km: 280,
    f: 1.00,
    type: 'DESTINATION',
    description: 'Final central terminal with immediate Jaipur Metro connection'
  }
];

interface RouteMiniMapProps {
  origin?: string;
  destination?: string;
  totalDistanceKm?: number;
  estimatedDuration?: string;
}

export default function RouteMiniMap({
  origin = 'Delhi (Kashmere Gate)',
  destination = 'Jaipur (Sindhi Camp)',
  totalDistanceKm = 280,
  estimatedDuration = '5h 00m'
}: RouteMiniMapProps) {
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(NH48_WAYPOINTS[3]); // Default to Food Mall

  // SVG dimensions
  const svgWidth = 520;
  const svgHeight = 150;

  // Function to compute (x, y) along the curved highway route
  const getWaypointCoordinates = (f: number) => {
    const startX = 40;
    const endX = 480;
    const x = startX + f * (endX - startX);
    // Smooth highway curve with sinusoidal deflection
    const y = 85 - Math.sin(f * Math.PI) * 45;
    return { x, y };
  };

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      marginTop: '1.25rem',
      textAlign: 'left'
    }}>
      {/* Mini-map Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Full Corridor Route & Key Waypoints Preview
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
            {origin} ➔ {destination}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span className="badge badge-route">
            {totalDistanceKm} km
          </span>
          <span className="badge badge-amber">
            {estimatedDuration}
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div style={{
        background: 'var(--soft)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem 0.5rem',
        border: '1px solid var(--line-subtle)',
        position: 'relative'
      }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {/* Defs for gradients and glow */}
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--route)" />
              <stop offset="50%" stopColor="var(--amber)" />
              <stop offset="100%" stopColor="var(--route)" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Road Bed (Thick Base Underlay) */}
          <path
            d="M 40 85 C 150 40, 220 30, 270 40 S 420 80, 480 85"
            fill="none"
            stroke="var(--line)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Highway Dashed Center Lane */}
          <path
            d="M 40 85 C 150 40, 220 30, 270 40 S 420 80, 480 85"
            fill="none"
            stroke="var(--panel)"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />

          {/* Route Trail Highlight (Highway Green) */}
          <path
            d="M 40 85 C 150 40, 220 30, 270 40 S 420 80, 480 85"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Waypoints Render Loop */}
          {NH48_WAYPOINTS.map((wp) => {
            const { x, y } = getWaypointCoordinates(wp.f);
            const isSelected = selectedWaypoint?.id === wp.id;

            let pinColor = 'var(--route)';
            let pinRadius = 6;
            if (wp.type === 'ORIGIN' || wp.type === 'DESTINATION') {
              pinRadius = 8;
            } else if (wp.type === 'TOLL') {
              pinColor = 'var(--toll)';
            } else if (wp.type === 'HALT') {
              pinColor = 'var(--amber)';
              pinRadius = 7;
            }

            return (
              <g
                key={wp.id}
                onClick={() => setSelectedWaypoint(wp)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer halo when selected */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r={pinRadius + 6}
                    fill="none"
                    stroke={pinColor}
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    opacity="0.8"
                  />
                )}

                {/* Waypoint circle pin */}
                <circle
                  cx={x}
                  cy={y}
                  r={pinRadius}
                  fill={pinColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                {/* Milestone KM Badge on Top/Bottom */}
                <text
                  x={x}
                  y={wp.f > 0.4 && wp.f < 0.8 ? y - 13 : y + 20}
                  fontSize="8.5"
                  fontWeight="800"
                  textAnchor="middle"
                  fill="var(--ink)"
                  fontFamily="Outfit, sans-serif"
                >
                  {wp.km} KM
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Waypoint Detail Card Overlay */}
        {selectedWaypoint && (
          <div style={{
            marginTop: '0.65rem',
            padding: '0.65rem 0.85rem',
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span>{selectedWaypoint.name}</span>
                <span className={`badge ${selectedWaypoint.type === 'TOLL' ? 'badge-toll' : selectedWaypoint.type === 'HALT' ? 'badge-amber' : 'badge-route'}`}>
                  {selectedWaypoint.type === 'TOLL' ? 'FASTag Toll' : selectedWaypoint.type === 'HALT' ? '15m Meal Halt' : selectedWaypoint.type}
                </span>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                {selectedWaypoint.description}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--muted)', minWidth: '60px' }}>
              KM {selectedWaypoint.km}
            </div>
          </div>
        )}
      </div>

      {/* Corridor Milestone Stepper Timeline */}
      <div style={{
        marginTop: '0.85rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
        gap: '0.5rem',
        fontSize: '0.75rem',
        textAlign: 'center'
      }}>
        <div style={{ padding: '0.35rem', background: 'var(--soft)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontWeight: 700 }}>Delhi (ISBT)</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>KM 0 · Start</div>
        </div>
        <div style={{ padding: '0.35rem', background: 'var(--soft)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontWeight: 700 }}>Shahjahanpur</div>
          <div style={{ color: 'var(--toll)', fontSize: '0.7rem', fontWeight: 600 }}>KM 92 · Toll</div>
        </div>
        <div style={{ padding: '0.35rem', background: 'var(--soft)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontWeight: 700 }}>Food Mall</div>
          <div style={{ color: 'var(--amber)', fontSize: '0.7rem', fontWeight: 600 }}>KM 140 · Break</div>
        </div>
        <div style={{ padding: '0.35rem', background: 'var(--soft)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontWeight: 700 }}>Kotputli</div>
          <div style={{ color: 'var(--toll)', fontSize: '0.7rem', fontWeight: 600 }}>KM 232 · Toll</div>
        </div>
        <div style={{ padding: '0.35rem', background: 'var(--soft)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontWeight: 700 }}>Jaipur Central</div>
          <div style={{ color: 'var(--route)', fontSize: '0.7rem', fontWeight: 600 }}>KM 280 · Dest</div>
        </div>
      </div>
    </div>
  );
}
