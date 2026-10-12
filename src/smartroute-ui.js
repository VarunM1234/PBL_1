// SmartRoute - UI Controller, Hash Router & Views

// State
const state = {
  currentRoute: "#/",
  routeParam: null,
  search: {
    from: "Delhi",
    to: "Jaipur",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    busType: "all",
    hasSearched: false
  },
  filters: {
    ac: true,
    nonAc: true,
    sleeper: true,
    seater: true,
    depBuckets: ["before6", "6to12", "12to18", "after18"],
    maxPrice: 1200,
    amenities: [],
    minRating: 0
  },
  sortBy: "cheapest",
  selectedBus: null,
  selectedSeats: [],
  boardingStopId: 1,
  droppingStopId: 7,
  seatHoldExpiresAt: null,
  holdTimerInterval: null,
  activeDeck: "LOWER",
  passengers: [],
  contact: { phone: "", email: "" },
  contactErrors: {},
  hasInsurance: true,
  couponCode: "",
  paymentMethod: "UPI",
  simulatePaymentFail: false,
  isPaying: false,
  cancelModalBooking: null,
  currentTrackedBusId: 101,
  adminSelectedBusId: 102
};

// Bookings Storage
function getSavedBookings() {
  try {
    const raw = localStorage.getItem("smartroute.bookings.v1");
    if (raw) return JSON.parse(raw);
    
    // Seed an initial demo booking so user can test ticket & AI assistant immediately
    const initialBooking = {
      reference: "SRX782K102",
      busId: 102,
      busName: "Sunrise Express",
      reg: "DL 01 PC 7710",
      dep: "07:30",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      seats: ["L4", "L5"],
      boardingStop: "Kashmere Gate ISBT",
      boardingAddress: "Gate 4, Kashmere Gate, Delhi",
      droppingStop: "Sindhi Camp Bus Stand",
      droppingAddress: "Sindhi Camp, Jaipur",
      passengers: [
        { seat: "L4", name: "Varun Maheshwari", age: 28, gender: "Male" },
        { seat: "L5", name: "Pooja Sharma", age: 26, gender: "Female" }
      ],
      totalAmount: 1558,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      createdAt: new Date().toISOString()
    };
    localStorage.setItem("smartroute.bookings.v1", JSON.stringify([initialBooking]));
    return [initialBooking];
  } catch (e) {
    return [];
  }
}

function saveBooking(booking) {
  try {
    const list = getSavedBookings();
    // Strip phone & email for privacy
    const sanitized = { ...booking };
    delete sanitized.phone;
    delete sanitized.email;
    list.unshift(sanitized);
    localStorage.setItem("smartroute.bookings.v1", JSON.stringify(list));
  } catch (e) {}
}

function updateBookingStatus(ref, newStatus, refundRef = null) {
  try {
    const list = getSavedBookings();
    const item = list.find(b => b.reference === ref);
    if (item) {
      item.status = newStatus;
      if (refundRef) item.refundReference = refundRef;
      localStorage.setItem("smartroute.bookings.v1", JSON.stringify(list));
    }
  } catch (e) {}
}

// Toasts
window.showLiveToast = function(alertObj) {
  const stack = document.getElementById("toastStack");
  if (!stack) return;

  const item = document.createElement("div");
  const isBanner = alertObj.variant === "toll" || alertObj.variant === "halt" || alertObj.type === "DELAY";
  item.className = `toast-item ${isBanner ? "alert-banner " + alertObj.variant : ""}`;
  item.setAttribute("role", "status");

  item.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
      <span style="font-weight:900; font-size:0.95rem;">${alertObj.title}</span>
      <div style="display:flex; gap:0.25rem;">
        <span class="chip chip-green" style="font-size:0.65rem; padding:0.1rem 0.4rem;">Live alert</span>
        <span class="chip chip-soft" style="font-size:0.65rem; padding:0.1rem 0.4rem;">Push</span>
      </div>
    </div>
    <div style="color:var(--ink); font-size:0.85rem;">${alertObj.body}</div>
  `;

  stack.appendChild(item);
  while (stack.children.length > 3) {
    stack.removeChild(stack.children[0]);
  }

  const duration = isBanner ? 9000 : 4500;
  setTimeout(() => {
    if (item.parentNode) item.parentNode.removeChild(item);
  }, duration);
};

window.showSimpleToast = function(msg, isWarn = false) {
  const stack = document.getElementById("toastStack");
  if (!stack) return;
  const item = document.createElement("div");
  item.className = "toast-item";
  if (isWarn) item.style.borderLeft = "6px solid var(--toll)";
  item.setAttribute("role", "status");
  item.textContent = msg;
  stack.appendChild(item);
  while (stack.children.length > 3) {
    stack.removeChild(stack.children[0]);
  }
  setTimeout(() => {
    if (item.parentNode) item.parentNode.removeChild(item);
  }, 4500);
};

// Routing
function parseRoute() {
  const hash = window.location.hash || "#/";
  const parts = hash.split("/");
  if (parts.length > 2) {
    state.currentRoute = `#/${parts[1]}`;
    state.routeParam = parts[2];
  } else {
    state.currentRoute = hash;
    state.routeParam = null;
  }

  // Guard routes
  if (state.currentRoute === "#/seats" && !state.selectedBus) {
    window.location.hash = "#/";
    return;
  }
  if ((state.currentRoute === "#/passengers" || state.currentRoute === "#/pay") && state.selectedSeats.length === 0) {
    window.location.hash = state.selectedBus ? "#/seats" : "#/";
    return;
  }

  renderApp();
}

window.addEventListener("hashchange", parseRoute);

function initSmartRoute() {
  parseRoute();
  if (window.tracker) {
    tracker.subscribe(() => {
      if (state.currentRoute === "#/track" || state.currentRoute === "#/admin") {
        if (typeof updateLiveTelemetryDOM === 'function') updateLiveTelemetryDOM();
      }
      if (typeof updateBellBadge === 'function') updateBellBadge();
    });
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initSmartRoute);
} else {
  // Document already ready, initialize immediately
  setTimeout(initSmartRoute, 0);
}

window.state = state;
window.getSavedBookings = getSavedBookings;
window.saveBooking = saveBooking;
window.updateBookingStatus = updateBookingStatus;
