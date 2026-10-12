-- =====================================================================
-- SmartRoute Production Database Schema (MySQL 8.0+)
-- Enterprise Bus Travel Ecosystem & Booking Engine
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smartroute_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smartroute_db;

-- 1. Users & RBAC
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('PASSENGER', 'OPERATOR_STAFF', 'OPERATOR_ADMIN', 'PLATFORM_SUPERADMIN') NOT NULL DEFAULT 'PASSENGER',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  fcm_token VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_phone (phone),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- 2. Operators (Bus Companies)
CREATE TABLE IF NOT EXISTS operators (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(150) NOT NULL,
  license_number VARCHAR(80) NOT NULL UNIQUE,
  contact_email VARCHAR(160) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  rating DECIMAL(3, 2) NOT NULL DEFAULT 4.50,
  total_ratings INT UNSIGNED NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_operators_active (is_active)
) ENGINE=InnoDB;

-- 3. Staff (Drivers & Conductors linked to Operators)
CREATE TABLE IF NOT EXISTS staff (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  operator_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  full_name VARCHAR(120) NOT NULL,
  role ENUM('PRIMARY_DRIVER', 'CO_DRIVER', 'CONDUCTOR', 'HELPER') NOT NULL DEFAULT 'PRIMARY_DRIVER',
  license_number VARCHAR(60) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  is_on_duty BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_staff_operator (operator_id)
) ENGINE=InnoDB;

-- 4. Buses (Fleet Assets)
CREATE TABLE IF NOT EXISTS buses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  operator_id BIGINT UNSIGNED NOT NULL,
  registration_number VARCHAR(30) NOT NULL UNIQUE,
  bus_type ENUM('AC_SLEEPER', 'VOLVO_LUXURY', 'AC_SEATER', 'NON_AC_SEATER', 'NON_AC_SLEEPER') NOT NULL,
  seating_layout ENUM('SEATER_2X2', 'SLEEPER_2X1', 'HYBRID_SEATER_SLEEPER') NOT NULL DEFAULT 'SEATER_2X2',
  total_seats SMALLINT UNSIGNED NOT NULL DEFAULT 36,
  has_live_gps BOOLEAN NOT NULL DEFAULT TRUE,
  amenities_json JSON NULL,
  status ENUM('ACTIVE', 'MAINTENANCE', 'RETIRED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE,
  INDEX idx_buses_operator (operator_id),
  INDEX idx_buses_type (bus_type),
  INDEX idx_buses_status (status)
) ENGINE=InnoDB;

-- 5. Bus Seats Configuration
CREATE TABLE IF NOT EXISTS bus_seats (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bus_id BIGINT UNSIGNED NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  deck ENUM('LOWER', 'UPPER') NOT NULL DEFAULT 'LOWER',
  seat_type ENUM('SEATER', 'SLEEPER_SINGLE', 'SLEEPER_DOUBLE') NOT NULL DEFAULT 'SEATER',
  row_index SMALLINT UNSIGNED NOT NULL,
  col_index SMALLINT UNSIGNED NOT NULL,
  is_window BOOLEAN NOT NULL DEFAULT FALSE,
  is_ladies_only BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_bus_seat (bus_id, seat_number),
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  INDEX idx_seats_bus_deck (bus_id, deck)
) ENGINE=InnoDB;

-- 6. Routes & Route Stops (Waypoints, Tolls, Meal Halts)
CREATE TABLE IF NOT EXISTS routes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_city VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  total_distance_km DECIMAL(6, 2) NOT NULL,
  estimated_duration_minutes INT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_routes_source_dest (source_city, destination_city)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS route_stops (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id BIGINT UNSIGNED NOT NULL,
  stop_name VARCHAR(150) NOT NULL,
  stop_type ENUM('ORIGIN', 'BOARDING', 'DROPPING', 'TOLL_PLAZA', 'RESTAURANT_HALT', 'DESTINATION') NOT NULL,
  sequence_order SMALLINT UNSIGNED NOT NULL,
  distance_from_origin_km DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  route_fraction DECIMAL(4, 3) NOT NULL DEFAULT 0.000,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  scheduled_halt_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  UNIQUE KEY uq_route_seq (route_id, sequence_order),
  INDEX idx_route_stops_type (stop_type)
) ENGINE=InnoDB;

-- 7. Schedules & Scheduled Trips
CREATE TABLE IF NOT EXISTS schedules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id BIGINT UNSIGNED NOT NULL,
  bus_id BIGINT UNSIGNED NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  base_fare DECIMAL(8, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  INDEX idx_schedules_route (route_id),
  INDEX idx_schedules_dep_time (departure_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trips (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id BIGINT UNSIGNED NOT NULL,
  bus_id BIGINT UNSIGNED NOT NULL,
  primary_driver_id BIGINT UNSIGNED NULL,
  travel_date DATE NOT NULL,
  status ENUM('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'HALTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  current_latitude DECIMAL(10, 7) NULL,
  current_longitude DECIMAL(10, 7) NULL,
  current_speed_kmph DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  delay_minutes INT NOT NULL DEFAULT 0,
  last_telemetry_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE RESTRICT,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE RESTRICT,
  FOREIGN KEY (primary_driver_id) REFERENCES staff(id) ON DELETE SET NULL,
  INDEX idx_trips_date_status (travel_date, status),
  INDEX idx_trips_bus_date (bus_id, travel_date)
) ENGINE=InnoDB;

-- 8. Bookings & Passenger Seats
CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_reference VARCHAR(20) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  trip_id BIGINT UNSIGNED NOT NULL,
  boarding_stop_id BIGINT UNSIGNED NOT NULL,
  dropping_stop_id BIGINT UNSIGNED NOT NULL,
  base_amount DECIMAL(8, 2) NOT NULL,
  gst_amount DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  insurance_amount DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(8, 2) NOT NULL,
  status ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'CONFIRMED',
  payment_status ENUM('UNPAID', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PAID',
  payment_mode ENUM('UPI', 'CARD', 'NETBANKING', 'WALLET') NOT NULL DEFAULT 'UPI',
  qr_code_payload VARCHAR(255) NULL,
  cancellation_reason VARCHAR(255) NULL,
  refund_amount DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE RESTRICT,
  FOREIGN KEY (boarding_stop_id) REFERENCES route_stops(id) ON DELETE RESTRICT,
  FOREIGN KEY (dropping_stop_id) REFERENCES route_stops(id) ON DELETE RESTRICT,
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_trip (trip_id),
  INDEX idx_bookings_ref (booking_reference)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS passenger_seats (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  seat_id BIGINT UNSIGNED NOT NULL,
  passenger_name VARCHAR(120) NOT NULL,
  passenger_age SMALLINT UNSIGNED NOT NULL,
  passenger_gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
  seat_price DECIMAL(8, 2) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES bus_seats(id) ON DELETE RESTRICT,
  INDEX idx_passenger_booking (booking_id)
) ENGINE=InnoDB;

-- 9. Payments & Audit Logs
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  transaction_ref VARCHAR(80) NOT NULL UNIQUE,
  gateway_name VARCHAR(50) NOT NULL DEFAULT 'MOCK_RAZORPAY',
  amount DECIMAL(8, 2) NOT NULL,
  currency VARCHAR(5) NOT NULL DEFAULT 'INR',
  status ENUM('INITIATED', 'SUCCESS', 'FAILED', 'REVERSED') NOT NULL DEFAULT 'SUCCESS',
  gateway_response JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  INDEX idx_payments_booking (booking_id)
) ENGINE=InnoDB;

-- 10. Notifications Sent Record (Audit & Idempotency Log)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  trip_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  waypoint_id BIGINT UNSIGNED NULL,
  notification_type ENUM('TRIP_START', 'TOLL_APPROACHING', 'FOOD_STOP_APPROACHING', 'DELAY_ALERT', 'ARRIVAL') NOT NULL,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  channel ENUM('SOCKET_IO', 'FCM_PUSH', 'SMS', 'WHATSAPP') NOT NULL DEFAULT 'SOCKET_IO',
  idempotency_key VARCHAR(120) NOT NULL UNIQUE,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_notifications_trip (trip_id),
  INDEX idx_notifications_key (idempotency_key)
) ENGINE=InnoDB;

-- =====================================================================
-- Seed Data: Delhi - Jaipur Express NH 48 Corridor
-- =====================================================================

INSERT INTO operators (id, company_name, license_number, contact_email, contact_phone, rating, total_ratings) VALUES
(1, 'Orbit Express Travels', 'OP-DL-2024-8891', 'support@orbitexpress.in', '+91 11 4988 2200', 4.80, 1420),
(2, 'Rajputana Premium Line', 'OP-RJ-2023-1102', 'care@rajputanabus.com', '+91 141 2288 334', 4.70, 890),
(3, 'Sharma Volvo Express', 'OP-DL-2022-7721', 'info@sharmavolvo.com', '+91 11 2344 5566', 4.50, 610)
ON DUPLICATE KEY UPDATE company_name=VALUES(company_name);

INSERT INTO routes (id, source_city, destination_city, total_distance_km, estimated_duration_minutes) VALUES
(1, 'Delhi', 'Jaipur', 280.00, 300)
ON DUPLICATE KEY UPDATE total_distance_km=VALUES(total_distance_km);

INSERT INTO route_stops (id, route_id, stop_name, stop_type, sequence_order, distance_from_origin_km, route_fraction, latitude, longitude, scheduled_halt_minutes) VALUES
(1, 1, 'Kashmere Gate ISBT, Delhi', 'ORIGIN', 1, 0.00, 0.000, 28.6676000, 77.2290000, 15),
(2, 1, 'Dhaula Kuan Metro, Delhi', 'BOARDING', 2, 14.00, 0.050, 28.5921000, 77.1563000, 10),
(3, 1, 'Shahjahanpur Toll Plaza', 'TOLL_PLAZA', 3, 92.40, 0.330, 28.0125000, 76.5342000, 0),
(4, 1, 'Highway Food Mall (Midway Halt)', 'RESTAURANT_HALT', 4, 140.00, 0.500, 27.8920000, 76.2810000, 15),
(5, 1, 'Kotputli Toll Plaza', 'TOLL_PLAZA', 5, 232.40, 0.830, 27.7011000, 76.1950000, 0),
(6, 1, 'Narayan Singh Circle, Jaipur', 'DROPPING', 6, 276.00, 0.985, 26.9030000, 75.8190000, 5),
(7, 1, 'Sindhi Camp Central Bus Stand, Jaipur', 'DESTINATION', 7, 280.00, 1.000, 26.9196000, 75.7878000, 0)
ON DUPLICATE KEY UPDATE stop_name=VALUES(stop_name);
