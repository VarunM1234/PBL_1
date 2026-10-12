// SmartRoute - Controller Actions & DOM Handlers

function renderApp() {
  const app = document.getElementById("app");
  if (!app) return;

  let viewHtml = '';
  switch (state.currentRoute) {
    case "#/":
      viewHtml = renderHomeView();
      break;
    case "#/seats":
      viewHtml = renderSeatsView();
      break;
    case "#/passengers":
      viewHtml = renderPassengersView();
      break;
    case "#/pay":
      viewHtml = renderPaymentView();
      break;
    case "#/trips":
      viewHtml = renderTripsView();
      break;
    case "#/assistant":
      viewHtml = renderAssistantStandaloneView();
      break;
    case "#/admin":
      viewHtml = renderAdminView();
      break;
    default:
      if (state.currentRoute.startsWith("#/ticket")) {
        viewHtml = renderTicketView();
      } else if (state.currentRoute.startsWith("#/track")) {
        viewHtml = renderTrackView();
      } else {
        viewHtml = renderHomeView();
      }
  }

  app.innerHTML = renderShell(viewHtml);
}

// Search Actions
function handleSearchSubmit(e) {
  e.preventDefault();
  const from = document.getElementById("searchFrom").value.trim();
  const to = document.getElementById("searchTo").value.trim();
  const date = document.getElementById("searchDate").value;
  const busType = document.getElementById("searchType").value;

  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    showSimpleToast("Journey date cannot be in the past.", true);
    return;
  }

  state.search.from = from;
  state.search.to = to;
  state.search.date = date;
  state.search.busType = busType;
  state.search.hasSearched = true;

  if (busType === 'ac') { state.filters.ac = true; state.filters.nonAc = false; }
  else if (busType === 'non-ac') { state.filters.ac = false; state.filters.nonAc = true; }
  else if (busType === 'sleeper') { state.filters.sleeper = true; state.filters.seater = false; }
  else if (busType === 'seater') { state.filters.sleeper = false; state.filters.seater = true; }
  else {
    state.filters.ac = true;
    state.filters.nonAc = true;
    state.filters.sleeper = true;
    state.filters.seater = true;
  }

  renderApp();
}

function setDelhiToJaipurSearch() {
  state.search.from = "Delhi";
  state.search.to = "Jaipur";
  state.search.hasSearched = true;
  renderApp();
}

function updateFilter(key, val) {
  state.filters[key] = val;
  renderApp();
}

function toggleDepBucket(bucket, checked) {
  if (checked) {
    if (!state.filters.depBuckets.includes(bucket)) state.filters.depBuckets.push(bucket);
  } else {
    state.filters.depBuckets = state.filters.depBuckets.filter(b => b !== bucket);
  }
  renderApp();
}

function toggleAmenity(am, checked) {
  if (checked) {
    if (!state.filters.amenities.includes(am)) state.filters.amenities.push(am);
  } else {
    state.filters.amenities = state.filters.amenities.filter(a => a !== am);
  }
  renderApp();
}

function clearFilters() {
  state.filters = {
    ac: true,
    nonAc: true,
    sleeper: true,
    seater: true,
    depBuckets: ["before6", "6to12", "12to18", "after18"],
    maxPrice: 1200,
    amenities: [],
    minRating: 0
  };
  renderApp();
}

function setSort(type) {
  state.sortBy = type;
  renderApp();
}

function selectBusForBooking(busId) {
  state.selectedBus = BUSES.find(b => b.id === busId) || BUSES[0];
  state.selectedSeats = [];
  state.seatHoldExpiresAt = null;
  state.passengers = [];
  state.boardingStopId = 1;
  state.droppingStopId = 7;
  window.location.hash = "#/seats";
}

// Seat Selection Actions
function setDeck(deck) {
  state.activeDeck = deck;
  renderApp();
}

function setBoardingStop(id) {
  state.boardingStopId = id;
}

function setDroppingStop(id) {
  state.droppingStopId = id;
}

function handleSeatClick(seatId) {
  const bus = state.selectedBus;
  if (!bus) return;

  const isSelected = state.selectedSeats.includes(seatId);
  const lockKey = `seatlock:${bus.id}-${state.search.date}:${seatId}`;
  const myUserId = "current_passenger_session";

  if (isSelected) {
    // Release seat
    redis.unlock(lockKey, myUserId);
    state.selectedSeats = state.selectedSeats.filter(s => s !== seatId);
    if (state.selectedSeats.length === 0) {
      clearInterval(state.holdTimerInterval);
      state.seatHoldExpiresAt = null;
    }
  } else {
    // Check max 6
    if (state.selectedSeats.length >= 6) {
      showSimpleToast("You can book up to 6 seats at a time.", true);
      return;
    }

    // Try acquiring lock
    const locked = redis.lockSeat(lockKey, myUserId, CONFIG.seatLockSeconds);
    if (!locked) {
      showSimpleToast(`Seat ${seatId} is being held by another passenger. Pick a different seat.`, true);
      return;
    }

    state.selectedSeats.push(seatId);
    state.seatHoldExpiresAt = Date.now() + (CONFIG.seatLockSeconds * 1000);

    // Start countdown if not active
    clearInterval(state.holdTimerInterval);
    state.holdTimerInterval = setInterval(() => {
      if (Date.now() >= state.seatHoldExpiresAt) {
        clearInterval(state.holdTimerInterval);
        state.selectedSeats.forEach(s => {
          redis.unlock(`seatlock:${bus.id}-${state.search.date}:${s}`, myUserId);
        });
        state.selectedSeats = [];
        state.seatHoldExpiresAt = null;
        showSimpleToast("Your seat hold expired and the seats were released.", true);
        if (state.currentRoute !== "#/seats") {
          window.location.hash = "#/seats";
        } else {
          renderApp();
        }
      }
    }, 1000);
  }

  renderApp();
}

function proceedToPassengers() {
  if (state.selectedSeats.length === 0) return;
  // Initialize passengers array
  state.passengers = state.selectedSeats.map((seat, i) => {
    return state.passengers[i] || { seat, name: "", age: "", gender: "Male" };
  });
  window.location.hash = "#/passengers";
}

// Passenger & Fare Actions
function updatePassenger(idx, field, val) {
  if (!state.passengers[idx]) state.passengers[idx] = { seat: state.selectedSeats[idx] };
  state.passengers[idx][field] = val;
  delete state.contactErrors[`p_${idx}_${field}`];
}

function updateContact(field, val) {
  state.contact[field] = val;
  delete state.contactErrors[field];
}

function toggleInsurance(checked) {
  state.hasInsurance = checked;
  renderApp();
}

function applyCoupon() {
  const input = document.getElementById("couponInput");
  if (input) state.couponCode = input.value.trim().toUpperCase();
  renderApp();
}

function validateAndGoToPayment() {
  const errors = {};
  state.passengers.forEach((p, idx) => {
    if (!p.name || p.name.trim().length < 2) {
      errors[`p_${idx}_name`] = "Please enter passenger name.";
    }
    const ageNum = parseInt(p.age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 99) {
      errors[`p_${idx}_age`] = "Enter age between 1 and 99.";
    }
  });

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(state.contact.phone.trim())) {
    errors.phone = "Enter a valid 10-digit mobile number.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(state.contact.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  state.contactErrors = errors;
  if (Object.keys(errors).length > 0) {
    showSimpleToast("Please correct the invalid fields.", true);
    renderApp();
    return;
  }

  window.location.hash = "#/pay";
}

// Payment Actions
function setPaymentMethod(m) {
  state.paymentMethod = m;
  renderApp();
}

function toggleSimulateFail(checked) {
  state.simulatePaymentFail = checked;
}

function processPayment() {
  state.isPaying = true;
  renderApp();

  setTimeout(() => {
    state.isPaying = false;
    if (state.simulatePaymentFail) {
      renderApp();
      showSimpleToast("Payment failed. You were not charged. Your seats stay held until the timer ends, so you can try again.", true);
      return;
    }

    // Success: create booking reference SR + 5 uppercase + 3 digits
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let randomLetters = "";
    for (let i = 0; i < 5; i++) randomLetters += chars[Math.floor(Math.random() * chars.length)];
    const randomDigits = Math.floor(Math.random() * 900) + 100;
    const ref = `SR${randomLetters}${randomDigits}`;

    const bus = state.selectedBus;
    const fareCalc = calculateFare(state.selectedSeats.length, bus.fare, state.hasInsurance, state.couponCode);

    const bStop = STOPS.find(s => s.id === state.boardingStopId) || STOPS[0];
    const dStop = STOPS.find(s => s.id === state.droppingStopId) || STOPS[6];

    const booking = {
      reference: ref,
      busId: bus.id,
      busName: bus.operator,
      reg: bus.reg,
      dep: bus.dep,
      date: state.search.date,
      seats: [...state.selectedSeats],
      boardingStop: bStop.name,
      boardingAddress: bStop.extra,
      droppingStop: dStop.name,
      droppingAddress: dStop.extra,
      passengers: state.passengers.map((p, i) => ({
        seat: state.selectedSeats[i],
        name: p.name,
        age: p.age,
        gender: p.gender
      })),
      totalAmount: fareCalc.total,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      createdAt: new Date().toISOString()
    };

    // Save and clear holds
    saveBooking(booking);
    if (window.firebaseAuth?.persistBookingToFirestore) {
      window.firebaseAuth.persistBookingToFirestore(booking);
    }
    state.selectedSeats.forEach(seatId => {
      redis.unlock(`seatlock:${bus.id}-${state.search.date}:${seatId}`, "current_passenger_session");
    });
    clearInterval(state.holdTimerInterval);
    state.selectedSeats = [];
    state.seatHoldExpiresAt = null;

    tracker.emitAlert(bus.id, "BOOKING", "Booking confirmed!", `Your booking for ${bus.operator} (Ref: ${ref}) is confirmed.`, "normal");
    window.location.hash = `#/ticket/${ref}`;
  }, 1700);
}

// Cancellation Actions
function openCancelModal(ref) {
  const bookings = getSavedBookings();
  const b = bookings.find(item => item.reference === ref);
  if (b) {
    state.cancelModalBooking = b;
    renderApp();
  }
}

function closeCancelModal() {
  state.cancelModalBooking = null;
  renderApp();
}

function confirmCancelBooking(ref) {
  updateBookingStatus(ref, "CANCELLED");
  closeCancelModal();
  tracker.emitAlert(state.cancelModalBooking?.busId || 101, "CANCEL", "Booking cancelled", `Booking ${ref} was successfully cancelled.`, "toll");
  renderApp();

  // After 1.8s refund sent
  setTimeout(() => {
    const refundRef = "RF" + Math.random().toString(36).substr(2, 6).toUpperCase();
    updateBookingStatus(ref, "REFUNDED", refundRef);
    tracker.emitAlert(state.cancelModalBooking?.busId || 101, "REFUND", "Refund sent", `Refund issued for ${ref}. Refund reference: ${refundRef}.`, "normal");
    renderApp();
  }, 1800);
}

// Admin & Telemetry Actions
function selectAdminBus(busId) {
  state.adminSelectedBusId = busId;
  renderApp();
}

function toggleNotifications() {
  const dd = document.getElementById("notifDropdown");
  if (dd) {
    dd.classList.toggle("show");
    tracker.unreadNotifs = 0;
    updateBellBadge();
  }
}

function updateBellBadge() {
  const badge = document.getElementById("bellBadge");
  if (badge) {
    if (tracker.unreadNotifs > 0) {
      badge.textContent = tracker.unreadNotifs;
      badge.style.display = "block";
    } else {
      badge.style.display = "none";
    }
  }
}

function updateLiveTelemetryDOM() {
  // Only update tracking or admin page
  if (state.currentRoute.startsWith("#/track")) {
    renderApp();
  } else if (state.currentRoute === "#/admin") {
    renderApp();
  }
}

// AI Integration Actions
async function handleAiSearch() {
  const input = document.getElementById("aiSearchInput");
  if (!input || !input.value.trim()) return;

  const query = input.value.trim();
  showSimpleToast("Asking SmartRoute AI...", false);

  try {
    const res = await fetch("/api/ai/smart-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    state.aiRecommendation = data.recommendation;
    state.aiMatchedBusIds = data.matchedBusIds || [];
    renderApp();
  } catch (err) {
    console.error("AI Search Error:", err);
    state.aiRecommendation = "Showing our top-rated express fleet matching your journey.";
    state.aiMatchedBusIds = [101, 106];
    renderApp();
  }
}

async function fetchAiTripAdvisory(busId) {
  const bus = BUSES.find(b => b.id === busId) || BUSES[0];
  const trip = tracker.trips[busId];
  if (!trip) return;

  const effectiveSpeed = trip.speed > 10 ? trip.smoothedSpeed : CONFIG.defaultSpeed;
  let nextStop = STOPS[STOPS.length - 1];
  for (const st of STOPS) {
    if (st.f > trip.progress) {
      nextStop = st;
      break;
    }
  }

  showSimpleToast("Fetching live AI Copilot advisory...", false);
  try {
    const res = await fetch("/api/ai/trip-copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        busName: bus.operator,
        busType: bus.type,
        progress: trip.progress,
        currentSpeed: Math.round(trip.speed),
        nextStop: nextStop.name,
        delayMin: trip.delayMin || 0
      })
    });
    const data = await res.json();
    trip.aiAdvisory = data;
    renderApp();
  } catch (err) {
    console.error("AI Advisory error:", err);
    trip.aiAdvisory = {
      advisory: `Cruising at ${Math.round(trip.speed)} km/h. NH 48 corridor conditions are clear.`,
      foodTip: "Highway Food Mall offers fresh refreshments and dining options.",
      trafficOutlook: "Normal traffic flow maintained."
    };
    renderApp();
  }
}

async function fetchAiTripAssistant(ref) {
  const bookings = getSavedBookings();
  const booking = bookings.find(b => b.reference === ref);
  if (!booking) return;

  const bus = BUSES.find(b => b.id === booking.busId) || BUSES[0];

  state.loadingAiAssistantRef = ref;
  renderApp();

  showSimpleToast("AI Assistant is analyzing your itinerary...", false);
  try {
    const res = await fetch("/api/ai/trip-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingReference: ref,
        journeyDate: booking.date,
        destinationCity: "Jaipur",
        departureTime: booking.dep,
        busName: booking.busName,
        busType: bus.type,
        boardingStop: booking.boardingStop,
        droppingStop: booking.droppingStop,
        passengersCount: booking.passengers?.length || 1
      })
    });
    const data = await res.json();
    booking.aiAssistant = data;
    
    // Save to localStorage
    try {
      const all = getSavedBookings();
      const target = all.find(b => b.reference === ref);
      if (target) {
        target.aiAssistant = data;
        localStorage.setItem("smartroute.bookings.v1", JSON.stringify(all));
      }
    } catch(e) {}

    state.loadingAiAssistantRef = null;
    showSimpleToast("AI Trip Assistant plan ready ✨", false);
    renderApp();
  } catch (err) {
    console.error("AI Assistant error:", err);
    state.loadingAiAssistantRef = null;
    renderApp();
  }
}

function openAiTripGuide(ref) {
  window.location.hash = `#/ticket/${ref}`;
  setTimeout(() => {
    fetchAiTripAssistant(ref);
  }, 100);
}

async function handleGoogleSignIn() {
  if (!window.firebaseAuth?.loginWithGoogle) {
    showSimpleToast("Firebase Auth initializing...", false);
    return;
  }
  try {
    const user = await window.firebaseAuth.loginWithGoogle();
    showSimpleToast(`Signed in as ${user.displayName || 'Traveler'}`, false);
    renderApp();
  } catch (err) {
    showSimpleToast("Sign in cancelled or window closed.", true);
  }
}

async function handleGoogleSignOut() {
  if (!window.firebaseAuth?.logoutUser) return;
  await window.firebaseAuth.logoutUser();
  showSimpleToast("Signed out successfully.", false);
  renderApp();
}

function selectAssistantBooking(ref) {
  state.assistantSelectedBookingRef = ref;
  renderApp();
  fetchAiTripAssistant(ref);
}

function setAssistantQuery(query) {
  const el = document.getElementById("assistantUserQuery");
  if (el) {
    el.value = query;
    askAiTripAssistant(state.assistantSelectedBookingRef);
  }
}

async function askAiTripAssistant(ref) {
  const el = document.getElementById("assistantUserQuery");
  const query = el ? el.value.trim() : "";
  if (!query) return;

  state.assistantAnswer = "Gemini is analyzing your journey inquiry...";
  renderApp();

  try {
    const res = await fetch("/api/ai/smart-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `Transit passenger question for Delhi to Jaipur bus journey: ${query}` })
    });
    const data = await res.json();
    state.assistantAnswer = data.recommendation || "All buses provide a 15-minute halt at Midway Food Mall. At Sindhi Camp, Jaipur Metro and pre-paid autos are readily available.";
    renderApp();
  } catch (err) {
    state.assistantAnswer = "Midpoint Highway Food Mall offers fresh food and clean facilities. At Sindhi Camp terminal, Jaipur Pink Line Metro is within 100 meters.";
    renderApp();
  }
}

// Global expose
window.renderApp = renderApp;
window.handleSearchSubmit = handleSearchSubmit;
window.setDelhiToJaipurSearch = setDelhiToJaipurSearch;
window.updateFilter = updateFilter;
window.toggleDepBucket = toggleDepBucket;
window.toggleAmenity = toggleAmenity;
window.clearFilters = clearFilters;
window.setSort = setSort;
window.selectBusForBooking = selectBusForBooking;
window.setDeck = setDeck;
window.setBoardingStop = setBoardingStop;
window.setDroppingStop = setDroppingStop;
window.handleSeatClick = handleSeatClick;
window.proceedToPassengers = proceedToPassengers;
window.updatePassenger = updatePassenger;
window.updateContact = updateContact;
window.toggleInsurance = toggleInsurance;
window.applyCoupon = applyCoupon;
window.validateAndGoToPayment = validateAndGoToPayment;
window.setPaymentMethod = setPaymentMethod;
window.toggleSimulateFail = toggleSimulateFail;
window.processPayment = processPayment;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.confirmCancelBooking = confirmCancelBooking;
window.selectAdminBus = selectAdminBus;
window.toggleNotifications = toggleNotifications;
window.updateBellBadge = updateBellBadge;
window.updateLiveTelemetryDOM = updateLiveTelemetryDOM;
window.handleAiSearch = handleAiSearch;
window.fetchAiTripAdvisory = fetchAiTripAdvisory;
window.fetchAiTripAssistant = fetchAiTripAssistant;
window.openAiTripGuide = openAiTripGuide;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handleGoogleSignOut = handleGoogleSignOut;
window.selectAssistantBooking = selectAssistantBooking;
window.setAssistantQuery = setAssistantQuery;
window.askAiTripAssistant = askAiTripAssistant;

// Kick off initial render if DOM is ready
if (typeof parseRoute === 'function') {
  parseRoute();
}
