const express = require('express');
const { createClient } = require('redis');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  next();
});

const redis = createClient({ url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}` });
redis.connect().catch(console.error);

app.get('/scooters/available', async (req, res) => {
  const scooters = [];
  for await (const key of redis.scanIterator({ MATCH: 'scooter-*' })) {
    const payload = await redis.get(key);
    if (!payload) continue;
    const item = JSON.parse(payload);
    const reserved = await redis.exists(`reservation:${item.id}`);
    scooters.push({ ...item, reserved: Boolean(reserved) });
  }
  res.json(scooters);
});

app.post('/scooters/reserve', async (req, res) => {
  const { id, userId } = req.body;
  if (!id || !userId) return res.status(400).json({ error: 'id and userId required' });
  const data = await redis.get(id);
  if (!data) return res.status(404).json({ error: 'Scooter not found' });
  const reserved = await redis.exists(`reservation:${id}`);
  if (reserved) return res.status(409).json({ error: 'Scooter already reserved' });
  await redis.set(`reservation:${id}`, userId, { EX: 300 });
  return res.json({ status: 'reserved', id, expiresInSeconds: 300 });
});

app.post('/scooters/unlock', async (req, res) => {
  const { id, code } = req.body;
  if (!id || !code) return res.status(400).json({ error: 'id and code required' });
  const reserved = await redis.exists(`reservation:${id}`);
  if (!reserved) return res.status(400).json({ error: 'Scooter is not reserved' });
  if (code !== '1234') return res.status(403).json({ error: 'Invalid unlock code' });
  await redis.del(`reservation:${id}`);
  return res.json({ status: 'unlocked', id });
});

app.post('/scooters/report-damage', async (req, res) => {
  const { id, description } = req.body;
  if (!id || !description) return res.status(400).json({ error: 'id and description required' });
  await redis.set(`damage:${id}`, JSON.stringify({ description, reportedAt: new Date().toISOString() }));
  return res.json({ status: 'damage reported', id });
});

app.listen(3005, () => console.log('Micromobility service running on port 3005'));
