// SmartRoute - Core Constants & Domain Data
const CONFIG = {
  defaultSpeed: 40,      // Fallback speed when below 10 km/h (km/h)
  tollWindowMin: 25,     // Toll alert window start (min)
  tollWindowMax: 30,     // Toll alert window end (min)
  waypointWindowMin: 10, // Waypoint alert window start (min)
  waypointWindowMax: 30, // Waypoint alert window end (min)
  seatLockSeconds: 600,  // 10 minutes TTL
  tickMs: 250            // Telemetry tick interval
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ROUTE_KM = haversineKm(28.6676, 77.2290, 26.9196, 75.7878); // ~240.6 km
const CRUISE_SPEED = ROUTE_KM / ((180 - 15) / 60); // ~87.5 km/h

const STOPS = [
  { id: 1, name: "Kashmere Gate ISBT", type: "BOARDING", f: 0, extra: "Gate 4, Kashmere Gate, Delhi", halt: 0 },
  { id: 2, name: "Dhaula Kuan", type: "BOARDING", f: 0.05, extra: "Under the flyover, Delhi", halt: 0 },
  { id: 3, name: "Shahjahanpur Toll", type: "TOLL_PLAZA", f: 0.33, extra: "State Border Plaza", halt: 0 },
  { id: 4, name: "Highway Food Mall", type: "RESTAURANT_HALT", f: 0.50, extra: "Clean restrooms & dining", halt: 15 },
  { id: 5, name: "Kotputli Toll", type: "TOLL_PLAZA", f: 0.83, extra: "NH48 Toll Plaza", halt: 0 },
  { id: 6, name: "Narayan Singh Circle", type: "DROPPING", f: 0.985, extra: "Narayan Singh Circle, Jaipur", halt: 0 },
  { id: 7, name: "Sindhi Camp Bus Stand", type: "DROPPING", f: 1.0, extra: "Sindhi Camp, Jaipur", halt: 0 }
];

const BUSES = [
  { id: 101, operator: "Orbit Travels", reg: "DL 01 PC 4821", type: "Volvo Multi-Axle AC Seater (2+2)", ac: true, layout: "seater", dep: "06:00", fare: 899, rating: 4.6, reviews: 1284, amenities: ["Wi-Fi", "Charging point", "Water bottle", "Reading light", "Live tracking"], driver: "Ramesh Yadav / Imran Khan", liveTracking: true },
  { id: 102, operator: "Sunrise Express", reg: "DL 01 PC 7710", type: "AC Sleeper (2+1)", ac: true, layout: "sleeper", dep: "07:30", fare: 749, rating: 4.4, reviews: 902, amenities: ["Charging point", "Blanket", "Water bottle", "Live tracking"], driver: "Sunil Chauhan / Arif Ali", liveTracking: true },
  { id: 103, operator: "Pink City Lines", reg: "DL 01 PC 2290", type: "Non-AC Seater (2+2)", ac: false, layout: "seater", dep: "05:15", fare: 399, rating: 3.8, reviews: 611, amenities: ["Charging point", "Live tracking"], driver: "Mahesh Singh / Deepak Verma", liveTracking: true },
  { id: 104, operator: "Marwar Voyager", reg: "DL 01 PC 3354", type: "AC Seater (2+2)", ac: true, layout: "seater", dep: "13:00", fare: 599, rating: 4.2, reviews: 733, amenities: ["Wi-Fi", "Charging point", "Water bottle", "Live tracking"], driver: "Kailash Meena / Rohit Sharma", liveTracking: true },
  { id: 105, operator: "Night Owl Coaches", reg: "DL 01 PC 9087", type: "Non-AC Sleeper (2+1)", ac: false, layout: "sleeper", dep: "19:30", fare: 549, rating: 3.9, reviews: 420, amenities: ["Blanket", "Charging point"], driver: "Vijay Kumar / Nitin Joshi", liveTracking: false },
  { id: 106, operator: "Rajputana Premium", reg: "DL 01 PC 5512", type: "AC Sleeper (2+1)", ac: true, layout: "sleeper", dep: "21:00", fare: 999, rating: 4.7, reviews: 1540, amenities: ["Wi-Fi", "Charging point", "Blanket", "Water bottle", "Reading light", "Live tracking"], driver: "Harpal Gill / Sameer Khan", liveTracking: true }
];

window.CONFIG = CONFIG;
window.STOPS = STOPS;
window.BUSES = BUSES;
window.ROUTE_KM = ROUTE_KM;
window.CRUISE_SPEED = CRUISE_SPEED;
window.haversineKm = haversineKm;
