import React, { useState } from 'react';

/**
 * SmartRoute Interactive Seat Selection Grid
 * Supports:
 * - 2+2 Seater configuration
 * - 2+1 Sleeper dual deck (Lower / Upper) layout
 * - Concurrency lock indicators (Held in Redis for 10 minutes)
 * - Window seat styling
 * - Maximum 6 seats selection constraint
 */
export default function SeatLayout({
  tripId,
  bus,
  selectedSeats = [],
  lockedSeats = [],
  bookedSeats = [],
  onToggleSeat,
  lockSecondsLeft = 600
}) {
  const [activeDeck, setActiveDeck] = useState('LOWER');

  const isSleeper = bus?.layout === 'SLEEPER_2X1' || bus?.bus_type === 'AC_SLEEPER';

  // Format countdown clock: MM:SS
  const mins = Math.floor(lockSecondsLeft / 60);
  const secs = lockSecondsLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const seaterRows = [
    { row: 1, seats: ['1A', '1B', '1C', '1D'] },
    { row: 2, seats: ['2A', '2B', '2C', '2D'] },
    { row: 3, seats: ['3A', '3B', '3C', '3D'] },
    { row: 4, seats: ['4A', '4B', '4C', '4D'] },
    { row: 5, seats: ['5A', '5B', '5C', '5D'] },
    { row: 6, seats: ['6A', '6B', '6C', '6D'] },
    { row: 7, seats: ['7A', '7B', '7C', '7D'] },
    { row: 8, seats: ['8A', '8B', '8C', '8D'] },
    { row: 9, seats: ['9A', '9B', '9C', '9D'] },
    { row: 10, seats: ['10A', '10B', '10C', '10D'] }
  ];

  const sleeperLowerBerths = [
    { row: 1, single: 'L1', double1: 'L2', double2: 'L3' },
    { row: 2, single: 'L4', double1: 'L5', double2: 'L6' },
    { row: 3, single: 'L7', double1: 'L8', double2: 'L9' },
    { row: 4, single: 'L10', double1: 'L11', double2: 'L12' },
    { row: 5, single: 'L13', double1: 'L14', double2: 'L15' }
  ];

  const sleeperUpperBerths = [
    { row: 1, single: 'U1', double1: 'U2', double2: 'U3' },
    { row: 2, single: 'U4', double1: 'U5', double2: 'U6' },
    { row: 3, single: 'U7', double1: 'U8', double2: 'U9' },
    { row: 4, single: 'U10', double1: 'U11', double2: 'U12' },
    { row: 5, single: 'U13', double1: 'U14', double2: 'U15' }
  ];

  const renderSeatButton = (seatId, isBerth = false) => {
    const isSelected = selectedSeats.includes(seatId);
    const isLocked = lockedSeats.includes(seatId);
    const isBooked = bookedSeats.includes(seatId);

    let className = `seat-btn ${isBerth ? 'berth-btn' : ''}`;
    if (isSelected) className += ' selected';
    else if (isLocked) className += ' locked';
    else if (isBooked) className += ' booked';

    return (
      <button
        key={seatId}
        type="button"
        disabled={isBooked}
        className={className}
        onClick={() => onToggleSeat && onToggleSeat(seatId)}
        title={`Seat ${seatId} ${isLocked ? '(Held by another user)' : isBooked ? '(Booked)' : isSelected ? '(Selected)' : '(Available)'}`}
      >
        {seatId}
      </button>
    );
  };

  return (
    <div className="box" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>
            Select Seats (Max 6)
          </span>
          {selectedSeats.length > 0 && (
            <span style={{ marginLeft: '0.65rem', color: 'var(--route)', fontWeight: 700, fontSize: '0.85rem' }}>
              Hold Active: {timeFormatted}
            </span>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '12px', height: '12px', border: '1.5px solid var(--line)', background: '#fff', borderRadius: '2px' }} /> Available
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--route)', borderRadius: '2px' }} /> Selected
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--amber-light)', border: '1px solid var(--amber)', borderRadius: '2px' }} /> Held (10m)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--line)', borderRadius: '2px' }} /> Booked
          </div>
        </div>
      </div>

      {isSleeper && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${activeDeck === 'LOWER' ? 'active' : ''}`}
              onClick={() => setActiveDeck('LOWER')}
            >
              Lower Deck
            </button>
            <button
              type="button"
              className={`segmented-btn ${activeDeck === 'UPPER' ? 'active' : ''}`}
              onClick={() => setActiveDeck('UPPER')}
            >
              Upper Deck
            </button>
          </div>
        </div>
      )}

      {/* Bus Cabin Boundary */}
      <div style={{
        maxWidth: '340px',
        margin: '0 auto',
        border: '1.5px solid var(--line)',
        borderRadius: '20px 20px 10px 10px',
        padding: '1.25rem 1rem',
        background: 'var(--soft)'
      }}>
        {/* Front / Driver cabin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--line)', paddingBottom: '0.65rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Front · Driver Cab</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 0 0 20" />
            <path d="M12 12 2 12" />
          </svg>
        </div>

        {/* 2+2 Seater Layout */}
        {!isSleeper && (
          <div style={{ display: 'grid', gridTemplateColumns: '44px 44px 24px 44px 44px', gap: '8px 6px', justifyContent: 'center' }}>
            {seaterRows.map((r) => (
              <React.Fragment key={r.row}>
                {renderSeatButton(r.seats[0])}
                {renderSeatButton(r.seats[1])}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>
                  {r.row}
                </div>
                {renderSeatButton(r.seats[2])}
                {renderSeatButton(r.seats[3])}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* 2+1 Sleeper Layout */}
        {isSleeper && (
          <div style={{ display: 'grid', gridTemplateColumns: '58px 24px 58px 58px', gap: '10px 8px', justifyContent: 'center' }}>
            {(activeDeck === 'LOWER' ? sleeperLowerBerths : sleeperUpperBerths).map((b, idx) => (
              <React.Fragment key={idx}>
                {renderSeatButton(b.single, true)}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>
                  {idx + 1}
                </div>
                {renderSeatButton(b.double1, true)}
                {renderSeatButton(b.double2, true)}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
