# SmartRoute: Bus Booking and Simulated Live Tracking

SmartRoute is a web prototype for booking intercity bus seats and following a bus on a map. It currently covers one corridor, Delhi to Jaipur on NH-48. **The bus position is simulated. There is no real GPS in the running app yet.**

## Project information

| Field | Details |
| --- | --- |
| Project title | SmartRoute: An Intelligent Bus Route Management and Real-Time Tracking System |
| Team | SmartRoute \| Avengers (`DSCPP-III-2026-T228`) |
| Institution | Graphic Era (Deemed to be University), Dehradun |
| Department | Computer Science & Engineering |
| Session | 2026-27 |
| Mentor | Ms. Shrishti Chomoli |

## Problem

Passengers cannot easily tell when a bus will arrive, how full it is, or whether a seat is free before they travel. SmartRoute explores one interface for searching buses, choosing seats, and following a trip with alerts for tolls and food halts.

**Primary users:** Students and staff who use the college bus service.

**Alternatives:** general map apps show traffic and arrival times but do not offer seat selection or stop-by-stop alerts for a specific bus service. This project's aim is to combine those in one place for a defined group of users.

## Current status

| Feature | Status | Notes |
| --- | --- | --- |
| Bus search and filters | Working | Date chips (today to +30 days), coach class, AC and sleeper filters, price limit |
| Seat selection | Working | 2+2 seater and 2+1 sleeper layouts, up to 6 seats. Booked and locked seats are fixed sample data |
| Seat hold | Simulated | A 10-minute countdown in the browser. There is no shared lock, so two users could pick the same seat |
| Checkout and payment | Simulated | Passenger form, insurance, promo code and a mock payment dialog. No real payment |
| Tickets and My Trips | Working in the browser | Not saved to a database |
| Live tracking | Simulated | A Leaflet / OpenStreetMap map. The bus moves with the Advance, Traffic Jam and Reset buttons |
| Alerts and notifications | Working | Toast and bell list, an unread counter, and browser notifications after the user allows them (see below) |
| AI search and trip copilot | TODO-CONFIRM | Backed by the Gemini endpoints in `server.ts`; needs `GEMINI_API_KEY` |
| Admin view | TODO-CONFIRM | |
| Light and dark theme | Working | Toggle in the header; the choice is remembered |
| Real GPS from a driver's device | Planned | A design using Firestore exists but is not deployed |
| User accounts and database | Not in the running app | `src/firebase.ts` and `firestore.rules` exist but `App.tsx` does not use them |
| Alerts when the browser is closed | Planned | Needs a service worker and Firebase Cloud Messaging |

## How alerts work

When the simulated bus passes a point 10 km before a toll plaza or the midway halt, the app shows a toast, adds an entry to the bell list, and sends a browser notification. An arrival alert fires at the destination. Resetting the trip does not fire alerts. Browser notifications need permission (use the "Enable browser alerts" button in the bell list) and only work while the browser is open.

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, Leaflet with OpenStreetMap tiles |
| Server | Node.js, Express 4, `tsx` (runs `server.ts`) |
| AI | Google Gemini through `@google/genai`, called from the server only |
| Language | TypeScript and JavaScript |

## Architecture

```
Browser (React + Vite) --> Express server (server.ts)
                              |-- serves the app (Vite in development)
                              |-- POST /api/ai/*  -->  Gemini API
Browser --> OpenStreetMap tile servers (map images)
```

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/VarunM1234/PBL_1.git
cd PBL_1
npm install
cp .env.example .env      # then set GEMINI_API_KEY in .env
npm run dev               # http://localhost:3000
```

If `npm install` reports an `esbuild` peer-dependency conflict, make sure `esbuild` in `package.json` is `^0.28.0`.

## Repository structure

```
server.ts                      Express server and Gemini endpoints
index.html                     Theme colours (light and dark variables)
src/App.tsx                    Main application (all screens)
src/components/LiveRouteMap.tsx   Leaflet live map (simulated bus)
src/components/RouteMiniMap.tsx   Route preview with waypoint list
src/firebase.ts                Firebase helpers (not used by the running app)
src/smartroute-*.js, frontend/, backend/   Earlier prototypes, not used by the running app
firestore.rules                Firestore security rules (default deny)
```

## Security

- Secrets live in `.env`, which git ignores. `.env.example` contains placeholders only.
- The Gemini key stays on the server.
- Known gap: the `/api/ai/*` endpoints have no sign-in check or rate limit, so anyone who can reach the server could use the API quota.
- Firestore rules default to deny and allow only owner access to `users` and `bookings`, but the running app does not use Firestore yet.

## Known limitations

- Bus position, speed and arrival times are simulated. Stop coordinates for the midway halt and Kotputli are approximate, and the map draws straight lines between stops, not road geometry.
- Seat availability is sample data and holds are not shared between users.
- Bookings and tickets are not stored in a database.
- Map tiles come from the public OpenStreetMap servers, which is fine for a demo but not for a public deployment.
- There are no automated tests yet.

## Planned evaluation (not yet carried out)

| Measure | How |
| --- | --- |
| ETA error | Compare predicted and actual arrival on real test trips |
| Tracking delay | Time from a location update to the passenger screen |
| Task time | Time for new users to find a bus and book a seat (target under 60 seconds, 5 users) |
| Booking correctness | Two users booking one seat at the same moment must not both succeed |

## Team

| Name | Roll number | Role |
| --- | --- | --- |
| Varun Maheshwary | 2510360125 | Team lead, architecture, tracking |
| Trisha Gupta | 2512510016 | Passenger module and UI |
| Riya Gupta | 2510012490 | Database and testing |
| Harshita | 2510012152 | Documentation and driver module |

## Academic context

Project-Based Learning (PBL), Graphic Era (Deemed to be University), Dehradun, session 2026-27.

## License

No license specified.
