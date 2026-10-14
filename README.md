# SmartRoute: Intelligent Bus Route Management and Tracking

SmartRoute is a web application for searching bus routes, booking seats, and following a bus's progress on a trip, with an AI assistant that answers journey questions.

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

Passengers lack reliable arrival information, cannot see how crowded a bus is, and cannot book a seat in advance. Operators cannot easily monitor several buses at once. SmartRoute explores a single interface for route search, seat booking, journey tracking, and fleet monitoring.

**Primary users:** Students and staff who use the college bus service.

**Alternatives and how this differs:** general map apps give live traffic and ETAs but do not provide seat booking or operator tools for a specific bus service. State here, in one or two sentences, what your project adds.

## Project status

| Feature | Status | Notes |
| --- | --- | --- |
| User sign-in (Firebase Auth) | Implemented | `src/firebase.ts` |
| Bookings stored in Firestore | Implemented | Owner-only rules in `firestore.rules` |
| Route search and booking screens | Implemented | `src/smartroute-booking-views.js` |
| AI trip copilot, smart search, trip assistant, maps guide | Implemented | Four Gemini endpoints in `server.ts` |
| Live bus tracking | Simulated | Client-side simulation (timer, randomised speed) in `src/smartroute-tracker.js`; no real GPS yet |
| Seat selection and booking | Partly implemented | Seat locking is simulated in `src/smartroute-engine.js`; confirmed bookings are saved to Firestore (`src/firebase.ts`) |
| Multi-bus admin tracker | Prototype | `frontend/src/admin/MultiBusFleetTracker.jsx` exists but is not imported by the running app |
| Socket.IO live updates, Redis seat locks, MySQL | Not integrated | Earlier prototype in `backend/`; its dependencies are not in `package.json` |
| Toll and restaurant push alerts (FCM) | Planned | |
| ML-based ETA | Planned | |

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, motion, lucide-react |
| Server | Node.js, Express 4, `tsx` (runs `server.ts`) |
| Data and auth | Firebase Authentication, Cloud Firestore |
| AI | Google Gemini via `@google/genai` (called from the server only) |
| Language | TypeScript and JavaScript |

## Architecture

```
Browser (React + Vite)
   |-- Firebase Auth / Firestore (direct, protected by firestore.rules)
   |-- POST /api/ai/*  -->  Express server (server.ts)  -->  Gemini API
```

The Express server also serves the Vite app (dev middleware in development, `dist/` in production). The Gemini key stays on the server.

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

Firebase settings are read from `firebase-applet-config.json`. To deploy the security rules, use the Firebase CLI (`firebase deploy --only firestore:rules`).

## Repository structure

```
server.ts                 Express server, Gemini endpoints, Vite integration
src/                      Main React app (App.tsx, firebase.ts, views, tracker, engine)
frontend/src/             Additional components: SeatLayout, BookingForm, LiveTrackerMap, admin tracker
backend/                  Earlier Socket.IO / MySQL / Redis prototype (not wired into the running app)
firestore.rules           Firestore security rules (default deny)
firebase-applet-config.json  Firebase project settings
```

## Security

- Firestore defaults to deny. Users can read and write only their own `users` and `bookings` documents.
- API keys live in `.env` (ignored by git); `.env.example` contains placeholders only.
- Known gap: the `/api/ai/*` endpoints do not yet require sign-in or rate limiting. Planned fix: verify the Firebase ID token on each request and limit requests per user.

## Known limitations

- Bus position and ETA come from a client-side simulation, not live GPS, traffic data, or road routing. Real GPS from a driver device is the next milestone.
- Seat locking in `src/smartroute-engine.js` is simulated; there is no shared lock service yet.
- Seat availability is not protected against two users booking the same seat at the same moment. Planned fix: a Firestore transaction (or a lock) on seat reservation.
- No automated tests yet.

## Evaluation plan

| Measure | How |
| --- | --- |
| ETA error | Compare predicted and actual arrival on test trips (minutes) |
| Tracking delay | Time from location update to passenger screen |
| Task time | Time for new users to find their bus and book a seat (target under 60 seconds, 5 users) |
| Booking correctness | Two simultaneous bookings of one seat must not both succeed |

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
