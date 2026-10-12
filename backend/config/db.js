const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * SmartRoute MySQL 8.0 Connection Pool
 * Configured with resilient connection pooling, keep-alives, and automatic reconnection.
 */
const dbPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartroute_db',
  waitForConnections: true,
  connectionLimit: 25,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

module.exports = dbPool;
