import React, { useState, useEffect } from 'react';
import RouteMiniMap from './components/RouteMiniMap';

// =====================================================================
// Types & Interfaces
// =====================================================================

export interface Bus {
  id: number;
  operator: string;
  type: string;
  reg: string;
  driver: string;
  driverPhone: string;
  dep: string;
  arr: string;
  depStop: string;
  arrStop: string;
  fare: number;
  rating: number;
  reviews: number;
  layout: 'seater' | 'sleeper';
  ac: boolean;
  amenities: string[];
  liveTracking: boolean;
}

export interface Passenger {
  seat: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
}

export interface Booking {
  pnr: string;
  busId: number;
  operator: string;
  busType: string;
  reg: string;
  from: string;
  to: string;
  date: string;
  depTime: string;
  arrTime: string;
  seats: string[];
  passengers: Passenger[];
  totalAmount: number;
  bookedAt: string;
  status: 'CONFIRMED' | 'CANCELLED';
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: 'TOLL' | 'HALT' | 'DEPARTURE' | 'ARRIVAL';
  time: string;
}

// =====================================================================
// Static Data & Route Constants (NH-48 Corridor: Delhi ⇄ Jaipur)
// =====================================================================

const INITIAL_BUSES: Bus[] = [
  {
    id: 101,
    operator: 'Orbit Express Travels',
    type: 'Volvo Multi-Axle AC Seater (2+2)',
    reg: 'DL 01 PC 7710',
    driver: 'Ramesh Sharma',
    driverPhone: '+91 98290 12345',
    dep: '06:00',
    arr: '11:00',
    depStop: 'Kashmere Gate ISBT, Delhi',
    arrStop: 'Sindhi Camp, Jaipur',
    fare: 899,
    rating: 4.8,
    reviews: 1420,
    layout: 'seater',
    ac: true,
    amenities: ['Live tracking', 'Wi-Fi', 'Charging point', 'Water bottle', 'Reading light'],
    liveTracking: true
  },
  {
    id: 102,
    operator: 'Rajputana Premium Line',
    type: 'BharatBenz AC Sleeper (2+1)',
    reg: 'RJ 14 PA 3341',
    driver: 'Vikram Shekhawat',
    driverPhone: '+91 94140 67890',
    dep: '07:30',
    arr: '12:45',
    depStop: 'Dhaula Kuan Metro, Delhi',
    arrStop: 'Narayan Singh Circle, Jaipur',
    fare: 999,
    rating: 4.7,
    reviews: 890,
    layout: 'sleeper',
    ac: true,
    amenities: ['Live tracking', 'Blanket', 'Pillow', 'Charging point', 'Water bottle'],
    liveTracking: true
  },
  {
    id: 103,
    operator: 'Sharma Volvo Line',
    type: 'Non-AC Executive Seater (2+2)',
    reg: 'DL 04 EF 9922',
    driver: 'Anil Verma',
    driverPhone: '+91 98110 55443',
    dep: '08:15',
    arr: '13:45',
    depStop: 'Kashmere Gate ISBT, Delhi',
    arrStop: 'Sindhi Camp, Jaipur',
    fare: 449,
    rating: 4.2,
    reviews: 430,
    layout: 'seater',
    ac: false,
    amenities: ['Live tracking', 'Luggage space', 'Emergency exits'],
    liveTracking: true
  },
  {
    id: 104,
    operator: 'Marwar Highway Cruiser',
    type: 'Scania Metrolink AC Seater (2+2)',
    reg: 'RJ 02 GB 4118',
    driver: 'Kuldeep Yadav',
    driverPhone: '+91 99881 22334',
    dep: '13:00',
    arr: '18:00',
    depStop: 'Dhaula Kuan Metro, Delhi',
    arrStop: 'Sindhi Camp, Jaipur',
    fare: 799,
    rating: 4.6,
    reviews: 650,
    layout: 'seater',
    ac: true,
    amenities: ['Live tracking', 'Wi-Fi', 'Charging point', 'Reading light'],
    liveTracking: true
  },
  {
    id: 105,
    operator: 'Night Star Club Class',
    type: 'Volvo 9600 AC Sleeper (2+1)',
    reg: 'DL 01 SL 8810',
    driver: 'Mahesh Choudhary',
    driverPhone: '+91 98280 99881',
    dep: '21:30',
    arr: '02:30',
    depStop: 'Kashmere Gate ISBT, Delhi',
    arrStop: 'Sindhi Camp, Jaipur',
    fare: 1099,
    rating: 4.9,
    reviews: 2100,
    layout: 'sleeper',
    ac: true,
    amenities: ['Live tracking', 'Blanket', 'Pillow', 'Wi-Fi', 'Bottled water', 'Charging port'],
    liveTracking: true
  }
];

const CORRIDOR_WAYPOINTS = [
  { name: 'Kashmere Gate ISBT, Delhi', f: 0.00, km: 0, type: 'ORIGIN' },
  { name: 'Dhaula Kuan Metro, Delhi', f: 0.05, km: 14, type: 'BOARDING' },
  { name: 'Shahjahanpur Toll Plaza', f: 0.33, km: 92, type: 'TOLL' },
  { name: 'Highway Food Mall (Midway Halt)', f: 0.50, km: 140, type: 'HALT' },
  { name: 'Kotputli Toll Plaza', f: 0.83, km: 232, type: 'TOLL' },
  { name: 'Narayan Singh Circle, Jaipur', f: 0.985, km: 276, type: 'DROPPING' },
  { name: 'Sindhi Camp Central, Jaipur', f: 1.00, km: 280, type: 'DESTINATION' }
];

// =====================================================================
// Main Application Component
// =====================================================================

export default function App() {
  // Navigation tabs: 'search' | 'seats' | 'checkout' | 'pass' | 'trips' | 'track' | 'admin' | 'assistant'
  const [activeTab, setActiveTab] = useState<'search' | 'seats' | 'checkout' | 'pass' | 'trips' | 'track' | 'admin' | 'assistant'>('search');

  // Search parameters
  const [fromCity, setFromCity] = useState('Delhi');
  const [toCity, setToCity] = useState('Jaipur');
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [coachFilter, setCoachFilter] = useState('ALL');
  const [hasSearched, setHasSearched] = useState(true);

  // Sorting and sub-filters
  const [sortBy, setSortBy] = useState<'cheapest' | 'earliest' | 'rating'>('cheapest');
  const [filterAcOnly, setFilterAcOnly] = useState(false);
  const [filterSleeperOnly, setFilterSleeperOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(1200);

  // Seat selection state
  const [selectedBus, setSelectedBus] = useState<Bus | null>(INITIAL_BUSES[0]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['1A']);
  const [activeDeck, setActiveDeck] = useState<'LOWER' | 'UPPER'>('LOWER');
  const [holdTimerSeconds, setHoldTimerSeconds] = useState(600); // 10 minutes Redis lock emulation

  // Locked & booked seat lists
  const [bookedSeats] = useState<string[]>(['1C', '2D', '4A', 'L3', 'L7', 'U2', 'U8']);
  const [lockedSeats] = useState<string[]>(['3B', 'L9']);

  // Passenger & Checkout details
  const [passengers, setPassengers] = useState<Passenger[]>([
    { seat: '1A', name: 'Varun Sharma', age: 28, gender: 'Male' }
  ]);
  const [boardingStop, setBoardingStop] = useState('Kashmere Gate ISBT, Delhi (06:00)');
  const [droppingStop, setDroppingStop] = useState('Sindhi Camp Central, Jaipur (11:00)');
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // Bookings list & current confirmed pass
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([
    {
      pnr: 'SRX882910',
      busId: 101,
      operator: 'Orbit Express Travels',
      busType: 'Volvo Multi-Axle AC Seater (2+2)',
      reg: 'DL 01 PC 7710',
      from: 'Delhi (Kashmere Gate)',
      to: 'Jaipur (Sindhi Camp)',
      date: new Date().toISOString().split('T')[0],
      depTime: '06:00',
      arrTime: '11:00',
      seats: ['2A', '2B'],
      passengers: [
        { seat: '2A', name: 'Aarav Gupta', age: 29, gender: 'Male' },
        { seat: '2B', name: 'Rohan Meena', age: 27, gender: 'Male' }
      ],
      totalAmount: 1840,
      bookedAt: 'Today, 08:30 AM',
      status: 'CONFIRMED'
    }
  ]);
  const [currentTicket, setCurrentTicket] = useState<Booking | null>(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  // Live Tracking Telemetry state
  const [telemetry, setTelemetry] = useState({
    busId: 101,
    tripId: 5001,
    progress: 0.48, // 48% completed (~KM 134)
    speedKmph: 74,
    distanceKm: 142.0,
    etaText: '2h 18m',
    status: 'IN_TRANSIT',
    delayMinutes: 0
  });
  const [simMultiplier, setSimMultiplier] = useState<60 | 120 | 300>(60);

  // Notifications & Alert banners
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_1',
      title: 'Toll Plaza Proximity: Shahjahanpur',
      body: 'Approaching Shahjahanpur Toll Plaza (KM 92). Automated FASTag clearance active. Destination ETA: 2h 45m.',
      category: 'TOLL',
      time: '12m ago'
    },
    {
      id: 'notif_2',
      title: 'Wheels Rolling: Trip Commenced',
      body: 'Bus DL 01 PC 7710 departed from Kashmere Gate ISBT on schedule.',
      category: 'DEPARTURE',
      time: '1h 15m ago'
    }
  ]);
  const [activeBanner, setActiveBanner] = useState<NotificationItem | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // AI Assistant State
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // Hold Timer Effect (Redis 10-Minute Lock TTL Simulation)
  // -------------------------------------------------------------------
  useEffect(() => {
    if (selectedSeats.length === 0) return;
    const interval = setInterval(() => {
      setHoldTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSelectedSeats([]);
          return 600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSeats.length]);

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // -------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------
  const handleSwapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
  };

  const handleQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setTravelDate(d.toISOString().split('T')[0]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setActiveTab('search');
  };

  const handleOpenSeatSelection = (bus: Bus) => {
    setSelectedBus(bus);
    setSelectedSeats([]);
    setHoldTimerSeconds(600);
    setActiveTab('seats');
  };

  const handleToggleSeat = (seatId: string) => {
    if (bookedSeats.includes(seatId) || lockedSeats.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      const updated = selectedSeats.filter(s => s !== seatId);
      setSelectedSeats(updated);
      setPassengers(passengers.filter(p => p.seat !== seatId));
    } else {
      if (selectedSeats.length >= 6) {
        alert('Maximum 6 seats allowed per booking.');
        return;
      }
      const updated = [...selectedSeats, seatId];
      setSelectedSeats(updated);
      setPassengers([
        ...passengers,
        { seat: seatId, name: `Traveler ${updated.length}`, age: 26, gender: 'Male' }
      ]);
    }
  };

  const handleApplyPromo = () => {
    if (!selectedBus) return;
    const code = promoCode.trim().toUpperCase();
    const baseFare = selectedBus.fare * selectedSeats.length;

    if (code === 'SMART50') {
      setDiscountAmount(50);
      setPromoMessage('Promo SMART50 applied: ₹50 discount!');
    } else if (code === 'EXPRESS10') {
      const disc = Math.round(baseFare * 0.1);
      setDiscountAmount(disc);
      setPromoMessage(`Promo EXPRESS10 applied: 10% off (₹${disc})!`);
    } else {
      setDiscountAmount(0);
      setPromoMessage('Invalid promo code. Try SMART50 or EXPRESS10.');
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedBus || selectedSeats.length === 0) return;

    const baseAmount = selectedBus.fare * selectedSeats.length;
    const gst = Math.round(baseAmount * 0.05);
    const insurance = includeInsurance ? selectedSeats.length * 15 : 0;
    const finalAmount = Math.max(0, baseAmount + gst + insurance - discountAmount);

    const newBooking: Booking = {
      pnr: 'SRX' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      busId: selectedBus.id,
      operator: selectedBus.operator,
      busType: selectedBus.type,
      reg: selectedBus.reg,
      from: fromCity,
      to: toCity,
      date: travelDate,
      depTime: selectedBus.dep,
      arrTime: selectedBus.arr,
      seats: [...selectedSeats],
      passengers: [...passengers],
      totalAmount: finalAmount,
      bookedAt: 'Just now',
      status: 'CONFIRMED'
    };

    setConfirmedBookings([newBooking, ...confirmedBookings]);
    setCurrentTicket(newBooking);
    setSelectedSeats([]);
    setActiveTab('pass');

    // Trigger confirmation notification
    const confNotif: NotificationItem = {
      id: 'notif_' + Date.now(),
      title: 'Ticket Confirmed: ' + newBooking.pnr,
      body: `Booking confirmed for ${newBooking.seats.join(', ')} on ${selectedBus.operator}. Digital pass ready!`,
      category: 'DEPARTURE',
      time: 'Just now'
    };
    setNotifications([confNotif, ...notifications]);
    setActiveBanner(confNotif);
    setTimeout(() => setActiveBanner(null), 7000);
  };

  const handleCancelBooking = (pnr: string) => {
    if (!confirm('Are you sure you want to cancel booking ' + pnr + '? A cancellation fee applies.')) return;
    setConfirmedBookings(confirmedBookings.map(b => b.pnr === pnr ? { ...b, status: 'CANCELLED' } : b));
    alert('Booking ' + pnr + ' cancelled. Refund of 80% initiated to original payment method.');
  };

  const handleAiSmartSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiQuery })
      });
      const data = await res.json();
      setAiResponse(data.recommendation || 'Showing optimal buses matching your preference.');
    } catch {
      setAiResponse('AI Match: Orbit Express Travels and Rajputana Premium Line offer the highest punctuality and comfort along NH-48.');
    } finally {
      setAiLoading(false);
    }
  };

  // Filter & Sort Buses
  const filteredBuses = INITIAL_BUSES.filter(b => {
    if (coachFilter !== 'ALL') {
      if (coachFilter === 'AC_SLEEPER' && !(b.ac && b.layout === 'sleeper')) return false;
      if (coachFilter === 'VOLVO_LUXURY' && !b.type.includes('Volvo')) return false;
      if (coachFilter === 'NON_AC_SEATER' && (b.ac || b.layout === 'sleeper')) return false;
    }
    if (filterAcOnly && !b.ac) return false;
    if (filterSleeperOnly && b.layout !== 'sleeper') return false;
    if (b.fare > maxPrice) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'cheapest') return a.fare - b.fare;
    if (sortBy === 'earliest') return a.dep.localeCompare(b.dep);
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  // Calculate pricing summary
  const currentBaseTotal = selectedBus ? selectedBus.fare * selectedSeats.length : 0;
  const currentGst = Math.round(currentBaseTotal * 0.05);
  const currentInsurance = includeInsurance ? selectedSeats.length * 15 : 0;
  const currentGrandTotal = Math.max(0, currentBaseTotal + currentGst + currentInsurance - discountAmount);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* =============================================================== */}
      {/* 1. Top Navigation Bar (Constitution 3-Zone Contract)           */}
      {/* =============================================================== */}
      <header className="sticky-nav">
        <div className="nav-inner">
          {/* Zone 1: Brand Wordmark */}
          <div className="brand" onClick={() => setActiveTab('search')} style={{ cursor: 'pointer' }}>
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

          {/* Zone 2: Navigation Links */}
          <nav className="nav-links">
            <button
              className="nav-link"
              aria-current={activeTab === 'search' ? 'page' : undefined}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('search')}
            >
              Search & Book
            </button>
            <button
              className="nav-link"
              aria-current={activeTab === 'trips' ? 'page' : undefined}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('trips')}
            >
              My Trips ({confirmedBookings.length})
            </button>
            <button
              className="nav-link"
              aria-current={activeTab === 'track' ? 'page' : undefined}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('track')}
            >
              Live Telemetry
            </button>
            <button
              className="nav-link"
              aria-current={activeTab === 'admin' ? 'page' : undefined}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              onClick={() => setActiveTab('admin')}
            >
              Fleet Portal
            </button>
            <button
              className="nav-link"
              aria-current={activeTab === 'assistant' ? 'page' : undefined}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--route)', fontWeight: 700 }}
              onClick={() => setActiveTab('assistant')}
            >
              AI Copilot
            </button>
          </nav>

          {/* Zone 3: Notification Bell & User Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
            <button
              className="bell-btn"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title="View Live Transit Alerts"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notifications.length > 0 && <span className="bell-badge">{notifications.length}</span>}
            </button>

            {isNotifOpen && (
              <div className="notif-dropdown show">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Corridor Notifications</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{notifications.length} received</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div key={n.id} style={{ padding: '0.45rem', borderBottom: '1px solid var(--line-subtle)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                        <span>{n.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{n.time}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>{n.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>Varun</span>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Alert Banner Toast */}
      {activeBanner && (
        <div className="toast-stack">
          <div className={`toast-item alert-banner ${activeBanner.category === 'TOLL' ? 'toll' : 'halt'}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800 }}>{activeBanner.title}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{activeBanner.time}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '2px' }}>{activeBanner.body}</div>
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* 2. Main Content Body                                           */}
      {/* =============================================================== */}
      <main className="container">
        {/* ============================================================= */}
        {/* VIEW 1: SEARCH & BOOKING DISCOVERY                            */}
        {/* ============================================================= */}
        {activeTab === 'search' && (
          <div>
            {/* Hero Title */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h1 style={{ margin: 0, fontSize: '2.4rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, letterSpacing: '-0.025em' }}>
                Book the Bus. Watch It Arrive.
              </h1>
              <p style={{ margin: '0.4rem 0 0 0', color: 'var(--muted)', fontSize: '1.05rem', maxWidth: '640px' }}>
                Lock your seats for 10 minutes with zero concurrency conflicts. Track live GPS telemetry, automated toll updates, and food halts across NH-48.
              </p>
            </div>

            {/* Main Search View Form */}
            <div className="box" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  NH-48 Express Corridor Search
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" className="btn" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleQuickDate(0)}>Today</button>
                  <button type="button" className="btn" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleQuickDate(1)}>Tomorrow</button>
                  <button type="button" className="btn" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleQuickDate(2)}>+2 Days</button>
                </div>
              </div>

              <form onSubmit={handleSearchSubmit}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 42px repeat(auto-fit, minmax(200px, 1fr)) auto',
                  gap: '0.85rem',
                  alignItems: 'flex-end'
                }}>
                  {/* Origin */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      From (Origin)
                    </label>
                    <input
                      list="fromStops"
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      placeholder="e.g. Delhi"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'var(--panel)' }}
                      required
                    />
                    <datalist id="fromStops">
                      <option value="Delhi">Kashmere Gate ISBT</option>
                      <option value="Delhi (Dhaula Kuan)">Dhaula Kuan Metro</option>
                      <option value="Gurgaon">IFFCO Chowk</option>
                      <option value="Jaipur">Sindhi Camp Central</option>
                    </datalist>
                  </div>

                  {/* Swap Button */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={handleSwapCities}
                      title="Swap Origin and Destination"
                      className="btn"
                      style={{ height: '42px', width: '42px', padding: 0, borderRadius: '50%', marginBottom: '2px' }}
                    >
                      ⇄
                    </button>
                  </div>

                  {/* Destination */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      To (Destination)
                    </label>
                    <input
                      list="toStops"
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      placeholder="e.g. Jaipur"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'var(--panel)' }}
                      required
                    />
                    <datalist id="toStops">
                      <option value="Jaipur">Sindhi Camp Central</option>
                      <option value="Jaipur (Narayan Singh)">Narayan Singh Circle</option>
                      <option value="Delhi">Kashmere Gate ISBT</option>
                      <option value="Ajmer">Ajmer Central</option>
                    </datalist>
                  </div>

                  {/* Travel Date */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Travel Date
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setTravelDate(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'var(--panel)' }}
                      required
                    />
                  </div>

                  {/* Coach Type */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Coach Class
                    </label>
                    <select
                      value={coachFilter}
                      onChange={(e) => setCoachFilter(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'var(--panel)' }}
                    >
                      <option value="ALL">All Coaches</option>
                      <option value="AC_SLEEPER">AC Sleeper (2+1)</option>
                      <option value="VOLVO_LUXURY">Volvo Luxury (2+2)</option>
                      <option value="NON_AC_SEATER">Non-AC Seater</option>
                    </select>
                  </div>

                  {/* Search CTA */}
                  <div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ height: '42px', width: '100%', padding: '0.65rem 1.4rem' }}
                    >
                      Find Buses →
                    </button>
                  </div>
                </div>
              </form>

              {/* Natural Language AI Bus Finder */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--line-subtle)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Ask AI: e.g. 'Volvo coach leaving after 7 AM with Wi-Fi' or 'Affordable sleeper'"
                    style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', background: 'var(--panel)' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSmartSearch()}
                  />
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
                    onClick={handleAiSmartSearch}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Thinking...' : 'AI Search ✨'}
                  </button>
                </div>
                {aiResponse && (
                  <div style={{ marginTop: '0.65rem', padding: '0.6rem 0.8rem', background: 'var(--soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', borderLeft: '3px solid var(--route)' }}>
                    <strong>SmartRoute Copilot:</strong> {aiResponse}
                  </div>
                )}
              </div>
            </div>

            {/* Bus Results List & Filters Layout */}
            {hasSearched && (
              <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.75rem', alignItems: 'flex-start' }}>
                {/* Sidebar Filter Controls */}
                <aside className="box" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Filters</span>
                    <button
                      className="btn"
                      style={{ padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}
                      onClick={() => { setFilterAcOnly(false); setFilterSleeperOnly(false); setMaxPrice(1200); }}
                    >
                      Reset
                    </button>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Coach Features
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', marginBottom: '0.35rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={filterAcOnly} onChange={(e) => setFilterAcOnly(e.target.checked)} /> Air Conditioned (AC)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={filterSleeperOnly} onChange={(e) => setFilterSleeperOnly(e.target.checked)} /> Sleeper Berths
                    </label>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      <span>Max Fare</span>
                      <span style={{ color: 'var(--ink)' }}>₹{maxPrice}</span>
                    </div>
                    <input
                      type="range"
                      min="400"
                      max="1200"
                      step="50"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--line-subtle)', paddingTop: '0.85rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                      Corridor Trust
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                      All buses equipped with active GPS beacons & FastTag transit lanes.
                    </div>
                  </div>
                </aside>

                {/* Main Results Column */}
                <div>
                  {/* Sorting Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                      {filteredBuses.length} express buses found <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.9rem' }}>({fromCity} ➔ {toCity} · {travelDate})</span>
                    </div>

                    <div className="segmented-control">
                      <button className={`segmented-btn ${sortBy === 'cheapest' ? 'active' : ''}`} onClick={() => setSortBy('cheapest')}>Cheapest</button>
                      <button className={`segmented-btn ${sortBy === 'earliest' ? 'active' : ''}`} onClick={() => setSortBy('earliest')}>Earliest</button>
                      <button className={`segmented-btn ${sortBy === 'rating' ? 'active' : ''}`} onClick={() => setSortBy('rating')}>Top Rated</button>
                    </div>
                  </div>

                  {/* Bus Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredBuses.map((bus) => (
                      <div key={bus.id} className="bus-card">
                        <div>
                          {/* Operator & Type */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>
                              {bus.operator}
                            </span>
                            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{bus.type}</span>
                            <span style={{ color: 'var(--line)' }}>·</span>
                            <span style={{ color: 'var(--route)', fontWeight: 700, fontSize: '0.85rem' }}>
                              ★ {bus.rating} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.75rem' }}>({bus.reviews})</span>
                            </span>
                          </div>

                          {/* Timeline */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '0.85rem 0' }}>
                            <div>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1.25rem' }}>
                                {bus.dep}
                              </div>
                              <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{bus.depStop.split(',')[0]}</div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>5h 00m</span>
                              <div style={{ width: '100%', height: '2px', background: 'var(--route)', margin: '3px 0', borderRadius: '2px' }} />
                              <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Non-stop Express</span>
                            </div>

                            <div>
                              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1.25rem' }}>
                                {bus.arr}
                              </div>
                              <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{bus.arrStop.split(',')[0]}</div>
                            </div>
                          </div>

                          {/* Amenities */}
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--muted)' }}>
                            <span className="badge badge-route">● Live GPS</span>
                            <span>Wi-Fi</span>
                            <span>·</span>
                            <span>Charging Point</span>
                            <span>·</span>
                            <span>Water Bottle</span>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>From </span>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.55rem' }}>
                              ₹{bus.fare}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--route)', fontWeight: 700 }}>
                            14 seats left
                          </div>
                          <button
                            className="btn btn-primary"
                            style={{ marginTop: '0.35rem' }}
                            onClick={() => handleOpenSeatSelection(bus)}
                          >
                            Select Seats →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 2: INTERACTIVE SEAT SELECTION & REDIS LOCK               */}
        {/* ============================================================= */}
        {activeTab === 'seats' && selectedBus && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
                  Select Seats · {selectedBus.operator}
                </h2>
                <div style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                  {selectedBus.type} · Reg: {selectedBus.reg} · ₹{selectedBus.fare} per berth
                </div>
              </div>
              <button className="btn" onClick={() => setActiveTab('search')}>← Back to Buses</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'flex-start' }}>
              {/* Seat Map */}
              <div className="box" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>
                    Cabin Layout (Max 6 Seats)
                  </span>

                  {selectedSeats.length > 0 && (
                    <span className="badge badge-amber" style={{ fontSize: '0.82rem', padding: '0.25rem 0.6rem' }}>
                      Redis Hold Expires: {formatTime(holdTimerSeconds)}
                    </span>
                  )}
                </div>

                {/* Deck Switcher for Sleeper */}
                {selectedBus.layout === 'sleeper' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="segmented-control">
                      <button
                        className={`segmented-btn ${activeDeck === 'LOWER' ? 'active' : ''}`}
                        onClick={() => setActiveDeck('LOWER')}
                      >
                        Lower Deck (Berths L1-L15)
                      </button>
                      <button
                        className={`segmented-btn ${activeDeck === 'UPPER' ? 'active' : ''}`}
                        onClick={() => setActiveDeck('UPPER')}
                      >
                        Upper Deck (Berths U1-U15)
                      </button>
                    </div>
                  </div>
                )}

                {/* Bus Interior Box */}
                <div style={{
                  maxWidth: '360px',
                  margin: '0 auto',
                  border: '1.5px solid var(--line)',
                  borderRadius: '24px 24px 12px 12px',
                  padding: '1.5rem 1.25rem',
                  background: 'var(--soft)'
                }}>
                  {/* Driver Console Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--line)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Front · Driver Cab
                    </span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a10 10 0 0 0 0 20" />
                      <path d="M12 12 2 12" />
                    </svg>
                  </div>

                  {/* 2+2 Seater Grid */}
                  {selectedBus.layout === 'seater' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '44px 44px 24px 44px 44px', gap: '8px 6px', justifyContent: 'center' }}>
                      {Array.from({ length: 10 }).map((_, rIdx) => {
                        const row = rIdx + 1;
                        const sA = `${row}A`;
                        const sB = `${row}B`;
                        const sC = `${row}C`;
                        const sD = `${row}D`;

                        const renderBtn = (id: string) => {
                          const isSel = selectedSeats.includes(id);
                          const isLock = lockedSeats.includes(id);
                          const isBk = bookedSeats.includes(id);
                          let c = 'seat-btn';
                          if (isSel) c += ' selected';
                          else if (isLock) c += ' locked';
                          else if (isBk) c += ' booked';

                          return (
                            <button
                              key={id}
                              type="button"
                              className={c}
                              disabled={isBk}
                              onClick={() => handleToggleSeat(id)}
                            >
                              {id}
                            </button>
                          );
                        };

                        return (
                          <React.Fragment key={row}>
                            {renderBtn(sA)}
                            {renderBtn(sB)}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>
                              {row}
                            </div>
                            {renderBtn(sC)}
                            {renderBtn(sD)}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* 2+1 Sleeper Grid */}
                  {selectedBus.layout === 'sleeper' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '58px 24px 58px 58px', gap: '10px 8px', justifyContent: 'center' }}>
                      {Array.from({ length: 5 }).map((_, bIdx) => {
                        const pfx = activeDeck === 'LOWER' ? 'L' : 'U';
                        const n1 = `${pfx}${bIdx * 3 + 1}`;
                        const n2 = `${pfx}${bIdx * 3 + 2}`;
                        const n3 = `${pfx}${bIdx * 3 + 3}`;

                        const renderBerth = (id: string) => {
                          const isSel = selectedSeats.includes(id);
                          const isLock = lockedSeats.includes(id);
                          const isBk = bookedSeats.includes(id);
                          let c = 'seat-btn berth-btn';
                          if (isSel) c += ' selected';
                          else if (isLock) c += ' locked';
                          else if (isBk) c += ' booked';

                          return (
                            <button
                              key={id}
                              type="button"
                              className={c}
                              disabled={isBk}
                              onClick={() => handleToggleSeat(id)}
                            >
                              {id}
                            </button>
                          );
                        };

                        return (
                          <React.Fragment key={bIdx}>
                            {renderBerth(n1)}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>
                              {bIdx + 1}
                            </div>
                            {renderBerth(n2)}
                            {renderBerth(n3)}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar: Selection Summary & Proceed */}
              <div className="box" style={{ padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif' }}>
                  Trip Summary
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Route:</span>
                  <span style={{ fontWeight: 700 }}>{fromCity} ➔ {toCity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Departure:</span>
                  <span style={{ fontWeight: 700 }}>{selectedBus.dep} · {travelDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Seats Selected:</span>
                  <span style={{ fontWeight: 800, color: 'var(--route)' }}>
                    {selectedSeats.join(', ') || 'None selected'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Base Price:</span>
                  <span style={{ fontWeight: 800 }}>₹{currentBaseTotal}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                    <span>Estimated Fare:</span>
                    <span>₹{currentBaseTotal}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Taxes & GST computed at next step
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px' }}
                  disabled={selectedSeats.length === 0}
                  onClick={() => setActiveTab('checkout')}
                >
                  Continue to Passenger Details →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 3: PASSENGER DETAILS & CHECKOUT                         */}
        {/* ============================================================= */}
        {activeTab === 'checkout' && selectedBus && (
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
                Passenger & Payment Details
              </h2>
              <button className="btn" onClick={() => setActiveTab('seats')}>← Back to Seats</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.75rem', alignItems: 'flex-start' }}>
              {/* Passenger Forms */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {passengers.map((p, idx) => (
                  <div key={p.seat} className="box" style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.85rem' }}>
                      Passenger {idx + 1} · Seat <span style={{ color: 'var(--route)' }}>{p.seat}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].name = e.target.value;
                            setPassengers(updated);
                          }}
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                          Age
                        </label>
                        <input
                          type="number"
                          value={p.age}
                          min="5"
                          max="99"
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].age = Number(e.target.value);
                            setPassengers(updated);
                          }}
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                          Gender
                        </label>
                        <select
                          value={p.gender}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[idx].gender = e.target.value as any;
                            setPassengers(updated);
                          }}
                          style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Boarding and Dropping Stops */}
                <div className="box" style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.85rem' }}>
                    Stops Selection
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                        Boarding Point
                      </label>
                      <select
                        value={boardingStop}
                        onChange={(e) => setBoardingStop(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}
                      >
                        <option value="Kashmere Gate ISBT, Delhi (06:00)">Kashmere Gate ISBT (06:00 AM)</option>
                        <option value="Dhaula Kuan Metro, Delhi (06:30)">Dhaula Kuan Metro (06:30 AM)</option>
                        <option value="IFFCO Chowk, Gurgaon (07:00)">IFFCO Chowk, Gurgaon (07:00 AM)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                        Dropping Point
                      </label>
                      <select
                        value={droppingStop}
                        onChange={(e) => setDroppingStop(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}
                      >
                        <option value="Sindhi Camp Central, Jaipur (11:00)">Sindhi Camp Central (11:00 AM)</option>
                        <option value="Narayan Singh Circle, Jaipur (10:45)">Narayan Singh Circle (10:45 AM)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Sidebar */}
              <div className="box" style={{ padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontFamily: 'Outfit, sans-serif' }}>
                  Fare Breakdown
                </h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                  <span>Base Ticket ({selectedSeats.length} seats):</span>
                  <span>₹{currentBaseTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
                  <span>GST (5%):</span>
                  <span>₹{currentGst}</span>
                </div>

                <div style={{ marginBottom: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--line-subtle)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={includeInsurance} onChange={(e) => setIncludeInsurance(e.target.checked)} />
                    Add Transit Insurance (₹15/seat)
                  </label>
                </div>

                {/* Promo Code */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Promo Code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      style={{ flex: 1, padding: '0.45rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', background: 'var(--panel)' }}
                    />
                    <button className="btn" style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem' }} onClick={handleApplyPromo}>
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', color: discountAmount > 0 ? 'var(--route)' : 'var(--toll)' }}>
                      {promoMessage}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '0.85rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                    <span>Total Amount:</span>
                    <span style={{ color: 'var(--route)' }}>₹{currentGrandTotal}</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', height: '44px' }}
                  onClick={handleConfirmPayment}
                >
                  Pay ₹{currentGrandTotal} & Confirm →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 4: DIGITAL BOARDING PASS & QR CODE PASS                  */}
        {/* ============================================================= */}
        {activeTab === 'pass' && currentTicket && (
          <div style={{ maxWidth: '520px', margin: '2rem auto' }}>
            <div className="box" style={{ padding: '1.75rem', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
              <span className="badge badge-route" style={{ marginBottom: '0.75rem' }}>● CONFIRMED BOOKING</span>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontFamily: 'Outfit, sans-serif' }}>
                Digital Boarding Pass
              </h2>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: '0.25rem 0 1.25rem 0' }}>
                PNR Reference: <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, color: 'var(--ink)' }}>{currentTicket.pnr}</span>
              </div>

              {/* Simulated QR Code */}
              <div style={{ width: '130px', height: '130px', margin: '0 auto 1.25rem auto', border: '2px solid var(--ink)', padding: '6px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <rect x="0" y="0" width="30" height="30" fill="var(--ink)" />
                  <rect x="5" y="5" width="20" height="20" fill="#fff" />
                  <rect x="10" y="10" width="10" height="10" fill="var(--ink)" />
                  <rect x="70" y="0" width="30" height="30" fill="var(--ink)" />
                  <rect x="75" y="5" width="20" height="20" fill="#fff" />
                  <rect x="80" y="10" width="10" height="10" fill="var(--ink)" />
                  <rect x="0" y="70" width="30" height="30" fill="var(--ink)" />
                  <rect x="5" y="75" width="20" height="20" fill="#fff" />
                  <rect x="10" y="80" width="10" height="10" fill="var(--ink)" />
                  <rect x="40" y="20" width="10" height="40" fill="var(--ink)" />
                  <rect x="60" y="45" width="20" height="10" fill="var(--ink)" />
                  <rect x="45" y="70" width="25" height="15" fill="var(--ink)" />
                </svg>
              </div>

              <div style={{ background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'left', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Operator:</span>
                  <span style={{ fontWeight: 700 }}>{currentTicket.operator}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Seats:</span>
                  <span style={{ fontWeight: 800, color: 'var(--route)' }}>{currentTicket.seats.join(', ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Date & Time:</span>
                  <span style={{ fontWeight: 700 }}>{currentTicket.date} · {currentTicket.depTime}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 800 }}>₹{currentTicket.totalAmount}</span>
                </div>
              </div>

              {/* Integrated Mini-Map Preview of Route & Waypoints */}
              <RouteMiniMap
                origin={currentTicket.from}
                destination={currentTicket.to}
                totalDistanceKm={280}
                estimatedDuration="5h 00m"
              />

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => setActiveTab('track')}
                >
                  Track Bus Live on NH-48 →
                </button>
                <button
                  className="btn"
                  onClick={() => setIsRouteModalOpen(true)}
                  title="Expand Route Waypoints Modal"
                >
                  🗺️ Expand Map
                </button>
                <button
                  className="btn"
                  onClick={() => setActiveTab('trips')}
                >
                  My Trips
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 5: MY TRIPS & BOOKING HISTORY                            */}
        {/* ============================================================= */}
        {activeTab === 'trips' && (
          <div style={{ maxWidth: '840px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
                My Trips History
              </h2>
              <button className="btn btn-primary" onClick={() => setActiveTab('search')}>+ Book New Trip</button>
            </div>

            {confirmedBookings.length === 0 ? (
              <div className="box" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                No bookings recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {confirmedBookings.map((bk) => (
                  <div key={bk.pnr} className="box" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.2rem' }}>
                          {bk.operator}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{bk.busType} · {bk.reg}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge ${bk.status === 'CONFIRMED' ? 'badge-route' : 'badge-neutral'}`}>
                          {bk.status}
                        </span>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                          PNR: {bk.pnr}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', background: 'var(--soft)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '0.85rem' }}>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Seats</div>
                        <div style={{ fontWeight: 700 }}>{bk.seats.join(', ')}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Travel Date</div>
                        <div style={{ fontWeight: 700 }}>{bk.date}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Departure</div>
                        <div style={{ fontWeight: 700 }}>{bk.depTime}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Total Paid</div>
                        <div style={{ fontWeight: 800, color: 'var(--route)' }}>₹{bk.totalAmount}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {bk.status === 'CONFIRMED' && (
                        <button
                          className="btn"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          onClick={() => handleCancelBooking(bk.pnr)}
                        >
                          Cancel Booking
                        </button>
                      )}
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        onClick={() => { setCurrentTicket(bk); setActiveTab('track'); }}
                      >
                        Track Vehicle Live →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 6: LIVE GPS TRACKING & TELEMETRY DASHBOARD               */}
        {/* ============================================================= */}
        {activeTab === 'track' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.75rem', alignItems: 'flex-start' }}>
            {/* Left: Schematic Route Map & Simulation Controls */}
            <div>
              <div className="box" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>
                      NH-48 Corridor Live GPS Telemetry
                    </h3>
                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Delhi Kashmere Gate ➔ Jaipur Sindhi Camp</div>
                  </div>
                  <span className="badge badge-route">
                    ● {(telemetry.progress * 100).toFixed(0)}% Completed
                  </span>
                </div>

                {/* Vector Schematic SVG Route */}
                <svg viewBox="0 0 760 220" className="schematic-svg">
                  {/* Background Base Route Path */}
                  <path
                    d="M40 180 C 180 180, 240 70, 380 90 S 600 170, 720 50"
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Active Green Trail */}
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
                  {/* Stop Points */}
                  {CORRIDOR_WAYPOINTS.map((s, idx) => {
                    const cx = 40 + s.f * (720 - 40);
                    const cy = 180 - Math.sin(s.f * Math.PI) * 90;
                    return (
                      <g key={idx}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="6"
                          fill={s.f <= telemetry.progress ? 'var(--route)' : 'var(--panel)'}
                          stroke="var(--ink)"
                          strokeWidth="2"
                        />
                        <text x={cx} y={cy + 18} fontSize="9" fontWeight="700" textAnchor="middle" fill="var(--ink)">
                          {s.name.split(',')[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Simulation Testing Console */}
              <div className="box" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Driver GPS Stream Simulator</span>
                  <div className="segmented-control">
                    <button className={`segmented-btn ${simMultiplier === 60 ? 'active' : ''}`} onClick={() => setSimMultiplier(60)}>×60</button>
                    <button className={`segmented-btn ${simMultiplier === 120 ? 'active' : ''}`} onClick={() => setSimMultiplier(120)}>×120</button>
                    <button className={`segmented-btn ${simMultiplier === 300 ? 'active' : ''}`} onClick={() => setSimMultiplier(300)}>×300</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const nextP = Math.min(1, telemetry.progress + 0.1);
                      const remKm = parseFloat(((1 - nextP) * 280).toFixed(1));
                      const minsLeft = Math.round((remKm / 74) * 60);
                      setTelemetry({
                        ...telemetry,
                        progress: nextP,
                        distanceKm: remKm,
                        etaText: `${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`
                      });
                    }}
                  >
                    Advance GPS (+10%)
                  </button>
                  <button
                    className="btn btn-warn"
                    onClick={() => {
                      setTelemetry({
                        ...telemetry,
                        speedKmph: 12,
                        delayMinutes: telemetry.delayMinutes + 15
                      });
                    }}
                  >
                    Inject Traffic Jam (+15 min)
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setTelemetry({
                        busId: 101,
                        tripId: 5001,
                        progress: 0.05,
                        speedKmph: 74,
                        distanceKm: 266.0,
                        etaText: '3h 35m',
                        status: 'IN_TRANSIT',
                        delayMinutes: 0
                      });
                    }}
                  >
                    Reset Corridor
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Real-Time Telemetry Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="box" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Monotonic Decreasing ETA
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--route)', fontFamily: 'Outfit, sans-serif' }}>
                  {telemetry.etaText}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '4px' }}>
                  {telemetry.distanceKm} km remaining to Sindhi Camp Jaipur
                </div>
                {telemetry.delayMinutes > 0 && (
                  <div style={{ marginTop: '0.5rem', color: 'var(--toll)', fontWeight: 700, fontSize: '0.82rem' }}>
                    ⚠ Delayed by {telemetry.delayMinutes} mins due to toll lane queue
                  </div>
                )}
              </div>

              <div className="box" style={{ padding: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Vehicle Telemetry</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--soft)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Live Speed</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      {telemetry.speedKmph} <span style={{ fontSize: '0.75rem' }}>km/h</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--soft)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Next Stop</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      Food Mall
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 7: OPERATOR & ADMIN MULTI-BUS FLEET PORTAL               */}
        {/* ============================================================= */}
        {activeTab === 'admin' && (
          <div className="box" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif' }}>
                  Operator Fleet Telemetry Console
                </h2>
                <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Active Express Buses Monitored on NH-48 Corridor</div>
              </div>
              <span className="badge badge-route">● 5 Active Buses Monitored</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Operator & Reg</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Driver</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Speed</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Remaining KM</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>ETA</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {INITIAL_BUSES.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--line-subtle)' }}>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ fontWeight: 700 }}>{b.operator}</div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted)' }}>{b.reg}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>{b.driver}</td>
                      <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>74 km/h</td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>142 km</td>
                      <td style={{ padding: '0.85rem 0.5rem', color: 'var(--route)', fontWeight: 700 }}>2h 18m</td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span className="badge badge-route">IN TRANSIT</span>
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <button
                          className="btn"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => { setSelectedBus(b); setActiveTab('track'); }}
                        >
                          Track
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 8: AI TRIP COPILOT & TERMINAL GROUNDING                  */}
        {/* ============================================================= */}
        {activeTab === 'assistant' && (
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div className="box" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'Outfit, sans-serif' }}>
                SmartRoute AI Trip Copilot
              </h2>
              <div style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: '0.25rem 0 1.25rem 0' }}>
                Powered by Google Gemini 2.5 Flash with live Google Search & Maps grounding.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>Destination Weather (Jaipur)</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                    Pleasant temperatures around 28°C. Clear highway skies expected between Shahjahanpur and Jaipur.
                  </div>
                </div>
                <div style={{ background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>Sindhi Camp Transit Tips</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                    Walking distance to Jaipur Metro (Pink Line) Station. Pre-paid auto rickshaw booth located outside Gate 2.
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ask Transit Question</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="e.g. 'What are the food options at Highway Food Mall?' or 'Is Wi-Fi free?'"
                    style={{ flex: 1, padding: '0.6rem 0.85rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSmartSearch()}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleAiSmartSearch}
                    disabled={aiLoading}
                  >
                    {aiLoading ? 'Thinking...' : 'Ask Copilot'}
                  </button>
                </div>

                {aiResponse && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', borderLeft: '4px solid var(--route)', lineHeight: 1.5 }}>
                    <strong>Copilot Advisory:</strong> {aiResponse}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Route & Waypoints Modal */}
        {isRouteModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsRouteModalOpen(false)}>
            <div className="modal-card" style={{ maxWidth: '640px', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
                  NH-48 Corridor Bus Route & Waypoints
                </h3>
                <button className="btn" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setIsRouteModalOpen(false)}>✕</button>
              </div>

              <RouteMiniMap
                origin={currentTicket?.from || fromCity}
                destination={currentTicket?.to || toCity}
                totalDistanceKm={280}
                estimatedDuration="5h 00m"
              />

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => setIsRouteModalOpen(false)}>Close Preview</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
