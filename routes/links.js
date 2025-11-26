// backend/routes/links.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { nanoid } = require('nanoid'); // you installed nanoid
const router = express.Router();

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

// helper: validate URL
function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

async function generateUniqueCode(len = 6) {
  for (let i = 0; i < 8; i++) {
    const code = nanoid(len).replace(/[^A-Za-z0-9]/g, '').slice(0, len);
    const [rows] = await pool.query('SELECT 1 FROM links WHERE code = ? LIMIT 1', [code]);
    if (rows.length === 0) return code;
  }
  // fallback to longer
  return nanoid(len + 1).replace(/[^A-Za-z0-9]/g, '').slice(0, len + 1);
}

/**
 * POST /api/links
 * Body: { target: string, code?: string }
 */
router.post('/', async (req, res) => {
  try {
    const { target, code: providedCode } = req.body || {};
    if (!target) return res.status(400).json({ error: 'target is required' });
    if (!isValidUrl(target)) return res.status(400).json({ error: 'invalid target URL' });

    let code = providedCode;
    if (code) {
      if (!CODE_REGEX.test(code)) {
        return res.status(400).json({ error: 'invalid code format. use [A-Za-z0-9]{6,8}' });
      }
      // check exists
      const [exists] = await pool.query('SELECT 1 FROM links WHERE code = ? LIMIT 1', [code]);
      if (exists.length > 0) return res.status(409).json({ error: 'code already exists' });
    } else {
      code = await generateUniqueCode(6);
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO links (id, code, target) VALUES (?, ?, ?)',
      [id, code, target]
    );

    const [rows] = await pool.query('SELECT id, code, target, clicks, created_at AS createdAt, last_clicked_at AS lastClickedAt FROM links WHERE id = ? LIMIT 1', [id]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/links error', err);
    // If duplicate code inserted by race condition
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'code already exists' });
    return res.status(500).json({ error: 'server error' });
  }
});
/**
 * POST /api/links/:code/click
 * Increments clicks, updates last_clicked_at, and returns updated record.
 */
router.post('/:code/click', async (req, res) => {
  const code = req.params.code;

  // optional: reject obviously invalid codes early
  if (!/^[A-Za-z0-9]{6,8}$/.test(code)) {
    return res.status(400).json({ error: 'invalid code' });
  }

  try {
    const [updateResult] = await pool.query(
      'UPDATE links SET clicks = clicks + 1, last_clicked_at = CURRENT_TIMESTAMP WHERE code = ?',
      [code]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ error: 'not found' });
    }

    const [rows] = await pool.query(
      'SELECT id, code, target, clicks, created_at AS createdAt, last_clicked_at AS lastClickedAt FROM links WHERE code = ? LIMIT 1',
      [code]
    );

    return res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/links/:code/click error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/links
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, code, target, clicks, created_at AS createdAt, last_clicked_at AS lastClickedAt FROM links ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    console.error('GET /api/links error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /api/links/:code
 */
router.get('/:code', async (req, res) => {
  const code = req.params.code;
  try {
    const [rows] = await pool.query('SELECT id, code, target, clicks, created_at AS createdAt, last_clicked_at AS lastClickedAt FROM links WHERE code = ? LIMIT 1', [code]);
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/links/:code error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

/**
 * DELETE /api/links/:code
 */
router.delete('/:code', async (req, res) => {
  const code = req.params.code;
  try {
    const [result] = await pool.query('DELETE FROM links WHERE code = ?', [code]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/links/:code error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
