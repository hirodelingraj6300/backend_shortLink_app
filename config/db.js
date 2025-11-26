const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
  // When using full URL (Aiven)
  pool = mysql.createPool(process.env.DATABASE_URL + "&ssl-mode=REQUIRED");
} else {
  // When using local DB
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

async function testConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  console.log("✅ Database connected successfully");
  connection.release();
}

module.exports = { pool, testConnection };
