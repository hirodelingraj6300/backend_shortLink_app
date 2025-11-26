require("dotenv").config();
const express = require("express");
const { pool, testConnection } = require("./config/db");

const app = express();
app.use(express.json());

// Test route
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({ success: true, result: rows[0].result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server only after DB is OK
async function start() {
  try {
    await testConnection();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Server not started. DB error.");
    process.exit(1);
  }
}

start();
