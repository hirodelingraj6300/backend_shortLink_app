require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const linksRouter = require('./routes/links');
const redirectRouter = require('./routes/redirect');

const app = express();
app.use(express.json()); // parse JSON bodies
app.use(cors()); // allow requests from any origin during development

// API routes
app.use('/api/links', linksRouter);

// healthz
app.get('/healthz', (req, res) => res.json({ ok: true, version: '1.0' }));

// Mount redirect router at root (must be after /api routes so it doesn't catch them)
app.use('/', redirectRouter);

// optional 404 handlers
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));
app.use((req, res) => res.status(404).send('Not Found'));

const PORT = parseInt(process.env.PORT || '3000', 10);

(async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server not started due to DB connection error.');
    process.exit(1);
  }
})();
