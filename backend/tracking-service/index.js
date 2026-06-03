const express = require('express');
const { Kafka } = require('kafkajs');
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

const kafka = new Kafka({ brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')] });
const consumer = kafka.consumer({ groupId: 'tracking-service-group' });

const stopRoutes = {
  stopA: 'Corredor Norte',
  stopB: 'Corredor Sur',
  stopC: 'Corredor Este',
  stopD: 'Corredor Oeste'
};

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'gps.vehicles', fromBeginning: true });
  await consumer.subscribe({ topic: 'reroute.needed', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const value = JSON.parse(message.value.toString());
      if (topic === 'gps.vehicles') {
        await redis.set(`vehicle:${value.vehicleId}`, JSON.stringify(value));
        await redis.set(`route:${value.routeId}:last`, JSON.stringify(value));
      }
      if (topic === 'reroute.needed') {
        await redis.set('reroute:last', JSON.stringify({ ...value, receivedAt: new Date().toISOString() }));
      }
    }
  });
}

app.get('/arrivals', async (req, res) => {
  const { stopId } = req.query;
  if (!stopId) return res.status(400).json({ error: 'stopId required' });
  const routeId = stopRoutes[stopId] || 'Corredor Norte';
  const vehicles = [];
  for await (const key of redis.scanIterator({ MATCH: 'vehicle:*' })) {
    const payload = await redis.get(key);
    if (!payload) continue;
    const vehicle = JSON.parse(payload);
    if (vehicle.routeId === routeId) vehicles.push(vehicle);
  }
  if (!vehicles.length) {
    return res.json({ stopId, routeId, nextArrivalMinutes: 8, note: 'Datos de GPS en actualización' });
  }
  const next = vehicles
    .map((vehicle) => ({
      vehicleId: vehicle.vehicleId,
      nextArrivalMinutes: Math.max(1, Math.ceil((vehicle.delaySeconds || 0) / 60) + Math.floor(Math.random() * 7) + 2),
      routeId: vehicle.routeId
    }))
    .sort((a, b) => a.nextArrivalMinutes - b.nextArrivalMinutes)[0];
  res.json({ stopId, routeId, ...next });
});

app.get('/reroute-status', async (req, res) => {
  const data = await redis.get('reroute:last');
  res.json(data ? JSON.parse(data) : { status: 'none' });
});

startConsumer().catch(console.error);
app.listen(3002, () => console.log('Tracking service running on port 3002'));
