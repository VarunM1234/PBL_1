import React, { useState } from 'react';

/**
 * SmartRoute BookingForm Component
 * Allows passengers to input origin, destination, travel date, and coach filter.
 * Features quick-swap button and common stop suggestions.
 */
export default function BookingForm({ onSearch, loading = false }) {
  const [params, setParams] = useState({
    fromCity: 'Delhi',
    toCity: 'Jaipur',
    travelDate: new Date().toISOString().split('T')[0],
    busType: 'ALL'
  });

  const handleSwap = () => {
    setParams(prev => ({
      ...prev,
      fromCity: prev.toCity,
      toCity: prev.fromCity
    }));
  };

  const handleQuickDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setParams(prev => ({
      ...prev,
      travelDate: d.toISOString().split('T')[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(params);
    }
  };

  return (
    <div className="box" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontFamily: 'Outfit, sans-serif' }}>Search Bus Tickets</h2>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>NH-48 Express Corridor (Delhi ⇄ Jaipur)</div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            onClick={() => handleQuickDate(0)}
          >
            Today
          </button>
          <button
            type="button"
            className="btn"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            onClick={() => handleQuickDate(1)}
          >
            Tomorrow
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) 44px repeat(auto-fit, minmax(180px, 1fr)) auto',
          gap: '0.85rem',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              From City / Stop
            </label>
            <input
              list="fromCitiesList"
              value={params.fromCity}
              onChange={(e) => setParams({ ...params, fromCity: e.target.value })}
              placeholder="e.g. Delhi (Kashmere Gate)"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'var(--panel)' }}
              required
            />
            <datalist id="fromCitiesList">
              <option value="Delhi">Kashmere Gate ISBT</option>
              <option value="Delhi (Dhaula Kuan)">Dhaula Kuan Metro</option>
              <option value="Gurgaon">IFFCO Chowk</option>
              <option value="Jaipur">Sindhi Camp Central</option>
            </datalist>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Origin and Destination"
              className="btn"
              style={{ height: '42px', width: '42px', padding: 0, borderRadius: '50%', marginBottom: '2px' }}
            >
              ⇄
            </button>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              To City / Stop
            </label>
            <input
              list="toCitiesList"
              value={params.toCity}
              onChange={(e) => setParams({ ...params, toCity: e.target.value })}
              placeholder="e.g. Jaipur (Sindhi Camp)"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'var(--panel)' }}
              required
            />
            <datalist id="toCitiesList">
              <option value="Jaipur">Sindhi Camp Central</option>
              <option value="Jaipur (Narayan Singh)">Narayan Singh Circle</option>
              <option value="Delhi">Kashmere Gate ISBT</option>
              <option value="Ajmer">Ajmer Central</option>
            </datalist>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              Travel Date
            </label>
            <input
              type="date"
              value={params.travelDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setParams({ ...params, travelDate: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'var(--panel)' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              Coach Category
            </label>
            <select
              value={params.busType}
              onChange={(e) => setParams({ ...params, busType: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--line)', borderRadius: 'var(--radius-sm)', fontWeight: 600, background: 'var(--panel)' }}
            >
              <option value="ALL">All Categories</option>
              <option value="AC_SLEEPER">AC Sleeper (2+1)</option>
              <option value="VOLVO_LUXURY">Volvo Multi-Axle</option>
              <option value="NON_AC_SEATER">Non-AC Seater</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ height: '42px', width: '100%', padding: '0.65rem 1.4rem' }}
            >
              {loading ? 'Searching...' : 'Search Buses →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
