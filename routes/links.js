// backend/routes/links.js
const express = require("express");
const { pool } = require("../config/db");

const router = express.Router();

/**
 * GET /api/links
 * List all links
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM links ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("List error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * POST /api/links
 * Create a short link
 */
router.post("/", async (req, res) => {
  const { target, code } = req.body;

  if (!target) return res.status(400).json({ error: "target is required" });

  try {
    let finalCode = code;

    // Auto-generate code if empty
    if (!finalCode) {
      finalCode = Math.random().toString(36).substring(2, 8);
    }

    // Check duplicate
    const [exists] = await pool.query("SELECT id FROM links WHERE code = ?", [finalCode]);
    if (exists.length > 0) {
      return res.status(409).json({ error: "code already exists" });
    }

    // Insert
    await pool.query(
      "INSERT INTO links (id, code, target, clicks) VALUES (UUID(), ?, ?, 0)",
      [finalCode, target]
    );

    // Return full record
    const [link] = await pool.query("SELECT * FROM links WHERE code = ?", [finalCode]);
    res.json(link[0]);

  } catch (err) {
    console.error("Create error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /api/links/:code
 * Get single link
 */
router.get("/:code", async (req, res) => {
  const code = req.params.code;

  try {
    const [rows] = await pool.query("SELECT * FROM links WHERE code = ?", [code]);
    if (rows.length === 0) return res.status(404).json({ error: "not found" });

    res.json(rows[0]);

  } catch (err) {
    console.error("Get error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * DELETE /api/links/:code
 */
router.delete("/:code", async (req, res) => {
  const code = req.params.code;

  try {
    await pool.query("DELETE FROM links WHERE code = ?", [code]);
    res.json({ success: true });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "server error" });
  }
});

/**
 * POST /api/links/:code/click
 */
router.post("/:code/click", async (req, res) => {
  const code = req.params.code;

  try {
    const [rows] = await pool.query("SELECT * FROM links WHERE code = ?", [code]);
    if (rows.length === 0) return res.status(404).json({ error: "not found" });

    const link = rows[0];

    await pool.query(
      "UPDATE links SET clicks = clicks + 1, last_clicked_at = CURRENT_TIMESTAMP WHERE code = ?",
      [code]
    );

    const [updated] = await pool.query("SELECT * FROM links WHERE code = ?", [code]);
    res.json(updated[0]);

  } catch (err) {
    console.error("Click error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
