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

app.get('/kpis', async (req, res) => {
  try {
    const result = await pool.query('SELECT corridor, AVG(avg_speed) AS avg_speed, AVG(occupancy) AS occupancy FROM traffic_history GROUP BY corridor');
    const kpis = result.rows.map((row) => ({
      corridor: row.corridor,
      avgSpeed: Number(row.avg_speed),
      occupancy: Number(row.occupancy)
    }));
    res.json({
      flowByCorridor: kpis,
      punctuality: 88,
      emissionsAvoided: 520,
      occupancy: kpis.map((x) => ({ corridor: x.corridor, occupancy: x.occupancy }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3008, () => console.log('Analytics service running on port 3008'));
