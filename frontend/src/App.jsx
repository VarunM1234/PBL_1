import React, { useState } from 'react';
import BookingForm from './components/BookingForm';
import SeatLayout from './components/SeatLayout';
import LiveTrackerMap from './components/LiveTrackerMap';
import MultiBusFleetTracker from './admin/MultiBusFleetTracker';

/**
 * SmartRoute Master Frontend Application
 * Coordinates Search, Seat Booking, Live GPS Tracking, and Operator Portals.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'tracking' | 'admin'
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState(['1C', '2D', '4A', 'L3', 'L7']);
  const [lockedSeats, setLockedSeats] = useState(['3B', 'L9']);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const handleSearch = async (params) => {
    try {
      const res = await fetch(`/api/search?fromCity=${params.fromCity}&toCity=${params.toCity}&travelDate=${params.travelDate}&busType=${params.busType}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.warn('Using client catalogue fallback:', err);
    }
  };

  const handleToggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= 6) {
        alert('Maximum 6 seats per booking transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleConfirmBooking = () => {
    if (selectedSeats.length === 0) return;
    const pnr = 'SRX' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newBooking = {
      pnr,
      bus: selectedBus || searchResults[0],
      seats: selectedSeats,
      totalAmount: (selectedBus ? selectedBus.base_fare : 899) * selectedSeats.length,
      bookedAt: new Date().toLocaleTimeString()
    };
    setConfirmedBooking(newBooking);
    setBookedSeats(prev => [...prev, ...selectedSeats]);
    setSelectedSeats([]);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Top Bar Navigation */}
      <header className="sticky-nav">
        <div className="nav-inner">
          <div className="brand">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="6" width="28" height="18" rx="4" fill="var(--amber)" stroke="var(--ink)" strokeWidth="2" />
              <rect x="6" y="9" width="6" height="5" rx="1" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
              <rect x="14" y="9" width="6" height="5" rx="1" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
              <rect x="22" y="9" width="4" height="10" rx="1" fill="#fff" stroke="var(--ink)" strokeWidth="1.5" />
              <circle cx="8" cy="24" r="3" fill="var(--ink)" />
              <circle cx="24" cy="24" r="3" fill="var(--ink)" />
            </svg>
            <span>SmartRoute</span>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-link ${activeTab === 'search' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('search')}
            >
              Search & Book
            </button>
            <button
              className={`nav-link ${activeTab === 'tracking' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('tracking')}
            >
              Live Tracking
            </button>
            <button
              className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('admin')}
            >
              Fleet Portal
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="container">
        {activeTab === 'search' && (
          <div>
            <BookingForm onSearch={handleSearch} />

            {/* Results Grid */}
            {searchResults.length > 0 && !selectedBus && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
                  {searchResults.length} Express Buses Available
                </h3>
                {searchResults.map((b) => (
                  <div key={b.bus_id} className="bus-card">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif' }}>
                          {b.operator_name}
                        </span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{b.bus_type}</span>
                        <span style={{ color: 'var(--route)', fontWeight: 700, fontSize: '0.85rem' }}>
                          ★ {b.operator_rating}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', margin: '0.75rem 0' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
                            {b.departure_time?.substring(0, 5)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Delhi</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>3h 00m</span>
                          <div style={{ width: '60px', height: '2px', background: 'var(--route)', margin: '3px 0' }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Non-stop</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
                            {b.arrival_time?.substring(0, 5)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Jaipur</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                        ₹{b.base_fare}
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => setSelectedBus(b)}
                      >
                        Select Seats →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Seat Selection View */}
            {selectedBus && !confirmedBooking && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontFamily: 'Outfit, sans-serif' }}>
                    Select Seats · {selectedBus.operator_name} (₹{selectedBus.base_fare}/seat)
                  </h3>
                  <button className="btn" onClick={() => setSelectedBus(null)}>← Change Bus</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <SeatLayout
                    bus={selectedBus}
                    selectedSeats={selectedSeats}
                    lockedSeats={lockedSeats}
                    bookedSeats={bookedSeats}
                    onToggleSeat={handleToggleSeat}
                  />

                  {/* Summary Card */}
                  <div className="box" style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.85rem' }}>Fare Summary</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span>Selected Seats:</span>
                      <span style={{ fontWeight: 700 }}>{selectedSeats.join(', ') || 'None'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
                      <span>Total Amount:</span>
                      <span style={{ fontWeight: 800, color: 'var(--route)', fontSize: '1.2rem' }}>
                        ₹{selectedSeats.length * selectedBus.base_fare}
                      </span>
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', height: '42px' }}
                      disabled={selectedSeats.length === 0}
                      onClick={handleConfirmBooking}
                    >
                      Confirm Booking ({selectedSeats.length}) →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmed Booking Ticket Pass */}
            {confirmedBooking && (
              <div className="box" style={{ maxWidth: '480px', margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎟️</div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif' }}>Booking Confirmed!</h3>
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0.5rem 0 1rem 0' }}>
                  PNR Reference: <span style={{ fontWeight: 800, color: 'var(--route)', fontFamily: 'JetBrains Mono, monospace' }}>{confirmedBooking.pnr}</span>
                </div>
                <div style={{ background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: '0.9rem' }}>
                  <div><strong>Operator:</strong> {confirmedBooking.bus?.operator_name}</div>
                  <div><strong>Seats:</strong> {confirmedBooking.seats.join(', ')}</div>
                  <div><strong>Total Paid:</strong> ₹{confirmedBooking.totalAmount} (via UPI)</div>
                </div>

                {/* SVG Mini-Map Preview */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Route Preview · NH-48 Express (280 km)
                  </div>
                  <svg viewBox="0 0 460 70" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    <path d="M 30 35 Q 230 10 430 35" fill="none" stroke="var(--line)" strokeWidth="6" strokeLinecap="round" />
                    <path d="M 30 35 Q 230 10 430 35" fill="none" stroke="var(--route)" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="30" cy="35" r="5" fill="var(--route)" stroke="#fff" strokeWidth="2" />
                    <text x="30" y="55" fontSize="8" fontWeight="700" textAnchor="middle" fill="var(--ink)">Delhi</text>
                    <circle cx="160" cy="24" r="4" fill="var(--toll)" stroke="#fff" strokeWidth="1.5" />
                    <text x="160" y="44" fontSize="7.5" fontWeight="600" textAnchor="middle" fill="var(--ink)">Toll (KM 92)</text>
                    <circle cx="230" cy="22" r="4.5" fill="var(--amber)" stroke="#fff" strokeWidth="1.5" />
                    <text x="230" y="42" fontSize="7.5" fontWeight="700" textAnchor="middle" fill="var(--ink)">Food Mall (15m)</text>
                    <circle cx="330" cy="25" r="4" fill="var(--toll)" stroke="#fff" strokeWidth="1.5" />
                    <text x="330" y="45" fontSize="7.5" fontWeight="600" textAnchor="middle" fill="var(--ink)">Toll (KM 232)</text>
                    <circle cx="430" cy="35" r="5" fill="var(--route)" stroke="#fff" strokeWidth="2" />
                    <text x="430" y="55" fontSize="8" fontWeight="700" textAnchor="middle" fill="var(--ink)">Jaipur</text>
                  </svg>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1.25rem', width: '100%' }}
                  onClick={() => { setConfirmedBooking(null); setSelectedBus(null); setActiveTab('tracking'); }}
                >
                  Track Bus Live on NH-48 →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracking' && <LiveTrackerMap busId={101} />}
        {activeTab === 'admin' && <MultiBusFleetTracker />}
      </main>
    </div>
  );
}
