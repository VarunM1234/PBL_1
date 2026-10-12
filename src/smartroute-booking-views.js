// SmartRoute - Booking Flow Views (Seats, Passengers, Payment, Ticket, Trips)

function renderSeatsView() {
  const bus = state.selectedBus;
  if (!bus) return '';

  const inv = generateSeatInventory(bus.id, state.search.date);
  const seatsCount = state.selectedSeats.length;
  const fareCalc = calculateFare(seatsCount, bus.fare, false, null);

  // Remaining hold time
  let holdTimeStr = "";
  if (state.seatHoldExpiresAt) {
    const diffSec = Math.max(0, Math.floor((state.seatHoldExpiresAt - Date.now()) / 1000));
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    holdTimeStr = `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Boarding & dropping planned times
  const [dh, dm] = bus.dep.split(":").map(Number);
  const getStopPlannedTime = (stopF, haltMin) => {
    const mins = (dh * 60 + dm + Math.round((stopF * ROUTE_KM / CRUISE_SPEED) * 60) + haltMin) % 1440;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
  };

  return `
    ${renderProgressSteps(2)}

    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h2 style="margin:0; font-size:1.6rem;">${bus.operator}</h2>
        <div style="color:var(--muted); font-size:0.9rem;">${bus.type} · Registration: ${bus.reg}</div>
      </div>
      <a href="#/" class="btn" style="padding:0.4rem 0.8rem; font-size:0.85rem;">← Change bus</a>
    </div>

    <div style="display:grid; grid-template-columns:1fr 340px; gap:2rem; align-items:flex-start;">
      <!-- Seat Map Column -->
      <div class="box">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <span style="font-weight:700; font-size:0.95rem;">Select Seats (up to 6)</span>
          <div style="display:flex; gap:0.85rem; font-size:0.78rem; font-weight:600; color:var(--muted); flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:0.35rem;"><div style="width:12px; height:12px; border:1.5px solid var(--line); background:#fff; border-radius:2px;"></div> Available</div>
            <div style="display:flex; align-items:center; gap:0.35rem;"><div style="width:12px; height:12px; background:var(--route); border-radius:2px;"></div> Selected</div>
            <div style="display:flex; align-items:center; gap:0.35rem;"><div style="width:12px; height:12px; background:var(--amber-light); border:1px solid var(--amber); border-radius:2px;"></div> Held</div>
            <div style="display:flex; align-items:center; gap:0.35rem;"><div style="width:12px; height:12px; background:var(--line); border-radius:2px;"></div> Booked</div>
          </div>
        </div>

        ${bus.layout === 'sleeper' ? `
          <div style="margin-bottom:1rem;">
            <div class="segmented-control">
              <button class="segmented-btn ${state.activeDeck === 'LOWER' ? 'active' : ''}" onclick="setDeck('LOWER')">Lower Deck</button>
              <button class="segmented-btn ${state.activeDeck === 'UPPER' ? 'active' : ''}" onclick="setDeck('UPPER')">Upper Deck</button>
            </div>
          </div>
        ` : ''}

        <!-- Bus Frame -->
        <div style="max-width:320px; margin:0 auto; border:2px solid var(--ink); border-radius:24px 24px 10px 10px; padding:1.25rem 1rem; background:var(--soft);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px dashed var(--line); padding-bottom:0.75rem; margin-bottom:1rem;">
            <span style="font-size:0.8rem; font-weight:800; color:var(--muted);">Front · Driver</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20"/><path d="M12 12 2 12"/>
            </svg>
          </div>

          ${bus.layout === 'seater' ? `
            <div style="display:grid; grid-template-columns:44px 44px 28px 44px 44px; gap:8px 6px; justify-content:center;">
              ${Array.from({length: 10}).map((_, rowIdx) => {
                const r = rowIdx + 1;
                return `
                  ${renderSeatBtn(inv, `${r}A`, true)}
                  ${renderSeatBtn(inv, `${r}B`, false)}
                  <div style="font-size:0.7rem; display:flex; align-items:center; justify-content:center; color:var(--muted);">${r}</div>
                  ${renderSeatBtn(inv, `${r}C`, false)}
                  ${renderSeatBtn(inv, `${r}D`, true)}
                `;
              }).join('')}
            </div>
          ` : `
            <div style="display:grid; grid-template-columns:58px 24px 58px 58px; gap:10px 8px; justify-content:center;">
              ${Array.from({length: 6}).map((_, rIdx) => {
                const prefix = state.activeDeck === 'LOWER' ? 'L' : 'U';
                const s1 = `${prefix}${rIdx * 3 + 1}`;
                const s2 = `${prefix}${rIdx * 3 + 2}`;
                const s3 = `${prefix}${rIdx * 3 + 3}`;
                return `
                  ${renderBerthBtn(inv, s1, true)}
                  <div style="font-size:0.7rem; display:flex; align-items:center; justify-content:center; color:var(--muted);">${rIdx+1}</div>
                  ${renderBerthBtn(inv, s2, false)}
                  ${renderBerthBtn(inv, s3, true)}
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Right Summary & Boarding Column -->
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        <!-- Boarding Point -->
        <div class="box">
          <div style="font-weight:900; margin-bottom:0.75rem;">1. Boarding Point (Delhi)</div>
          ${[STOPS[0], STOPS[1]].map(st => `
            <label style="display:flex; gap:0.6rem; align-items:flex-start; margin-bottom:0.75rem; cursor:pointer;">
              <input type="radio" name="boarding" value="${st.id}" ${state.boardingStopId === st.id ? 'checked' : ''} onchange="setBoardingStop(${st.id})" style="margin-top:0.25rem;">
              <div>
                <div style="font-weight:800; font-size:0.9rem;">${st.name} <span style="color:var(--route);">(${getStopPlannedTime(st.f, 0)})</span></div>
                <div style="font-size:0.78rem; color:var(--muted);">${st.extra}</div>
              </div>
            </label>
          `).join('')}
        </div>

        <!-- Dropping Point -->
        <div class="box">
          <div style="font-weight:900; margin-bottom:0.75rem;">2. Dropping Point (Jaipur)</div>
          ${[STOPS[5], STOPS[6]].map(st => `
            <label style="display:flex; gap:0.6rem; align-items:flex-start; margin-bottom:0.75rem; cursor:pointer;">
              <input type="radio" name="dropping" value="${st.id}" ${state.droppingStopId === st.id ? 'checked' : ''} onchange="setDroppingStop(${st.id})" style="margin-top:0.25rem;">
              <div>
                <div style="font-weight:800; font-size:0.9rem;">${st.name} <span style="color:var(--route);">(${getStopPlannedTime(st.f, 15)})</span></div>
                <div style="font-size:0.78rem; color:var(--muted);">${st.extra}</div>
              </div>
            </label>
          `).join('')}
        </div>

        <!-- Fare Summary Box -->
        <div class="box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <span style="font-weight:900;">Booking Summary</span>
            ${state.seatHoldExpiresAt ? `<span class="chip chip-amber" style="font-size:0.75rem;">Hold: ${holdTimeStr}</span>` : ''}
          </div>

          <div style="font-size:0.9rem; margin-bottom:0.5rem;">
            Seats: ${state.selectedSeats.length > 0 ? state.selectedSeats.join(', ') : '<span style="color:var(--muted);">None selected</span>'}
          </div>

          <div style="border-top:1px solid var(--line); padding-top:0.5rem; margin-top:0.5rem; font-size:0.88rem; display:flex; flex-direction:column; gap:0.35rem;">
            <div style="display:flex; justify-content:space-between;">
              <span>Base Fare (${seatsCount} × ₹${bus.fare})</span>
              <span>₹${fareCalc.base}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Service Fee (2%)</span>
              <span>₹${fareCalc.service}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Taxes (5%)</span>
              <span>₹${fareCalc.tax}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:900; font-size:1.1rem; border-top:2px solid var(--ink); padding-top:0.5rem; margin-top:0.25rem;">
              <span>Total</span>
              <span>₹${fareCalc.total}</span>
            </div>
          </div>

          <button class="btn btn-primary" style="width:100%; margin-top:1rem;" ${seatsCount === 0 ? 'disabled' : ''} onclick="proceedToPassengers()">
            Proceed to passenger details (${seatsCount} seat${seatsCount > 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSeatBtn(inv, seatId, isWindow) {
  const seat = inv[seatId] || { status: "AVAILABLE" };
  const isSelected = state.selectedSeats.includes(seatId);
  const status = isSelected ? "SELECTED" : seat.status;
  const isHeld = status === "LOCKED";
  const isBooked = status === "BOOKED";

  const ariaLabel = `Seat ${seatId}, ${isWindow ? 'window, ' : ''}${status.toLowerCase()}`;
  return `
    <button type="button"
      class="seat-btn ${isWindow ? 'window' : ''} ${isSelected ? 'selected' : ''} ${isHeld ? 'locked' : ''} ${isBooked ? 'booked' : ''}"
      ${isHeld || isBooked ? 'disabled' : ''}
      aria-label="${ariaLabel}"
      aria-pressed="${isSelected}"
      onclick="handleSeatClick('${seatId}')">
      ${seatId}
    </button>
  `;
}

function renderBerthBtn(inv, berthId, isWindow) {
  const seat = inv[berthId] || { status: "AVAILABLE" };
  const isSelected = state.selectedSeats.includes(berthId);
  const status = isSelected ? "SELECTED" : seat.status;
  const isHeld = status === "LOCKED";
  const isBooked = status === "BOOKED";

  const ariaLabel = `Berth ${berthId}, ${isWindow ? 'window, ' : ''}${status.toLowerCase()}`;
  return `
    <button type="button"
      class="seat-btn berth-btn ${isWindow ? 'window' : ''} ${isSelected ? 'selected' : ''} ${isHeld ? 'locked' : ''} ${isBooked ? 'booked' : ''}"
      ${isHeld || isBooked ? 'disabled' : ''}
      aria-label="${ariaLabel}"
      aria-pressed="${isSelected}"
      onclick="handleSeatClick('${berthId}')">
      ${berthId}
    </button>
  `;
}

// 3. Passengers Info View
function renderPassengersView() {
  const bus = state.selectedBus;
  if (!bus) return '';

  const fareCalc = calculateFare(state.selectedSeats.length, bus.fare, state.hasInsurance, state.couponCode);

  return `
    ${renderProgressSteps(3)}

    <div style="display:grid; grid-template-columns:1fr 340px; gap:2rem; align-items:flex-start;">
      <!-- Passenger Form -->
      <div>
        <h2 style="font-size:1.4rem; margin-bottom:1rem;">Passenger Information</h2>
        <div class="box" style="margin-bottom:1.5rem;">
          ${state.selectedSeats.map((seatId, idx) => {
            const p = state.passengers[idx] || { name: "", age: "", gender: "Male" };
            return `
              <div style="border-bottom: ${idx < state.selectedSeats.length - 1 ? '2px solid var(--line)' : 'none'}; padding-bottom:1rem; margin-bottom:1rem;">
                <div style="font-weight:900; margin-bottom:0.75rem; color:var(--route);">
                  Seat ${seatId} Passenger
                </div>
                <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:0.75rem;">
                  <div>
                    <label style="display:block; font-size:0.8rem; font-weight:800; margin-bottom:0.25rem;">Full Name</label>
                    <input type="text" value="${p.name}" placeholder="e.g. Rahul Sharma" oninput="updatePassenger(${idx}, 'name', this.value)" style="width:100%; padding:0.5rem; border:2px solid var(--ink); border-radius:6px;" required>
                    ${state.contactErrors[`p_${idx}_name`] ? `<div style="color:var(--toll); font-size:0.75rem; font-weight:700;">${state.contactErrors[`p_${idx}_name`]}</div>` : ''}
                  </div>
                  <div>
                    <label style="display:block; font-size:0.8rem; font-weight:800; margin-bottom:0.25rem;">Age (1-99)</label>
                    <input type="number" min="1" max="99" value="${p.age}" placeholder="28" oninput="updatePassenger(${idx}, 'age', this.value)" style="width:100%; padding:0.5rem; border:2px solid var(--ink); border-radius:6px;" required>
                    ${state.contactErrors[`p_${idx}_age`] ? `<div style="color:var(--toll); font-size:0.75rem; font-weight:700;">${state.contactErrors[`p_${idx}_age`]}</div>` : ''}
                  </div>
                  <div>
                    <label style="display:block; font-size:0.8rem; font-weight:800; margin-bottom:0.25rem;">Gender</label>
                    <select onchange="updatePassenger(${idx}, 'gender', this.value)" style="width:100%; padding:0.5rem; border:2px solid var(--ink); border-radius:6px;">
                      <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>Male</option>
                      <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>Female</option>
                      <option value="Other" ${p.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <h2 style="font-size:1.4rem; margin-bottom:1rem;">Contact Information</h2>
        <div class="box">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:800; margin-bottom:0.25rem;">Mobile Phone (10-digit)</label>
              <input type="tel" value="${state.contact.phone}" placeholder="9876543210" oninput="updateContact('phone', this.value)" style="width:100%; padding:0.5rem; border:2px solid var(--ink); border-radius:6px;" required>
              ${state.contactErrors.phone ? `<div style="color:var(--toll); font-size:0.75rem; font-weight:700;">${state.contactErrors.phone}</div>` : ''}
            </div>
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:800; margin-bottom:0.25rem;">Email Address</label>
              <input type="email" value="${state.contact.email}" placeholder="traveler@example.com" oninput="updateContact('email', this.value)" style="width:100%; padding:0.5rem; border:2px solid var(--ink); border-radius:6px;" required>
              ${state.contactErrors.email ? `<div style="color:var(--toll); font-size:0.75rem; font-weight:700;">${state.contactErrors.email}</div>` : ''}
            </div>
          </div>
          <div style="font-size:0.8rem; color:var(--muted); margin-top:0.75rem;">
            Details stay in this browser. Nothing is sent anywhere.
          </div>
        </div>
      </div>

      <!-- Right Fare Box with Coupon & Insurance -->
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        <div class="box">
          <div style="font-weight:900; margin-bottom:0.75rem;">Trip Summary</div>
          <div style="font-weight:800;">${bus.operator}</div>
          <div style="font-size:0.85rem; color:var(--muted);">${state.search.date} · Departs ${bus.dep}</div>
          <div style="font-size:0.85rem; margin-top:0.5rem;">
            <strong>Seats:</strong> ${state.selectedSeats.join(', ')}
          </div>
        </div>

        <div class="box">
          <div style="font-weight:900; margin-bottom:0.75rem;">Travel Insurance</div>
          <label style="display:flex; gap:0.5rem; align-items:flex-start; font-size:0.85rem; cursor:pointer;">
            <input type="checkbox" ${state.hasInsurance ? 'checked' : ''} onchange="toggleInsurance(this.checked)" style="margin-top:0.2rem;">
            <div>
              <span style="font-weight:800;">Add Travel Insurance (₹15 per seat)</span>
              <div style="color:var(--muted); font-size:0.78rem;">Covers baggage loss and emergency transit delays.</div>
            </div>
          </label>
        </div>

        <div class="box">
          <div style="font-weight:900; margin-bottom:0.75rem;">Have a Coupon?</div>
          <div style="display:flex; gap:0.5rem;">
            <input type="text" id="couponInput" placeholder="e.g. SMART100" value="${state.couponCode}" style="flex:1; padding:0.4rem 0.6rem; border:2px solid var(--ink); border-radius:6px; font-weight:800; text-transform:uppercase;">
            <button class="btn btn-primary" onclick="applyCoupon()">Apply</button>
          </div>
          ${fareCalc.couponMessage ? `
            <div style="margin-top:0.5rem; font-size:0.82rem; font-weight:800; color:${fareCalc.couponValid ? 'var(--route)' : 'var(--toll)'};">
              ${fareCalc.couponMessage}
            </div>
          ` : ''}
          <div style="font-size:0.75rem; color:var(--muted); margin-top:0.5rem;">
            Try: <code>SMART100</code> (min ₹500) or <code>ROUTE10</code> (10% off)
          </div>
        </div>

        <div class="box">
          <div style="font-weight:900; margin-bottom:0.75rem;">Fare Breakdown</div>
          <div style="font-size:0.88rem; display:flex; flex-direction:column; gap:0.35rem;">
            <div style="display:flex; justify-content:space-between;">
              <span>Base Fare (${state.selectedSeats.length} × ₹${bus.fare})</span>
              <span>₹${fareCalc.base}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Service Fee (2%)</span>
              <span>₹${fareCalc.service}</span>
            </div>
            ${state.hasInsurance ? `
              <div style="display:flex; justify-content:space-between;">
                <span>Insurance (₹15 × ${state.selectedSeats.length})</span>
                <span>₹${fareCalc.insurance}</span>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between;">
              <span>Taxes (5%)</span>
              <span>₹${fareCalc.tax}</span>
            </div>
            ${fareCalc.discount > 0 ? `
              <div style="display:flex; justify-content:space-between; color:var(--route); font-weight:800;">
                <span>Coupon Discount</span>
                <span>-₹${fareCalc.discount}</span>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; font-weight:900; font-size:1.15rem; border-top:2px solid var(--ink); padding-top:0.5rem; margin-top:0.25rem;">
              <span>Total Payable</span>
              <span>₹${fareCalc.total}</span>
            </div>
          </div>

          <button class="btn btn-primary" style="width:100%; margin-top:1rem;" onclick="validateAndGoToPayment()">
            Continue to payment
          </button>
        </div>
      </div>
    </div>
  `;
}

// 4. Payment View
function renderPaymentView() {
  const bus = state.selectedBus;
  if (!bus) return '';
  const fareCalc = calculateFare(state.selectedSeats.length, bus.fare, state.hasInsurance, state.couponCode);

  return `
    ${renderProgressSteps(4)}

    <div style="max-width:560px; margin:0 auto;">
      <h2 style="font-size:1.6rem; margin-bottom:1rem;">Complete Payment</h2>
      
      <div class="box" style="margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--ink); padding-bottom:0.75rem; margin-bottom:1rem;">
          <div>
            <div style="font-weight:900;">${bus.operator}</div>
            <div style="font-size:0.85rem; color:var(--muted);">${state.selectedSeats.length} seats: ${state.selectedSeats.join(', ')}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.8rem; color:var(--muted);">Amount</div>
            <div style="font-weight:900; font-size:1.4rem;">₹${fareCalc.total}</div>
          </div>
        </div>

        <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.75rem;">Select Payment Method</div>
        ${["UPI", "Card", "Net banking"].map(m => `
          <label style="display:flex; align-items:center; gap:0.6rem; padding:0.6rem; border:2px solid var(--ink); border-radius:6px; margin-bottom:0.5rem; cursor:pointer; font-weight:800;">
            <input type="radio" name="paymethod" value="${m}" ${state.paymentMethod === m ? 'checked' : ''} onchange="setPaymentMethod('${m}')">
            ${m}
          </label>
        `).join('')}

        <div style="font-size:0.8rem; color:var(--muted); margin-top:1rem;">
          Demo checkout. No real payment is made and no card or bank details are collected.
        </div>

        <label style="display:flex; align-items:center; gap:0.5rem; margin-top:1rem; font-size:0.85rem; cursor:pointer;">
          <input type="checkbox" ${state.simulatePaymentFail ? 'checked' : ''} onchange="toggleSimulateFail(this.checked)">
          <span>Simulate a failed payment</span>
        </label>

        <button class="btn btn-primary" style="width:100%; margin-top:1.5rem; height:48px;" onclick="processPayment()">
          Pay ₹${fareCalc.total}
        </button>
      </div>
    </div>

    <!-- Spinner Modal -->
    ${state.isPaying ? `
      <div class="modal-backdrop" role="dialog" aria-modal="true">
        <div class="modal-card" style="text-align:center;">
          <div style="width:40px; height:40px; border:4px solid var(--line); border-top-color:var(--route); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 1rem auto;"></div>
          <h3 style="margin-bottom:0.5rem;">Processing payment...</h3>
          <p style="color:var(--muted); font-size:0.88rem; margin:0;">Contacting simulated payment gateway. Please wait.</p>
        </div>
      </div>
      <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
    ` : ''}
  `;
}

// 5. Ticket View
function renderTicketView() {
  const ref = state.routeParam;
  const bookings = getSavedBookings();
  const booking = bookings.find(b => b.reference === ref);

  if (!booking) {
    return `
      <div class="box" style="text-align:center; padding:3rem 1.5rem;">
        <h3>Ticket not found</h3>
        <p style="color:var(--muted);">We could not find booking reference ${ref}.</p>
        <a href="#/trips" class="btn btn-primary">Go to My Trips</a>
      </div>
    `;
  }

  const bus = BUSES.find(b => b.id === booking.busId) || BUSES[0];

  return `
    ${renderProgressSteps(5)}

    <div style="max-width:680px; margin:0 auto;">
      <div class="box" style="padding:0; overflow:hidden;">
        <!-- Header -->
        <div style="background:var(--route); color:var(--on-route); padding:1.25rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <div style="font-size:0.8rem; font-weight:700; opacity:0.85;">BOOKING REFERENCE</div>
            <div style="font-weight:900; font-size:1.6rem; letter-spacing:0.04em;">${booking.reference}</div>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <span class="chip ${booking.status === 'CONFIRMED' ? 'chip-green' : (booking.status === 'REFUNDED' ? 'chip-soft' : 'chip-red')}" style="background:#fff; color:var(--ink); font-weight:900;">
              ${booking.status}
            </span>
            <span class="chip" style="background:var(--amber); color:#000; font-weight:900;">
              ${booking.paymentStatus}
            </span>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:1.5rem;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem;">
            <div>
              <div style="font-size:0.8rem; color:var(--muted); font-weight:700;">BUS OPERATOR</div>
              <div style="font-weight:900; font-size:1.1rem;">${booking.busName}</div>
              <div style="font-size:0.85rem; color:var(--muted);">${bus.type} · ${booking.reg}</div>
            </div>
            <div>
              <div style="font-size:0.8rem; color:var(--muted); font-weight:700;">JOURNEY DATE</div>
              <div style="font-weight:900; font-size:1.1rem;">${booking.date}</div>
              <div style="font-size:0.85rem; color:var(--muted);">Departure: ${bus.dep}</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem; background:var(--soft); padding:1rem; border-radius:6px; border:2px solid var(--line);">
            <div>
              <div style="font-size:0.75rem; color:var(--muted); font-weight:800;">BOARDING POINT</div>
              <div style="font-weight:800; font-size:0.95rem;">${booking.boardingStop}</div>
              <div style="font-size:0.8rem; color:var(--muted);">${booking.boardingAddress}</div>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--muted); font-weight:800;">DROPPING POINT</div>
              <div style="font-weight:800; font-size:0.95rem;">${booking.droppingStop}</div>
              <div style="font-size:0.8rem; color:var(--muted);">${booking.droppingAddress}</div>
            </div>
          </div>

          <!-- Passenger Table -->
          <div style="font-weight:900; margin-bottom:0.5rem;">Passenger List</div>
          <div style="overflow-x:auto; margin-bottom:1.5rem;">
            <table style="width:100%; border-collapse:collapse; font-size:0.88rem; text-align:left;">
              <thead>
                <tr style="border-bottom:2px solid var(--ink);">
                  <th style="padding:0.4rem 0;">Seat</th>
                  <th style="padding:0.4rem 0;">Name</th>
                  <th style="padding:0.4rem 0;">Age</th>
                  <th style="padding:0.4rem 0;">Gender</th>
                </tr>
              </thead>
              <tbody>
                ${booking.passengers.map(p => `
                  <tr style="border-bottom:1px solid var(--line);">
                    <td style="padding:0.5rem 0; font-weight:800; color:var(--route);">${p.seat}</td>
                    <td style="padding:0.5rem 0; font-weight:700;">${p.name}</td>
                    <td style="padding:0.5rem 0;">${p.age}</td>
                    <td style="padding:0.5rem 0;">${p.gender}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Fare summary & SVG ticket code -->
          <div style="display:grid; grid-template-columns:1fr auto; gap:1.5rem; align-items:center; border-top:2px solid var(--ink); padding-top:1.25rem;">
            <div>
              <div style="font-size:0.85rem; color:var(--muted);">Total Fare Paid</div>
              <div style="font-weight:900; font-size:1.5rem; color:var(--ink);">₹${booking.totalAmount}</div>
              ${booking.refundReference ? `<div style="font-size:0.8rem; color:var(--route); font-weight:800;">Refund Ref: ${booking.refundReference}</div>` : ''}
            </div>

            <div style="text-align:center;">
              ${renderTicketCodeSvg(booking.reference)}
              <div style="font-size:0.7rem; font-weight:800; color:var(--muted); margin-top:4px;">Show this at boarding</div>
            </div>
          </div>

          <!-- Action buttons -->
          <!-- Action buttons -->
          <div style="display:flex; gap:0.75rem; margin-top:1.5rem; flex-wrap:wrap;">
            ${bus.liveTracking && booking.status === 'CONFIRMED' ? `
              <a href="#/track/${bus.id}" class="btn btn-primary">Track this bus 🚌</a>
            ` : ''}
            <a href="#/trips" class="btn">My trips</a>
            ${booking.status === 'CONFIRMED' ? `
              <button class="btn btn-warn" onclick="openCancelModal('${booking.reference}')">Cancel booking</button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- AI Trip Assistant Component -->
      ${renderAiTripAssistant(booking)}
    </div>

    <!-- Cancellation Modal -->
    ${state.cancelModalBooking ? renderCancelModal(state.cancelModalBooking) : ''}
  `;
}

// AI Trip Assistant Component Renderer
function renderAiTripAssistant(booking) {
  const assistantData = booking.aiAssistant || state.cachedAiAssistant?.[booking.reference];
  const isLoading = state.loadingAiAssistantRef === booking.reference;

  return `
    <div class="box" style="margin-top:1.5rem; border:2px solid var(--ink); border-radius:8px; background:var(--panel);">
      <!-- Component Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--ink); padding-bottom:0.75rem; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
            </svg>
            <span style="font-weight:900; font-size:1.25rem;">AI Trip Assistant</span>
            <span class="chip chip-green" style="font-size:0.7rem; padding:0.1rem 0.45rem;">Gemini AI</span>
          </div>
          <div style="font-size:0.82rem; color:var(--muted); margin-top:2px;">
            Personalized itinerary analysis, destination forecast & packing recommendations
          </div>
        </div>
        <button class="btn btn-primary" style="padding:0.35rem 0.8rem; font-size:0.8rem;" onclick="fetchAiTripAssistant('${booking.reference}')" ${isLoading ? 'disabled' : ''}>
          ${isLoading ? 'Analyzing itinerary...' : 'Refresh AI Plan ✨'}
        </button>
      </div>

      ${isLoading ? `
        <div style="text-align:center; padding:2.5rem 1rem;">
          <div style="width:36px; height:36px; border:3px solid var(--line); border-top-color:var(--route); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 0.75rem auto;"></div>
          <div style="font-weight:800; font-size:0.95rem;">Gemini is analyzing your trip to Jaipur...</div>
          <div style="font-size:0.82rem; color:var(--muted); margin-top:0.25rem;">Synthesizing seasonal weather forecasts, packing recommendations & transit tips.</div>
        </div>
      ` : (assistantData ? `
        <!-- Assistant Content Grid -->
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <!-- 1. Destination Weather Forecast -->
          <div style="background:var(--soft); border:2px solid var(--line); border-radius:6px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
              <span style="font-weight:900; font-size:0.95rem;">🌤️ Destination Weather Forecast · Jaipur</span>
              <div style="display:flex; gap:0.4rem;">
                <span class="chip chip-amber" style="font-size:0.75rem;">${assistantData.weatherForecast.tempRange}</span>
                <span class="chip chip-green" style="font-size:0.75rem;">${assistantData.weatherForecast.conditions}</span>
              </div>
            </div>
            <p style="margin:0; font-size:0.88rem; color:var(--ink); line-height:1.45;">
              ${assistantData.weatherForecast.summary}
            </p>
          </div>

          <!-- 2. Smart Packing Suggestions -->
          <div>
            <div style="font-weight:900; font-size:0.95rem; margin-bottom:0.6rem; display:flex; align-items:center; gap:0.4rem;">
              <span>🧳 Smart Packing Suggestions</span>
              <span style="font-size:0.75rem; color:var(--muted); font-weight:600;">(for ${booking.date})</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:0.6rem;">
              ${assistantData.packingSuggestions.map((item, idx) => `
                <label style="display:flex; align-items:flex-start; gap:0.6rem; padding:0.55rem 0.75rem; background:var(--soft); border:1.5px solid var(--line); border-radius:6px; font-size:0.85rem; cursor:pointer;">
                  <input type="checkbox" style="margin-top:0.2rem;" id="pack_item_${idx}">
                  <span style="line-height:1.35;">${item}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- 3. Personalized Travel & Local Transit Tips -->
          <div>
            <div style="font-weight:900; font-size:0.95rem; margin-bottom:0.6rem;">
              🧭 Personalized Transit & Sightseeing Tips
            </div>
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${assistantData.personalizedTravelTips.map(tip => `
                <div style="display:flex; gap:0.6rem; align-items:flex-start; font-size:0.85rem; padding:0.5rem 0.75rem; border-left:3px solid var(--route); background:var(--soft); border-radius:0 6px 6px 0;">
                  <span style="color:var(--route); font-weight:900;">•</span>
                  <span style="line-height:1.4;">${tip}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 4. Google Maps Grounded Places & Transit -->
          <div style="background:var(--soft); border:2px solid var(--line); border-radius:6px; padding:0.85rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
              <span style="font-weight:900; font-size:0.92rem; display:flex; align-items:center; gap:0.35rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--toll)" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                Google Maps Grounded · Sindhi Camp Jaipur
              </span>
              <span class="chip chip-soft" style="font-size:0.7rem;">Verified Places</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.5rem;">
              <div style="background:var(--panel); padding:0.5rem 0.6rem; border-radius:4px; border:1px solid var(--line); font-size:0.8rem;">
                <div style="font-weight:800; color:var(--ink);">Jaipur Metro (Sindhi Camp)</div>
                <div style="color:var(--muted); font-size:0.75rem;">Direct rapid transit directly outside arrival gate.</div>
              </div>
              <div style="background:var(--panel); padding:0.5rem 0.6rem; border-radius:4px; border:1px solid var(--line); font-size:0.8rem;">
                <div style="font-weight:800; color:var(--ink);">Rawat Mishthan Bhandar</div>
                <div style="color:var(--muted); font-size:0.75rem;">Station Road (600m) · Legendary Pyaaz Kachori.</div>
              </div>
              <div style="background:var(--panel); padding:0.5rem 0.6rem; border-radius:4px; border:1px solid var(--line); font-size:0.8rem;">
                <div style="font-weight:800; color:var(--ink);">MI Road Heritage Corridor</div>
                <div style="color:var(--muted); font-size:0.75rem;">1.2 km · Lassiwala & handicraft emporiums.</div>
              </div>
            </div>
          </div>

          <!-- 5. Journey Preparation & Policies -->
          <div style="border-top:1px solid var(--line); padding-top:0.75rem; font-size:0.82rem; color:var(--muted);">
            <strong style="color:var(--ink);">Journey Preparation Reminders:</strong>
            <ul style="margin:0.35rem 0 0 1.2rem; padding:0;">
              ${assistantData.journeyPrep.map(prep => `
                <li style="margin-bottom:0.2rem;">${prep}</li>
              `).join('')}
            </ul>
          </div>
        </div>
      ` : `
        <div style="text-align:center; padding:2rem 1rem;">
          <p style="color:var(--muted); font-size:0.9rem; margin-bottom:1rem;">
            Get AI-generated Jaipur weather forecasts, custom packing lists for ${booking.date}, and transit survival tips for your trip.
          </p>
          <button class="btn btn-primary" onclick="fetchAiTripAssistant('${booking.reference}')">
            Generate AI Travel Plan ✨
          </button>
        </div>
      `)}
    </div>
  `;
}

// 17x17 deterministic ticket code SVG
function renderTicketCodeSvg(ref) {
  const prng = createSeededPRNG(ref);
  const size = 17;
  const blockSize = 6;
  let blocks = '';

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Corner finder squares
      const isTopLeft = r < 5 && c < 5;
      const isTopRight = r < 5 && c >= size - 5;
      const isBottomLeft = r >= size - 5 && c < 5;

      let isBlack = false;
      if (isTopLeft || isTopRight || isBottomLeft) {
        const localR = isBottomLeft ? r - (size - 5) : r;
        const localC = isTopRight ? c - (size - 5) : c;
        if (localR === 0 || localR === 4 || localC === 0 || localC === 4 || (localR === 2 && localC === 2)) {
          isBlack = true;
        }
      } else {
        isBlack = prng() > 0.45;
      }

      if (isBlack) {
        blocks += `<rect x="${c * blockSize}" y="${r * blockSize}" width="${blockSize}" height="${blockSize}" fill="var(--ink)" />`;
      }
    }
  }

  return `
    <svg width="${size * blockSize}" height="${size * blockSize}" viewBox="0 0 ${size * blockSize} ${size * blockSize}">
      <rect width="100%" height="100%" fill="#fff" />
      ${blocks}
    </svg>
  `;
}

function renderCancelModal(booking) {
  const [dh, dm] = booking.dep.split(":").map(Number);
  const depDate = new Date(`${booking.date}T${booking.dep}:00`);
  const now = new Date();
  const diffHours = (depDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundPct = 0;
  if (diffHours >= 12) refundPct = 0.90;
  else if (diffHours >= 6) refundPct = 0.50;
  else refundPct = 0.00;

  const refundAmt = Math.round(booking.totalAmount * refundPct);
  const cancelFee = booking.totalAmount - refundAmt;

  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal-card">
        <h3 style="margin-bottom:0.5rem;">Cancel Booking</h3>
        <p style="font-size:0.88rem; color:var(--muted); margin-bottom:1rem;">Reference: <strong>${booking.reference}</strong></p>

        <div style="background:var(--soft); padding:1rem; border-radius:6px; border:2px solid var(--line); margin-bottom:1rem; font-size:0.88rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
            <span>Hours until departure:</span>
            <span style="font-weight:800;">${diffHours > 0 ? diffHours.toFixed(1) + ' hrs' : 'Departed'}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
            <span>Amount paid:</span>
            <span>₹${booking.totalAmount}</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem; color:var(--toll);">
            <span>Cancellation fee:</span>
            <span>-₹${cancelFee}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:900; border-top:1px solid var(--line); padding-top:0.5rem; color:var(--route); font-size:1.05rem;">
            <span>Estimated refund:</span>
            <span>₹${refundAmt}</span>
          </div>
        </div>

        <div style="font-size:0.78rem; color:var(--muted); margin-bottom:1.25rem;">
          Cancellation Policy: 12+ hrs: 90% refund · 6-12 hrs: 50% refund · Under 6 hrs: 0% refund.
        </div>

        <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
          <button class="btn" onclick="closeCancelModal()">Keep booking</button>
          <button class="btn btn-warn" onclick="confirmCancelBooking('${booking.reference}')">Confirm cancellation</button>
        </div>
      </div>
    </div>
  `;
}

// 6. My Trips View
function renderTripsView() {
  const bookings = getSavedBookings();

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <h2 style="font-size:1.6rem; margin:0;">My Trips</h2>
      <a href="#/" class="btn btn-primary">Book another bus</a>
    </div>

    ${bookings.length === 0 ? `
      <div class="box" style="text-align:center; padding:3rem 1.5rem;">
        <h3>No trips booked yet</h3>
        <p style="color:var(--muted);">Search and book a bus between Delhi and Jaipur to get started.</p>
        <a href="#/" class="btn btn-primary">Search buses</a>
      </div>
    ` : `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        ${bookings.map(b => {
          const bus = BUSES.find(item => item.id === b.busId) || BUSES[0];
          return `
            <div class="box" style="display:grid; grid-template-columns:1fr auto; gap:1rem; align-items:center;">
              <div>
                <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.25rem; flex-wrap:wrap;">
                  <span style="font-weight:900; font-size:1.15rem;">${b.busName}</span>
                  <span class="chip ${b.status === 'CONFIRMED' ? 'chip-green' : (b.status === 'REFUNDED' ? 'chip-soft' : 'chip-red')}">${b.status}</span>
                  <span style="font-size:0.8rem; color:var(--muted); font-weight:700;">Ref: ${b.reference}</span>
                </div>
                <div style="font-size:0.88rem; color:var(--muted); margin-bottom:0.5rem;">
                  ${b.date} · Departs ${b.dep} · Seats: ${b.seats.join(', ')}
                </div>
                <div style="font-size:0.85rem; font-weight:700;">
                  ${b.boardingStop} → ${b.droppingStop}
                </div>
              </div>

              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;">
                <div style="font-weight:900; font-size:1.25rem;">₹${b.totalAmount}</div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end;">
                  <a href="#/ticket/${b.reference}" class="btn" style="padding:0.4rem 0.8rem; font-size:0.85rem;">View ticket</a>
                  <button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.85rem;" onclick="openAiTripGuide('${b.reference}')">AI Guide ✨</button>
                  ${bus.liveTracking && b.status === 'CONFIRMED' ? `
                    <a href="#/track/${b.busId}" class="btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; border-color:var(--route); color:var(--route);">Track 🚌</a>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;
}

// 7. Dedicated AI Trip Assistant Standalone View
function renderAssistantStandaloneView() {
  const bookings = getSavedBookings();
  const selectedRef = state.assistantSelectedBookingRef || (bookings[0]?.reference || 'SRX782K102');
  const activeBooking = bookings.find(b => b.reference === selectedRef) || bookings[0] || {
    reference: "SRX782K102",
    busId: 102,
    busName: "Sunrise Express",
    reg: "DL 01 PC 7710",
    dep: "07:30",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    seats: ["L4", "L5"],
    boardingStop: "Kashmere Gate ISBT",
    droppingStop: "Sindhi Camp Bus Stand",
    passengers: [{ name: "Varun Maheshwari", age: 28, gender: "Male" }],
    totalAmount: 1558,
    status: "CONFIRMED"
  };

  const bus = BUSES.find(b => b.id === activeBooking.busId) || BUSES[0];
  const assistantData = activeBooking.aiAssistant || state.cachedAiAssistant?.[activeBooking.reference];
  const isLoading = state.loadingAiAssistantRef === activeBooking.reference;

  return `
    <div style="max-width:880px; margin:0 auto;">
      <!-- Hero Banner -->
      <div style="background:var(--route); color:var(--on-route); padding:1.75rem 1.5rem; border-radius:8px; margin-bottom:1.5rem; border:2px solid var(--ink); box-shadow:4px 4px 0px var(--ink);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <span class="chip" style="background:var(--amber); color:#000; font-weight:900; font-size:0.75rem;">GEMINI 3.5 FLASH</span>
              <span class="chip" style="background:rgba(255,255,255,0.2); color:#fff; font-size:0.75rem;">GOOGLE SEARCH & MAPS GROUNDED</span>
            </div>
            <h1 style="font-size:1.85rem; margin:0 0 0.4rem 0; font-weight:900; letter-spacing:-0.01em;">AI Trip Assistant</h1>
            <p style="margin:0; opacity:0.9; font-size:0.95rem; max-width:600px;">
              Personalized travel intelligence, live destination forecasts, checkable packing lists, and transit survival tips for your Delhi → Jaipur journey.
            </p>
          </div>
          <button class="btn" style="background:#fff; color:var(--ink); font-weight:900;" onclick="fetchAiTripAssistant('${activeBooking.reference}')" ${isLoading ? 'disabled' : ''}>
            ${isLoading ? 'Analyzing...' : 'Generate / Refresh ✨'}
          </button>
        </div>
      </div>

      <!-- Booking Selector Bar -->
      <div class="box" style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; padding:1rem 1.25rem;">
        <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
          <span style="font-weight:900; font-size:0.9rem;">Select Booking / Trip:</span>
          <select id="assistantBookingSelect" onchange="selectAssistantBooking(this.value)" style="padding:0.4rem 0.6rem; border:2px solid var(--ink); border-radius:4px; font-weight:700; font-size:0.88rem; background:var(--panel);">
            ${bookings.map(b => `
              <option value="${b.reference}" ${b.reference === selectedRef ? 'selected' : ''}>
                ${b.reference} · ${b.busName} (${b.date})
              </option>
            `).join('')}
          </select>
        </div>
        <div style="font-size:0.85rem; color:var(--muted); font-weight:700;">
          Route: ${activeBooking.boardingStop} → ${activeBooking.droppingStop}
        </div>
      </div>

      <!-- AI Assistant Content Component -->
      ${renderAiTripAssistant(activeBooking)}

      <!-- Interactive AI Trip Chat / Q&A Section -->
      <div class="box" style="margin-top:1.5rem; border:2px solid var(--ink); border-radius:8px;">
        <div style="border-bottom:2px solid var(--ink); padding-bottom:0.75rem; margin-bottom:1rem;">
          <div style="font-weight:900; font-size:1.15rem; display:flex; align-items:center; gap:0.4rem;">
            <span>💬 Ask AI Trip Copilot</span>
            <span class="chip chip-soft" style="font-size:0.7rem;">Live Q&A</span>
          </div>
          <div style="font-size:0.82rem; color:var(--muted); margin-top:2px;">
            Ask any question about highway rest stops, luggage rules, or reaching your hotel in Jaipur.
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
          <input type="text" id="assistantUserQuery" placeholder="e.g. Where can I find the best lassi near Sindhi Camp bus stand?" style="flex:1; padding:0.6rem 0.8rem; border:2px solid var(--ink); border-radius:4px; font-size:0.9rem;" onkeydown="if(event.key==='Enter')askAiTripAssistant('${activeBooking.reference}')">
          <button class="btn btn-primary" onclick="askAiTripAssistant('${activeBooking.reference}')">Ask AI</button>
        </div>

        <!-- Quick Sample Queries -->
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:1rem;">
          <button class="chip chip-soft" style="cursor:pointer;" onclick="setAssistantQuery('Where is the 15-min highway food stop?')">Midpoint food halt</button>
          <button class="chip chip-soft" style="cursor:pointer;" onclick="setAssistantQuery('How do I take the Jaipur Metro from Sindhi Camp?')">Jaipur Metro connection</button>
          <button class="chip chip-soft" style="cursor:pointer;" onclick="setAssistantQuery('What is the baggage weight limit for AC sleeper buses?')">Luggage limit</button>
          <button class="chip chip-soft" style="cursor:pointer;" onclick="setAssistantQuery('Are charging ports available at every seat?')">Charging ports</button>
        </div>

        <!-- Chat Answer Box -->
        <div id="assistantAnswerBox" style="display:${state.assistantAnswer ? 'block' : 'none'}; background:var(--soft); border:2px solid var(--line); border-radius:6px; padding:1rem;">
          <div style="font-weight:900; font-size:0.85rem; color:var(--route); margin-bottom:0.35rem; display:flex; align-items:center; gap:0.3rem;">
            <span>✨ Gemini Response</span>
          </div>
          <div id="assistantAnswerText" style="font-size:0.9rem; line-height:1.5; color:var(--ink);">
            ${state.assistantAnswer || ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

window.renderSeatsView = renderSeatsView;
window.renderPassengersView = renderPassengersView;
window.renderPaymentView = renderPaymentView;
window.renderTicketView = renderTicketView;
window.renderTripsView = renderTripsView;
window.renderAssistantStandaloneView = renderAssistantStandaloneView;
