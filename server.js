require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool, testConnection } = require("./config/db");

const linksRouter = require("./routes/links");
const redirectRouter = require("./routes/redirect");

const app = express();

// CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Attach routes
app.use("/api/links", linksRouter);
app.use("/", redirectRouter);

// Test route
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({ success: true, result: rows[0].result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
async function start() {
  try {
    await testConnection();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server not started. DB error.");
    process.exit(1);
  }
}

start();
