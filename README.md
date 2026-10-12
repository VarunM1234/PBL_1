
# 🚌 SmartRoute — Intelligent Bus Route Management & Real-Time Tracking System

SmartRoute is an intelligent bus route management, booking, and real-time tracking system designed to make campus and public transportation more efficient, reliable, and user-friendly.

The platform aims to connect passengers, drivers, and transport administrators through live GPS tracking, dynamic ETA estimation, interactive seat booking, automated journey notifications, and centralized fleet management.

---

## 📋 Project Information

| Field | Details |
|---|---|
| Project Title | SmartRoute: An Intelligent Bus Route Management and Real-Time Tracking System |
| Team Name | SmartRoute \| Avengers |
| Team ID | `DSCPP-III-2026-T228` |
| Institution | Graphic Era (Deemed to be University), Dehradun |
| Department | Computer Science & Engineering |
| Academic Session | 2026–27 |
| Project Mentor | Ms. Shrishti Chomoli |

---

## 🔍 Problem Statement

Passengers often face transportation problems such as unexpected delays, traffic congestion, overcrowded buses, irregular schedules, and a lack of accurate arrival information.

Transport operators also face difficulties monitoring vehicle locations, managing routes, tracking passenger occupancy, and communicating important journey updates.

SmartRoute aims to address these challenges through a centralized platform that integrates real-time GPS tracking, intelligent ETA estimation, automated notifications, seat booking, and fleet management.

### 🎯 Project Objectives

- Provide real-time bus location and arrival information.
- Improve passenger convenience through route search and seat booking.
- Notify passengers about journey starts, upcoming toll plazas, and planned restaurant stops.
- Help administrators manage buses, drivers, routes, and schedules.
- Reduce double-booking through temporary seat locking.
- Explore intelligent route optimization and passenger occupancy estimation.

---

## ✨ Key Features

### 🗺️ 1. Real-Time GPS Tracking
- Display live bus locations on an interactive map.
- Send GPS coordinates from the driver application to the backend.
- Use Socket.IO to distribute location updates to connected clients.
- Show journey progress and estimated arrival times.

### ⏱️ 2. Dynamic ETA Prediction
- Estimate travel time using route information, distance, and traffic conditions.
- Use the Haversine formula to calculate straight-line distance between geographic coordinates.
- Update ETA as new GPS coordinates become available.
- Integrate mapping and routing APIs for road-distance and traffic-aware estimates.

> Note: The Haversine formula calculates geographic distance, not actual road travel time. Accurate ETAs require route data and suitable travel-time estimates.

### 🚧 3. Automated Toll & Restaurant Alerts
- Notify passengers when the journey starts.
- Provide destination and estimated total journey time.
- Generate alerts for upcoming toll plazas and planned restaurant stops.
- Include estimated distance and time to the upcoming stop.
- Use Firebase Cloud Messaging (FCM) for push notifications.
- Use Socket.IO for real-time alerts to connected passengers.
- Prevent duplicate alerts using Redis-based event tracking and idempotency keys.

### 💺 4. Interactive Seat Booking
- Display a visual seat-selection layout.
- Allow passengers to select available seats.
- Temporarily lock selected seats during checkout using Redis.
- Validate seat availability before confirming a booking.
- Store confirmed bookings in MySQL.

### 👥 5. Passenger Occupancy Management
- Display available seats and passenger occupancy.
- Help passengers identify less crowded buses when occupancy data is available.
- Provide administrators with occupancy information for operational planning.

### 🤖 6. Intelligent Route Optimization
- Explore route recommendations based on distance, traffic, and travel time.
- Support efficient route planning using mapping and routing services.
- Provide a foundation for future AI/ML-based predictions.

### 👨‍✈️ 7. Driver Application
- View assigned buses, routes, and scheduled trips.
- Start and update journey status.
- Broadcast GPS coordinates during an active trip.
- Report delays, incidents, and other journey-related issues.

### 👨‍💼 8. Admin & Operator Dashboard
- Manage buses, drivers, conductors, and routes.
- Configure stops, toll plazas, restaurant halts, and schedules.
- Monitor active trips and vehicle locations.
- View passenger bookings and trip manifests.
- Manage operational information from a centralized dashboard.

---

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Passenger | Search routes, check availability, book seats, track buses, receive notifications |
| Driver | Manage assigned trips, share GPS coordinates, report issues |
| Administrator | Manage buses, staff, routes, stops, schedules, and bookings |
| Operator | Monitor fleet activity, trip progress, and passenger manifests |

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Web Frontend | React.js |
| Mobile Applications | Flutter |
| Backend | Node.js, Express.js |
| Real-Time Communication | Socket.IO |
| Relational Database | MySQL |
| Cache and Seat Locks | Redis |
| Telemetry Storage | MongoDB (optional) |
| Authentication | JWT-based authentication |
| Maps and Routing | Google Maps Platform |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Push Notification Server | Firebase Admin SDK |
| Core Programming | C / C++ |
| Version Control | Git and GitHub |

### Why These Technologies?

- **React.js:** Builds interactive passenger and administrator interfaces.
- **Flutter:** Supports cross-platform mobile application development.
- **Node.js and Express.js:** Handle APIs, authentication, bookings, and business logic.
- **Socket.IO:** Enables real-time GPS updates and foreground notifications.
- **MySQL:** Stores structured information such as users, buses, routes, staff, and bookings.
- **Redis:** Supports temporary seat locks, caching, and duplicate-alert prevention.
- **MongoDB:** Can store historical GPS telemetry and event logs when required.
- **Google Maps Platform:** Supports map visualization, directions, and traffic-aware routing.
- **Firebase Cloud Messaging:** Delivers push notifications to supported devices.

---

## 📐 System Architecture

```text
+----------------------------------------------------------+
|                         CLIENTS                          |
|                                                          |
|  Passenger Web/App    Driver App    Admin Dashboard      |
|       React            Flutter          React            |
+---------------------------+------------------------------+
                            |
                HTTPS REST API / Socket.IO
                            |
                            v
+----------------------------------------------------------+
|                    BACKEND SERVER                        |
|                  Node.js + Express.js                    |
|                                                          |
|  Authentication Service    Booking Service               |
|  Route Management           GPS Tracking Service          |
|  ETA Estimation             Notification Service          |
|  Fleet Management           Socket.IO Server              |
+---------------------------+------------------------------+
                            |
          +-----------------+------------------+
          |                 |                  |
          v                 v                  v
+----------------+  +----------------+  +------------------+
|     MySQL      |  |     Redis      |  | External Services|
|                |  |                |  |                  |
| Users          |  | Seat Locks     |  | Google Maps      |
| Buses          |  | Cache           |  | Firebase FCM     |
| Staff          |  | Alert Status    |  | Routing APIs     |
| Routes         |  | Live Data       |  |                  |
| Bookings       |  +----------------+  +------------------+
+----------------+
          |
          v
+----------------+
|    MongoDB     |
|                |
| GPS History    |
| Telemetry Logs |
| Event History  |
+----------------+
```

### Notification Workflow

1. The driver starts a scheduled trip.
2. The backend updates the journey status.
3. The notification service calculates the current journey ETA.
4. GPS updates help identify upcoming toll plazas and planned stops.
5. When a notification threshold is reached, the service checks whether the alert has already been sent.
6. The service sends a push notification through FCM and/or a live event through Socket.IO.
7. Redis helps prevent duplicate notifications for the same trip and stop.

---

## 🔔 Notification Examples

**Journey started**

> Your journey to Jaipur has started. The estimated total travel time is 3 hours.

**Upcoming toll plaza**

> An upcoming toll plaza is approximately 8 km away. Your estimated remaining journey time to Jaipur is 2 hours and 15 minutes.

**Restaurant halt**

> Your bus has reached the scheduled restaurant stop. The planned halt duration is 15 minutes.

These are illustrative examples. Actual messages should be generated from current trip data, route information, and ETA calculations.

---

## 🗂️ Suggested Project Structure

```text
Bus-Route-Management-System/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── gpsTrackingService.js
│   │   │   ├── etaService.js
│   │   │   ├── bookingService.js
│   │   │   └── notificationService.js
│   │   ├── sockets/
│   │   └── app.js
│   ├── .env.example
│   └── package.json
│
├── mobile/
│   └── README.md
│
├── database/
│   └── schema.sql
│
├── docs/
│   └── architecture.md
│
├── .gitignore
└── README.md
```

This is a suggested structure; adjust it to match the files actually present in your repository.

---

## 🚀 Getting Started

### Prerequisites

Install the following tools before running the project:

- [Node.js and npm](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [MySQL](https://www.mysql.com/)
- [Redis](https://redis.io/)
- [MongoDB](https://www.mongodb.com/) (only if telemetry storage is enabled)
- [Flutter SDK](https://flutter.dev/) (if running the mobile application)

You will also need the appropriate Google Maps API credentials and Firebase configuration for features that use those services.

### 1. Clone the Repository

Replace `your-username` with your actual GitHub username.

```bash
git clone https://github.com/your-username/Bus-Route-Management-System.git
cd Bus-Route-Management-System
```

### 2. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example`.

```bash
cp .env.example .env
```

On Windows Command Prompt, you can use:

```cmd
copy .env.example .env
```

Configure your database credentials, authentication secret, Redis connection, mapping API key, and Firebase settings in `.env`.

**Never commit real passwords, API keys, private keys, or Firebase service-account credentials to GitHub.**

### 3. Start the Backend

```bash
npm run dev
```

This command assumes that the backend's `package.json` defines a `dev` script. Use the script provided by your actual project if it differs.

### 4. Start the Web Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by your frontend development server.

### 5. Run the Mobile Application

If the Flutter application has been configured:

```bash
cd mobile
flutter pub get
flutter run
```

Ensure the required Android emulator, iOS simulator, or physical device is available.

---

## 🔐 Security and Reliability

SmartRoute should follow these practices as the application develops:

- Use JWT authentication and role-based access control.
- Validate input on the backend.
- Keep API keys and credentials in environment variables.
- Use database transactions to confirm bookings safely.
- Make seat-lock operations atomic and expire temporary locks.
- Revalidate seat availability before completing payment or booking confirmation.
- Use idempotency keys to prevent duplicate notifications.
- Restrict access to driver GPS updates and administrative operations.
- Validate incoming GPS data and protect APIs with appropriate rate limits.

---

## 🧪 Testing

Recommended testing areas include:

- User registration and authentication.
- Route search and schedule retrieval.
- Seat selection, locking, expiration, and booking confirmation.
- Simultaneous booking attempts for the same seat.
- Live GPS updates through Socket.IO.
- ETA recalculation as a bus moves.
- Toll and restaurant notification thresholds.
- Duplicate-alert prevention.
- Admin access control and fleet management.

Automated unit, integration, and end-to-end tests can be added as the implementation progresses.

---

## 👥 Team Members

| Name | University Roll Number | Role | Contribution |
|---|---|---|---|
| Varun Maheshwary | 2510360125 | Team Lead | System architecture, backend planning, GPS tracking services |
| Trisha Gupta | 2512510016 | Developer | Passenger application module and user interface |
| Riya Gupta | 2510012490 | Database & Testing | Database schema design and test data preparation |
| Harshita | 2510012152 | Developer & Documentation | Documentation and driver module |

**Project Mentor:** Ms. Shrishti Chomoli  
**Department:** Computer Science & Engineering, Graphic Era (Deemed to be University), Dehradun

---

## 🎓 Academic Context

This project is developed as part of the Project-Based Learning (PBL) curriculum at Graphic Era (Deemed to be University), Dehradun, during the academic session 2026–27.

---

## 🛣️ Future Enhancements

- AI/ML-based arrival-time prediction using historical GPS and traffic data.
- More advanced traffic-aware route optimization.
- Online payment gateway integration.
- Digital tickets and QR-code-based boarding verification.
- Booking cancellation and refund workflows.
- Historical fleet analytics and operational reports.
- Automated driver performance and route-efficiency reports.
- Enhanced accessibility and multilingual passenger interfaces.

---

## 📄 License

No license has been specified yet. Add an appropriate open-source license, such as the MIT License, if you intend to permit others to use, modify, and distribute the project.

---

**SmartRoute — Making bus transportation smarter, more connected, and more reliable.** 🚌
