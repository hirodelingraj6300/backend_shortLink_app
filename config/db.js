require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // ⬅️ REQUIRED for Aiven MySQL
  }
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ MySQL connection OK');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
    throw err;
  }
}

module.exports = { pool, testConnection };
