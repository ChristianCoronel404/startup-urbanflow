const express = require('express');
const { Kafka } = require('kafkajs');
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
const kafka = new Kafka({ brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')] });
const producer = kafka.producer();
const auditUrl = process.env.AUDIT_URL || 'http://localhost:3009/audit';

async function start() {
  await producer.connect();
  app.listen(3006, () => console.log('Congestion service running on port 3006'));
}

app.get('/predict', async (req, res) => {
  const hour = new Date().getHours();
  try {
    const result = await pool.query('SELECT corridor, AVG(avg_speed) AS avg_speed FROM traffic_history WHERE hour=$1 GROUP BY corridor', [hour]);
    const hotspots = result.rows.map((row) => {
      const currentSpeed = Number((Number(row.avg_speed) * (0.5 + Math.random() * 0.4)).toFixed(1));
      const congested = currentSpeed < Number(row.avg_speed) * 0.7;
      return {
        corridor: row.corridor,
        historicalAverage: Number(row.avg_speed),
        currentSpeed,
        predictedIn30Min: congested,
        note: congested ? 'Congestión prevista' : 'Tráfico normal'
      };
    });
    res.json({ hour, hotspots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/reroute', async (req, res) => {
  const { routeId, reason } = req.body;
  const event = {
    routeId: routeId || 'Corredor Norte',
    reason: reason || 'Predicción de congestión',
    timestamp: new Date().toISOString()
  };
  try {
    await producer.send({
      topic: 'reroute.needed',
      messages: [{ value: JSON.stringify(event) }]
    });
    await fetch(auditUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'reroute', payload: event })
    });
    res.json({ status: 're-route published', event });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

start().catch(console.error);
