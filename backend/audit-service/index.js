const express = require('express');
const { Pool } = require('pg');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  next();
});

const pool = new Pool();

async function ensureTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    )`
  );
}

app.post('/audit', async (req, res) => {
  const { event_type, payload } = req.body;
  if (!event_type) return res.status(400).json({ error: 'event_type required' });
  try {
    await pool.query('INSERT INTO audit_log (event_type, payload) VALUES ($1, $2)', [event_type, payload || {}]);
    res.json({ status: 'logged' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/audit', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, event_type, payload, created_at FROM audit_log ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

ensureTable().then(() => {
  app.listen(3009, () => console.log('Audit service running on port 3009'));
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
