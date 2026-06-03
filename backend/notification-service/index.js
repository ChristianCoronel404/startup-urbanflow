const express = require('express');
const { Kafka } = require('kafkajs');
const app = express();
const clients = [];

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  next();
});

const kafka = new Kafka({ brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')] });
const consumer = kafka.consumer({ groupId: 'notification-service-group' });
const notifications = [];

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'gps.vehicles', fromBeginning: true });
  await consumer.subscribe({ topic: 'reroute.needed', fromBeginning: true });
  await consumer.subscribe({ topic: 'payment.events', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payload = JSON.parse(message.value.toString());
      const note = { topic, payload, timestamp: new Date().toISOString() };
      notifications.unshift(note);
      clients.forEach((res) => res.write(`data: ${JSON.stringify(note)}\n\n`));
    }
  });
}

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  clients.push(res);
  req.on('close', () => {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
  });
});

app.get('/notifications', (req, res) => {
  res.json(notifications.slice(0, 20));
});

startConsumer().catch(console.error);
app.listen(3007, () => console.log('Notification service running on port 3007'));
