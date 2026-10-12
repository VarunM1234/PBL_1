import React, { useState } from 'react';

/**
 * SmartRoute Enterprise Operator & Admin CRUD Portal
 * Features:
 * 1. Active Fleet Telemetry Tracker with live speeds & ETAs
 * 2. Fleet Asset Management (Add/Edit bus registrations, layouts, amenities)
 * 3. Staff & Crew Management (Drivers & conductors, licensing, duty toggle)
 * 4. Route & Waypoint Management (Sequence, Toll Plazas, Meal Halts)
 * 5. Booking Manifests & Revenue Analytics (Daily gross revenue ₹, occupancy rate)
 */
export default function MultiBusFleetTracker({ buses = [] }) {
  const [adminTab, setAdminTab] = useState('telemetry'); // 'telemetry' | 'fleet' | 'staff' | 'routes' | 'analytics'
  const [selectedBusForManifest, setSelectedBusForManifest] = useState(null);

  // Fleet Asset State
  const [fleetList, setFleetList] = useState([
    { id: 101, reg: 'DL 01 PC 7710', operator: 'Orbit Express Travels', type: 'VOLVO_LUXURY', seats: 40, layout: '2+2', status: 'ACTIVE', driver: 'Ramesh Sharma', speed: 74, distanceLeft: 142, eta: '2h 18m' },
    { id: 102, reg: 'RJ 14 PA 3341', operator: 'Rajputana Premium Line', type: 'AC_SLEEPER', seats: 30, layout: '2+1', status: 'ACTIVE', driver: 'Vikram Shekhawat', speed: 68, distanceLeft: 188, eta: '3h 02m' },
    { id: 103, reg: 'DL 04 EF 9922', operator: 'Sharma Volvo Line', type: 'NON_AC_SEATER', seats: 44, layout: '2+2', status: 'MAINTENANCE', driver: 'Anil Verma', speed: 0, distanceLeft: 280, eta: '5h 15m' }
  ]);

  const [newBus, setNewBus] = useState({ reg: '', operator: 'Orbit Express Travels', type: 'VOLVO_LUXURY', seats: 40, layout: '2+2' });

  // Staff State
  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Ramesh Sharma', role: 'PRIMARY_DRIVER', license: 'DL-01-2018-9844', phone: '+91 98290 12345', onDuty: true, assignedBus: 'DL 01 PC 7710' },
    { id: 2, name: 'Vikram Shekhawat', role: 'PRIMARY_DRIVER', license: 'RJ-14-2016-1102', phone: '+91 94140 67890', onDuty: true, assignedBus: 'RJ 14 PA 3341' },
    { id: 3, name: 'Dinesh Kumar', role: 'CONDUCTOR', license: 'DL-04-2020-5521', phone: '+91 98110 55443', onDuty: false, assignedBus: 'None' }
  ]);
  const [newStaff, setNewStaff] = useState({ name: '', role: 'PRIMARY_DRIVER', license: '', phone: '' });

  // Route Waypoints State (NH-48)
  const [routeWaypoints, setRouteWaypoints] = useState([
    { id: 1, name: 'Kashmere Gate ISBT, Delhi', type: 'ORIGIN', km: 0, haltMins: 15 },
    { id: 2, name: 'Dhaula Kuan Metro, Delhi', type: 'BOARDING', km: 14, haltMins: 10 },
    { id: 3, name: 'Shahjahanpur Toll Plaza', type: 'TOLL_PLAZA', km: 92, haltMins: 0 },
    { id: 4, name: 'Highway Food Mall (Midway)', type: 'RESTAURANT_HALT', km: 140, haltMins: 15 },
    { id: 5, name: 'Kotputli Toll Plaza', type: 'TOLL_PLAZA', km: 232, haltMins: 0 },
    { id: 6, name: 'Sindhi Camp Central, Jaipur', type: 'DESTINATION', km: 280, haltMins: 0 }
  ]);
  const [newWaypoint, setNewWaypoint] = useState({ name: '', type: 'TOLL_PLAZA', km: 160, haltMins: 0 });

  // Mock Manifest Data
  const mockManifest = [
    { seat: '1A', name: 'Aarav Gupta', phone: '+91 98290 11200', boarding: 'Kashmere Gate ISBT' },
    { seat: '1B', name: 'Varun Sharma', phone: '+91 99881 22334', boarding: 'Kashmere Gate ISBT' },
    { seat: '2C', name: 'Priya Meena', phone: '+91 94140 55667', boarding: 'Dhaula Kuan Metro' },
    { seat: '3A', name: 'Devendra Singh', phone: '+91 98280 99881', boarding: 'Kashmere Gate ISBT' }
  ];

  const handleAddBus = (e) => {
    e.preventDefault();
    if (!newBus.reg) return;
    const item = {
      id: Date.now(),
      ...newBus,
      status: 'ACTIVE',
      driver: 'Unassigned',
      speed: 0,
      distanceLeft: 280,
      eta: '5h 00m'
    };
    setFleetList([item, ...fleetList]);
    setNewBus({ reg: '', operator: 'Orbit Express Travels', type: 'VOLVO_LUXURY', seats: 40, layout: '2+2' });
  };

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.license) return;
    setStaffList([...staffList, { id: Date.now(), ...newStaff, onDuty: true, assignedBus: 'None' }]);
    setNewStaff({ name: '', role: 'PRIMARY_DRIVER', license: '', phone: '' });
  };

  const handleAddWaypoint = (e) => {
    e.preventDefault();
    if (!newWaypoint.name) return;
    setRouteWaypoints([...routeWaypoints, { id: Date.now(), ...newWaypoint }]);
    setNewWaypoint({ name: '', type: 'TOLL_PLAZA', km: 160, haltMins: 0 });
  };

  return (
    <div className="box" style={{ padding: '1.5rem' }}>
      {/* Header & Sub-Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontFamily: 'Outfit, sans-serif' }}>
            Operator & Admin Fleet Control
          </h2>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Full Management Portals: Telemetry, Assets, Crew, Waypoints & Financial Analytics
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="segmented-control">
          <button className={`segmented-btn ${adminTab === 'telemetry' ? 'active' : ''}`} onClick={() => setAdminTab('telemetry')}>
            Live Telemetry
          </button>
          <button className={`segmented-btn ${adminTab === 'fleet' ? 'active' : ''}`} onClick={() => setAdminTab('fleet')}>
            Fleet Assets
          </button>
          <button className={`segmented-btn ${adminTab === 'staff' ? 'active' : ''}`} onClick={() => setAdminTab('staff')}>
            Staff & Crew
          </button>
          <button className={`segmented-btn ${adminTab === 'routes' ? 'active' : ''}`} onClick={() => setAdminTab('routes')}>
            Waypoints
          </button>
          <button className={`segmented-btn ${adminTab === 'analytics' ? 'active' : ''}`} onClick={() => setAdminTab('analytics')}>
            Analytics
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 1. Live Telemetry Monitor                                      */}
      {/* ============================================================= */}
      {adminTab === 'telemetry' && (
        <div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Bus & Reg</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Driver</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Speed</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Distance Left</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>ETA</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {fleetList.map((bus) => (
                  <tr key={bus.id} style={{ borderBottom: '1px solid var(--line-subtle)' }}>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ fontWeight: 700 }}>{bus.operator}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--muted)' }}>{bus.reg}</div>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>{bus.driver}</td>
                    <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{bus.speed} km/h</td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>{bus.distanceLeft} km</td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--route)', fontWeight: 700 }}>{bus.eta}</td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span className={`badge ${bus.status === 'ACTIVE' ? 'badge-route' : 'badge-amber'}`}>{bus.status}</span>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <button className="btn" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }} onClick={() => setSelectedBusForManifest(bus)}>
                        Manifest
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
      {/* 2. Fleet Asset Management CRUD                                 */}
      {/* ============================================================= */}
      {adminTab === 'fleet' && (
        <div>
          <form onSubmit={handleAddBus} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) auto', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem', background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>Registration No.</label>
              <input type="text" placeholder="e.g. DL 01 AB 9988" value={newBus.reg} onChange={e => setNewBus({ ...newBus, reg: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>Coach Type</label>
              <select value={newBus.type} onChange={e => setNewBus({ ...newBus, type: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}>
                <option value="VOLVO_LUXURY">Volvo Luxury (2+2)</option>
                <option value="AC_SLEEPER">AC Sleeper (2+1)</option>
                <option value="NON_AC_SEATER">Non-AC Seater</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>Seats Count</label>
              <input type="number" value={newBus.seats} onChange={e => setNewBus({ ...newBus, seats: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>+ Register Bus</button>
          </form>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>
                <th style={{ padding: '0.6rem 0.5rem' }}>Registration</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Operator</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Type</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Seats</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {fleetList.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--line-subtle)' }}>
                  <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{b.reg}</td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>{b.operator}</td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>{b.type}</td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>{b.seats}</td>
                  <td style={{ padding: '0.65rem 0.5rem' }}><span className={`badge ${b.status === 'ACTIVE' ? 'badge-route' : 'badge-amber'}`}>{b.status}</span></td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>
                    <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setFleetList(fleetList.map(x => x.id === b.id ? { ...x, status: x.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE' } : x))}>
                      Toggle Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================= */}
      {/* 3. Staff & Crew Management CRUD                                */}
      {/* ============================================================= */}
      {adminTab === 'staff' && (
        <div>
          <form onSubmit={handleAddStaff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) auto', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem', background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>Staff Name</label>
              <input type="text" placeholder="Full name" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>Role</label>
              <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}>
                <option value="PRIMARY_DRIVER">Primary Driver</option>
                <option value="CO_DRIVER">Co-Driver</option>
                <option value="CONDUCTOR">Conductor</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>License No.</label>
              <input type="text" placeholder="DL number" value={newStaff.license} onChange={e => setNewStaff({ ...newStaff, license: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>+ Add Crew Member</button>
          </form>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>
                <th style={{ padding: '0.6rem 0.5rem' }}>Name</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Role</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>License</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Duty Status</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Assigned Bus</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--line-subtle)' }}>
                  <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>{s.name}</td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>{s.role}</td>
                  <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>{s.license}</td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>
                    <span className={`badge ${s.onDuty ? 'badge-route' : 'badge-neutral'}`}>{s.onDuty ? 'On Duty' : 'Off Duty'}</span>
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>{s.assignedBus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================= */}
      {/* 4. Route & Waypoints Management CRUD                           */}
      {/* ============================================================= */}
      {adminTab === 'routes' && (
        <div>
          <form onSubmit={handleAddWaypoint} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr)) auto', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.5rem', background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>Waypoint / Stop Name</label>
              <input type="text" placeholder="e.g. Behror Toll Barrier" value={newWaypoint.name} onChange={e => setNewWaypoint({ ...newWaypoint, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>Stop Type</label>
              <select value={newWaypoint.type} onChange={e => setNewWaypoint({ ...newWaypoint, type: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }}>
                <option value="TOLL_PLAZA">Toll Plaza (FASTag)</option>
                <option value="RESTAURANT_HALT">Restaurant Halt</option>
                <option value="BOARDING">Boarding Point</option>
                <option value="DROPPING">Dropping Point</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)' }}>Distance Marker (KM)</label>
              <input type="number" value={newWaypoint.km} onChange={e => setNewWaypoint({ ...newWaypoint, km: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--panel)' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>+ Insert Waypoint</button>
          </form>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>
                <th style={{ padding: '0.6rem 0.5rem' }}>Waypoint Stop</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Category</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Corridor KM</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Halt Duration</th>
              </tr>
            </thead>
            <tbody>
              {routeWaypoints.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid var(--line-subtle)' }}>
                  <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700 }}>{w.name}</td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>
                    <span className={`badge ${w.type === 'TOLL_PLAZA' ? 'badge-toll' : w.type === 'RESTAURANT_HALT' ? 'badge-amber' : 'badge-route'}`}>
                      {w.type}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>KM {w.km}</td>
                  <td style={{ padding: '0.65rem 0.5rem' }}>{w.haltMins > 0 ? `${w.haltMins} mins` : 'Non-stop'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================= */}
      {/* 5. Financial & Occupancy Analytics                             */}
      {/* ============================================================= */}
      {adminTab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Daily Gross Revenue</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--route)', fontFamily: 'Outfit, sans-serif' }}>₹1,24,890</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>+18.4% vs last week</div>
            </div>
            <div style={{ background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Corridor Occupancy</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ink)', fontFamily: 'Outfit, sans-serif' }}>84.2%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Peak load on 06:00 & 21:30 slots</div>
            </div>
            <div style={{ background: 'var(--soft)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line-subtle)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Telemetry Pings</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--amber)', fontFamily: 'Outfit, sans-serif' }}>4,120</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Zero telemetry dropouts recorded</div>
            </div>
          </div>
        </div>
      )}

      {/* Manifest Modal */}
      {selectedBusForManifest && (
        <div className="modal-backdrop" onClick={() => setSelectedBusForManifest(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Outfit, sans-serif' }}>
                Manifest · {selectedBusForManifest.operator} ({selectedBusForManifest.reg})
              </h3>
              <button className="btn" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setSelectedBusForManifest(null)}>✕</button>
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {mockManifest.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--line-subtle)', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, marginRight: '0.5rem', color: 'var(--route)' }}>Seat {m.seat}</span>
                    <span>{m.name}</span>
                  </div>
                  <span style={{ color: 'var(--muted)' }}>{m.boarding}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
