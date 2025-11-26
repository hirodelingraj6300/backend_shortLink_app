// backend/config/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

if (!process.env.DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL");
  process.exit(1);
}

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection (optional)
async function testConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ MySQL connection OK");
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
