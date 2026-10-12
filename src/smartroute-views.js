// SmartRoute - HTML Template Renderers

function renderShell(contentHtml) {
  const cur = state.currentRoute;
  const isBook = cur === "#/" || cur === "#/seats" || cur === "#/passengers" || cur === "#/pay" || cur.startsWith("#/ticket");
  const isTrips = cur === "#/trips";
  const isAssistant = cur === "#/assistant";
  const isTrack = cur.startsWith("#/track");
  const isAdmin = cur === "#/admin";

  return `
    <div class="toast-stack" id="toastStack"></div>
    <header class="sticky-nav">
      <div class="nav-inner">
        <a href="#/" class="brand" aria-label="SmartRoute Home">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" style="flex-shrink:0;">
            <rect x="2" y="6" width="28" height="18" rx="4" fill="var(--amber)" stroke="var(--ink)" stroke-width="2"/>
            <rect x="6" y="9" width="6" height="5" rx="1" fill="#fff" stroke="var(--ink)" stroke-width="1.5"/>
            <rect x="14" y="9" width="6" height="5" rx="1" fill="#fff" stroke="var(--ink)" stroke-width="1.5"/>
            <rect x="22" y="9" width="4" height="10" rx="1" fill="#fff" stroke="var(--ink)" stroke-width="1.5"/>
            <circle cx="8" cy="24" r="3" fill="var(--ink)"/>
            <circle cx="24" cy="24" r="3" fill="var(--ink)"/>
          </svg>
          <span>SmartRoute</span>
        </a>
        <nav class="nav-links">
          <a href="#/" class="nav-link" ${isBook ? 'aria-current="page"' : ''}>Book</a>
          <a href="#/trips" class="nav-link" ${isTrips ? 'aria-current="page"' : ''}>My trips</a>
          <a href="#/assistant" class="nav-link" ${isAssistant ? 'aria-current="page"' : ''} style="color:var(--route); font-weight:800;">AI Assistant ✨</a>
          <a href="#/track/${state.currentTrackedBusId || 101}" class="nav-link" ${isTrack ? 'aria-current="page"' : ''}>Live tracking</a>
          <a href="#/admin" class="nav-link" ${isAdmin ? 'aria-current="page"' : ''}>Operator portal</a>
          <div style="position:relative;">
            <button class="bell-btn" id="bellBtn" onclick="toggleNotifications()" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              ${tracker.unreadNotifs > 0 ? `<span class="bell-badge" id="bellBadge">${tracker.unreadNotifs}</span>` : '<span class="bell-badge" id="bellBadge" style="display:none;">0</span>'}
            </button>
            <div class="notif-dropdown" id="notifDropdown">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--ink); padding-bottom:0.5rem; margin-bottom:0.5rem;">
                <span style="font-weight:900;">Notifications</span>
                <span style="font-size:0.75rem; color:var(--muted);">${tracker.notifications.length} recent</span>
              </div>
              <div id="notifList" style="max-height:300px; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem;">
                ${tracker.notifications.length === 0 ? '<div style="padding:1rem; text-align:center; color:var(--muted); font-size:0.85rem;">No notifications yet.</div>' : tracker.notifications.map(n => `
                  <div style="padding:0.4rem; border-bottom:1px solid var(--line); font-size:0.85rem;">
                    <div style="display:flex; justify-content:space-between; font-weight:800;">
                      <span>${n.title}</span>
                      <span style="font-size:0.75rem; color:var(--muted);">${n.time}</span>
                    </div>
                    <div style="color:var(--muted); font-size:0.8rem; margin-top:2px;">${n.body}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          ${window.firebaseAuth && window.firebaseAuth.currentUser ? `
            <div style="display:flex; align-items:center; gap:0.4rem; padding:0.25rem 0.5rem; border:2px solid var(--ink); border-radius:6px; background:var(--panel);">
              ${window.firebaseAuth.currentUser.photoURL ? `<img src="${window.firebaseAuth.currentUser.photoURL}" style="width:20px; height:20px; border-radius:50%;" alt="User">` : ''}
              <span style="font-weight:800; font-size:0.8rem;">${(window.firebaseAuth.currentUser.displayName || 'Traveler').split(' ')[0]}</span>
              <button class="btn" style="padding:0.15rem 0.35rem; font-size:0.7rem;" onclick="handleGoogleSignOut()">Out</button>
            </div>
          ` : `
            <button class="btn btn-primary" style="padding:0.35rem 0.65rem; font-size:0.8rem; display:flex; align-items:center; gap:0.35rem;" onclick="handleGoogleSignIn()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in</span>
            </button>
          `}
        </nav>
      </div>
    </header>

    <main class="container">
      ${contentHtml}
    </main>

    <footer>
      <div style="max-width:1120px; margin:0 auto; display:flex; flex-direction:column; gap:0.75rem;">
        <p style="margin:0; font-weight:700; color:var(--ink);">SmartRoute, a Project-Based Learning demo. Buses, bookings, payments and GPS on this page are simulated in your browser.</p>
        <p style="margin:0;">Department of Computer Science & Engineering, Graphic Era (Deemed to be University), Dehradun.</p>
      </div>
    </footer>
  `;
}

function renderProgressSteps(activeStep) {
  // Steps: 1: Search, 2: Seats, 3: Passengers, 4: Payment, 5: Ticket
  const steps = [
    { num: 1, label: "Search" },
    { num: 2, label: "Seats" },
    { num: 3, label: "Passengers" },
    { num: 4, label: "Payment" },
    { num: 5, label: "Ticket" }
  ];

  return `
    <div class="steps-row" role="navigation" aria-label="Booking steps">
      ${steps.map((s, idx) => {
        const isDone = s.num < activeStep;
        const isCurrent = s.num === activeStep;
        return `
          <div class="step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
            <div class="step-dot">${isDone ? '✓' : s.num}</div>
            <span>${s.label}</span>
          </div>
          ${idx < steps.length - 1 ? '<div class="step-line"></div>' : ''}
        `;
      }).join('')}
    </div>
  `;
}

// 1. Home / Search Page
function renderHomeView() {
  const isDelhiToJaipur = state.search.from.toLowerCase() === "delhi" && state.search.to.toLowerCase() === "jaipur";

  // Filter buses
  let buses = BUSES.filter(b => {
    // Bus type: AC / Non-AC combine with OR, Sleeper / Seater combine with OR, two groups combine with AND
    const acMatch = (state.filters.ac && b.ac) || (state.filters.nonAc && !b.ac);
    const layoutMatch = (state.filters.sleeper && b.layout === "sleeper") || (state.filters.seater && b.layout === "seater");
    if (!acMatch || !layoutMatch) return false;

    // Price
    if (b.fare > state.filters.maxPrice) return false;

    // Rating
    if (state.filters.minRating > 0 && b.rating < state.filters.minRating) return false;

    // Amenities (all ticked amenities must exist)
    for (const am of state.filters.amenities) {
      if (!b.amenities.includes(am)) return false;
    }

    // Departure buckets
    const hour = parseInt(b.dep.split(":")[0], 10);
    const bucket = hour < 6 ? "before6" : (hour < 12 ? "6to12" : (hour < 18 ? "12to18" : "after18"));
    if (!state.filters.depBuckets.includes(bucket)) return false;

    return true;
  });

  // Sort
  if (state.sortBy === "cheapest") buses.sort((a, b) => a.fare - b.fare);
  else if (state.sortBy === "earliest") buses.sort((a, b) => a.dep.localeCompare(b.dep));
  else if (state.sortBy === "rating") buses.sort((a, b) => b.rating - a.rating);

  return `
    <section style="margin-bottom:2.25rem;">
      <h1 class="display-title">Book the bus. Watch it arrive.</h1>
      <p style="font-size:1.1rem; color:var(--muted); max-width:620px; line-height:1.6; margin-bottom:1.5rem;">
        Select your seats, pay seamlessly, and track your vehicle live on NH-48 with waypoint telemetry, automated toll updates, and AI travel guidance.
      </p>

      <form class="box" onsubmit="handleSearchSubmit(event)" style="padding:1.5rem; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)) auto; gap:1rem; align-items:flex-end;">
        <div>
          <label style="display:block; font-weight:700; font-size:0.82rem; color:var(--muted); margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.04em;">From</label>
          <input list="cities" value="${state.search.from}" id="searchFrom" style="width:100%; padding:0.65rem 0.85rem; border:1.5px solid var(--line); border-radius:var(--radius-sm); font-weight:600; background:var(--panel);" required>
          <datalist id="cities">
            <option value="Delhi">
            <option value="Jaipur">
            <option value="Agra">
            <option value="Chandigarh">
          </datalist>
        </div>
        <div>
          <label style="display:block; font-weight:700; font-size:0.82rem; color:var(--muted); margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.04em;">To</label>
          <input list="cities" value="${state.search.to}" id="searchTo" style="width:100%; padding:0.65rem 0.85rem; border:1.5px solid var(--line); border-radius:var(--radius-sm); font-weight:600; background:var(--panel);" required>
        </div>
        <div>
          <label style="display:block; font-weight:700; font-size:0.82rem; color:var(--muted); margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.04em;">Journey date</label>
          <input type="date" value="${state.search.date}" min="${new Date().toISOString().split('T')[0]}" id="searchDate" style="width:100%; padding:0.65rem 0.85rem; border:1.5px solid var(--line); border-radius:var(--radius-sm); font-weight:600; background:var(--panel);" required>
        </div>
        <div>
          <label style="display:block; font-weight:700; font-size:0.82rem; color:var(--muted); margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.04em;">Bus type</label>
          <select id="searchType" style="width:100%; padding:0.65rem 0.85rem; border:1.5px solid var(--line); border-radius:var(--radius-sm); font-weight:600; background:var(--panel);">
            <option value="all" ${state.search.busType === 'all' ? 'selected' : ''}>All types</option>
            <option value="ac" ${state.search.busType === 'ac' ? 'selected' : ''}>AC Coaches</option>
            <option value="non-ac" ${state.search.busType === 'non-ac' ? 'selected' : ''}>Non-AC</option>
            <option value="sleeper" ${state.search.busType === 'sleeper' ? 'selected' : ''}>Sleeper</option>
            <option value="seater" ${state.search.busType === 'seater' ? 'selected' : ''}>Seater</option>
          </select>
        </div>
        <div>
          <button type="submit" class="btn btn-primary" style="height:44px; width:100%; padding:0.65rem 1.4rem;">Search buses</button>
        </div>
      </form>
    </section>

    ${!state.search.hasSearched ? `
      <section style="margin-top:3rem;">
        <h2 style="font-size:1.45rem; margin-bottom:1.25rem;">01. Corridor Journey Intelligence</h2>
        <div>
          <div class="ruled-row" style="display:flex; gap:1.75rem; align-items:flex-start;">
            <span style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--route); min-width:32px;">01</span>
            <div>
              <div style="font-weight:700; font-size:1rem; margin-bottom:0.25rem;">Live Departure Confirmation</div>
              <div style="color:var(--muted); font-size:0.9rem; line-height:1.5;">Automated telemetry trigger when the bus pulls out from Delhi Kashmere Gate or Dhaula Kuan with accurate ETA dampening.</div>
            </div>
          </div>
          <div class="ruled-row" style="display:flex; gap:1.75rem; align-items:flex-start;">
            <span style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--toll); min-width:32px;">02</span>
            <div>
              <div style="font-weight:700; font-size:1rem; margin-bottom:0.25rem;">Highway Toll Plaza Proximity</div>
              <div style="color:var(--muted); font-size:0.9rem; line-height:1.5;">Advance notification 25 minutes prior to passing Shahjahanpur (KM 118) and Kotputli (KM 158) with FASTag lane clearance alerts.</div>
            </div>
          </div>
          <div class="ruled-row" style="display:flex; gap:1.75rem; align-items:flex-start;">
            <span style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--amber); min-width:32px;">03</span>
            <div>
              <div style="font-weight:700; font-size:1rem; margin-bottom:0.25rem;">Midpoint Food Halt (Highway Food Mall)</div>
              <div style="color:var(--muted); font-size:0.9rem; line-height:1.5;">Scheduled 15-minute rest stop reminder at KM 126 with clean washrooms, hygienic dining options, and departure countdown.</div>
            </div>
          </div>
          <div class="ruled-row" style="display:flex; gap:1.75rem; align-items:flex-start;">
            <span style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--route); min-width:32px;">04</span>
            <div>
              <div style="font-weight:700; font-size:1rem; margin-bottom:0.25rem;">Terminal Arrival & Transit Connection</div>
              <div style="color:var(--muted); font-size:0.9rem; line-height:1.5;">Arrival alert upon reaching Sindhi Camp Bus Stand, Jaipur, with immediate walking connectivity to Jaipur Metro (Pink Line).</div>
            </div>
          </div>
        </div>
      </section>
    ` : ''}

    ${state.search.hasSearched && !isDelhiToJaipur ? `
      <div class="box" style="text-align:center; padding:3rem 1.5rem; margin-top:2rem;">
        <h3 style="font-size:1.4rem;">No buses from ${state.search.from} to ${state.search.to} yet</h3>
        <p style="color:var(--muted);">SmartRoute runs Delhi to Jaipur in this demo.</p>
        <button class="btn btn-primary" onclick="setDelhiToJaipurSearch()">Search Delhi to Jaipur</button>
      </div>
    ` : ''}

    ${state.search.hasSearched && isDelhiToJaipur ? `
      <div style="display:grid; grid-template-columns:250px 1fr; gap:2rem; margin-top:2rem; align-items:flex-start;">
        <!-- Filters Sidebar -->
        <aside class="box" style="padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:2px solid var(--ink); padding-bottom:0.5rem;">
            <span style="font-weight:900; font-size:1.1rem;">Filters</span>
            <button class="btn" style="padding:0.2rem 0.5rem; font-size:0.8rem;" onclick="clearFilters()">Clear</button>
          </div>

          <div style="margin-bottom:1.25rem;">
            <div style="font-weight:800; font-size:0.88rem; margin-bottom:0.5rem;">Bus Type</div>
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; margin-bottom:0.35rem; cursor:pointer;">
              <input type="checkbox" ${state.filters.ac ? 'checked' : ''} onchange="updateFilter('ac', this.checked)"> AC
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; margin-bottom:0.35rem; cursor:pointer;">
              <input type="checkbox" ${state.filters.nonAc ? 'checked' : ''} onchange="updateFilter('nonAc', this.checked)"> Non-AC
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; margin-bottom:0.35rem; cursor:pointer;">
              <input type="checkbox" ${state.filters.sleeper ? 'checked' : ''} onchange="updateFilter('sleeper', this.checked)"> Sleeper
            </label>
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; cursor:pointer;">
              <input type="checkbox" ${state.filters.seater ? 'checked' : ''} onchange="updateFilter('seater', this.checked)"> Seater
            </label>
          </div>

          <div style="margin-bottom:1.25rem;">
            <div style="font-weight:800; font-size:0.88rem; margin-bottom:0.5rem;">Max Price: ₹${state.filters.maxPrice}</div>
            <input type="range" min="300" max="1200" step="50" value="${state.filters.maxPrice}" oninput="updateFilter('maxPrice', Number(this.value))" style="width:100%;">
          </div>

          <div style="margin-bottom:1.25rem;">
            <div style="font-weight:800; font-size:0.88rem; margin-bottom:0.5rem;">Departure Time</div>
            ${[
              { id: "before6", label: "Before 6 AM" },
              { id: "6to12", label: "6 AM to 12 PM" },
              { id: "12to18", label: "12 PM to 6 PM" },
              { id: "after18", label: "After 6 PM" }
            ].map(b => `
              <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; margin-bottom:0.35rem; cursor:pointer;">
                <input type="checkbox" ${state.filters.depBuckets.includes(b.id) ? 'checked' : ''} onchange="toggleDepBucket('${b.id}', this.checked)"> ${b.label}
              </label>
            `).join('')}
          </div>

          <div style="margin-bottom:1.25rem;">
            <div style="font-weight:800; font-size:0.88rem; margin-bottom:0.5rem;">Amenities</div>
            ${["Wi-Fi", "Charging point", "Water bottle", "Reading light", "Blanket"].map(am => `
              <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; margin-bottom:0.35rem; cursor:pointer;">
                <input type="checkbox" ${state.filters.amenities.includes(am) ? 'checked' : ''} onchange="toggleAmenity('${am}', this.checked)"> ${am}
              </label>
            `).join('')}
          </div>

          <div>
            <div style="font-weight:800; font-size:0.88rem; margin-bottom:0.5rem;">Rating</div>
            <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; cursor:pointer;">
              <input type="checkbox" ${state.filters.minRating === 4 ? 'checked' : ''} onchange="updateFilter('minRating', this.checked ? 4 : 0)"> 4★ and above
            </label>
          </div>
        </aside>

        <!-- Results List -->
        <div>
          <!-- AI Assistant Search Bar -->
          <div class="box" style="margin-bottom:1.25rem; background:var(--soft); border:2px solid var(--ink);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-weight:900; font-size:0.95rem; display:flex; align-items:center; gap:0.4rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
                AI Smart Bus Finder
              </span>
              <span class="chip chip-green" style="font-size:0.7rem; padding:0.1rem 0.4rem;">Gemini Powered</span>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <input type="text" id="aiSearchInput" placeholder="e.g. 'Luxury sleeper leaving after 8 PM with Wi-Fi' or 'Cheapest bus'" 
                style="flex:1; padding:0.5rem 0.75rem; border:2px solid var(--ink); border-radius:6px; font-weight:700; font-size:0.9rem;"
                onkeydown="if(event.key==='Enter'){event.preventDefault();handleAiSearch();}">
              <button class="btn btn-primary" style="padding:0.5rem 1rem;" onclick="handleAiSearch()">Ask AI</button>
            </div>
            ${state.aiRecommendation ? `
              <div style="margin-top:0.75rem; padding:0.6rem 0.75rem; background:var(--panel); border:2px solid var(--ink); border-radius:6px; font-size:0.85rem;">
                <div style="font-weight:900; color:var(--route); margin-bottom:0.25rem;">✨ SmartRoute AI Analysis:</div>
                <div style="color:var(--ink); line-height:1.4;">${state.aiRecommendation}</div>
              </div>
            ` : ''}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.75rem;">
            <h2 style="font-size:1.35rem; margin:0;">${buses.length} express buses <span style="font-size:0.95rem; color:var(--muted); font-weight:500;">(Delhi → Jaipur · ${state.search.date})</span></h2>
            <div class="segmented-control" role="radiogroup" aria-label="Sort buses">
              <button class="segmented-btn ${state.sortBy === 'cheapest' ? 'active' : ''}" onclick="setSort('cheapest')">Cheapest</button>
              <button class="segmented-btn ${state.sortBy === 'earliest' ? 'active' : ''}" onclick="setSort('earliest')">Earliest</button>
              <button class="segmented-btn ${state.sortBy === 'rating' ? 'active' : ''}" onclick="setSort('rating')">Top rated</button>
            </div>
          </div>

          <div aria-live="polite" style="display:flex; flex-direction:column; gap:1rem;">
            ${buses.length === 0 ? `
              <div class="box" style="text-align:center; padding:3rem 1.5rem;">
                <h3>No matching buses found</h3>
                <p style="color:var(--muted);">Try relaxing your filter criteria.</p>
                <button class="btn btn-primary" onclick="clearFilters()">Clear filters</button>
              </div>
            ` : buses.map(b => {
              // Calculate arrival = dep + 180 min
              const [dh, dm] = b.dep.split(":").map(Number);
              const arrMins = (dh * 60 + dm + 180) % (24 * 60);
              const ah = Math.floor(arrMins / 60);
              const am = arrMins % 60;
              const arrStr = `${ah < 10 ? '0' : ''}${ah}:${am < 10 ? '0' : ''}${am}`;

              // Estimate left seats
              const inv = generateSeatInventory(b.id, state.search.date);
              const leftSeats = Object.values(inv).filter(s => s.status === 'AVAILABLE').length;

              return `
                <div class="bus-card">
                  <div>
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
                      <span style="font-family:'Outfit', sans-serif; font-weight:700; font-size:1.2rem; color:var(--ink);">${b.operator}</span>
                      <span style="color:var(--muted); font-size:0.85rem;">${b.type}</span>
                      <span aria-hidden="true" style="color:var(--line);">·</span>
                      <span style="font-size:0.85rem; font-weight:700; color:var(--route);">${b.rating} ★ <span style="font-weight:400; color:var(--muted); font-size:0.75rem;">(${b.reviews})</span></span>
                      ${(state.aiMatchedBusIds && state.aiMatchedBusIds.includes(b.id)) ? `
                        <span class="badge badge-amber">AI Recommendation</span>
                      ` : ''}
                    </div>

                    <div style="display:flex; align-items:center; gap:1.5rem; margin:0.85rem 0;">
                      <div>
                        <div style="font-family:'JetBrains Mono', monospace; font-weight:700; font-size:1.25rem; color:var(--ink);">${b.dep}</div>
                        <div style="color:var(--muted); font-size:0.78rem;">Delhi</div>
                      </div>
                      <div style="display:flex; flex-direction:column; align-items:center; min-width:80px;">
                        <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">3h 00m</span>
                        <div style="width:100%; height:2px; background:var(--route); margin:3px 0; border-radius:2px;"></div>
                        <span style="font-size:0.7rem; color:var(--muted);">Non-stop Express</span>
                      </div>
                      <div>
                        <div style="font-family:'JetBrains Mono', monospace; font-weight:700; font-size:1.25rem; color:var(--ink);">${arrStr}</div>
                        <div style="color:var(--muted); font-size:0.78rem;">Jaipur</div>
                      </div>
                    </div>

                    <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap; font-size:0.8rem; color:var(--muted);">
                      ${b.amenities.map(am => am === 'Live tracking' ? `<span class="badge badge-route">● Live GPS</span>` : `<span>${am}</span>`).join('<span aria-hidden="true" style="color:var(--line);">·</span>')}
                    </div>
                  </div>

                  <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:0.35rem;">
                    <div>
                      <span style="font-size:0.8rem; color:var(--muted);">Fare </span>
                      <span style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.55rem; color:var(--ink);">₹${b.fare}</span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--route); font-weight:700;">${leftSeats} seats available</div>
                    <button class="btn btn-primary" style="margin-top:0.35rem;" onclick="selectBusForBooking(${b.id})">Select seats →</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

window.renderShell = renderShell;
window.renderProgressSteps = renderProgressSteps;
window.renderHomeView = renderHomeView;
