// backend/routes/redirect.js
const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

/**
 * GET /:code  -> redirect
 * This route finds the record, increments clicks, updates last_clicked_at,
 * then sends a 302 redirect to the target URL.
 */
router.get('/:code', async (req, res) => {
  const code = req.params.code;

  try {
    // Find target first
    const [rows] = await pool.query('SELECT target FROM links WHERE code = ? LIMIT 1', [code]);
    if (rows.length === 0) {
      return res.status(404).send('Not Found');
    }
    const target = rows[0].target;

    // Update clicks and last_clicked_at in one query (avoids race)
    await pool.query(
      'UPDATE links SET clicks = clicks + 1, last_clicked_at = CURRENT_TIMESTAMP WHERE code = ?',
      [code]
    );

    // Redirect with 302
    return res.redirect(302, target);
  } catch (err) {
    console.error('Redirect error for code', code, err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
