const express = require('express');
const { Pool } = require('pg');
const { Kafka } = require('kafkajs');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  next();
});

const pool = new Pool();
const auditUrl = process.env.AUDIT_URL || 'http://localhost:3009/audit';
const kafka = new Kafka({ brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')] });
const producer = kafka.producer();
producer.connect().catch(console.error);

app.post('/pay', async (req, res) => {
  const { cardId, amount, modes } = req.body;
  if (!cardId || !amount || !Array.isArray(modes)) {
    return res.status(400).json({ error: 'cardId, amount and modes are required' });
  }
  const client = await pool.connect();
  try {
    const discount = modes.length > 1 ? 0.2 : 0;
    const finalAmount = Number((amount * (1 - discount)).toFixed(2));
    await client.query('BEGIN');
    const cardRes = await client.query('SELECT * FROM tarjetas WHERE id=$1', [cardId]);
    if (!cardRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Card not found' });
    }
    await client.query(
      'INSERT INTO viajes (user_id, card_id, amount, discount, modes) VALUES ($1, $2, $3, $4, $5)',
      [1, cardId, finalAmount, discount, modes.join(',')]
    );
    await client.query('UPDATE tarjetas SET balance = balance - $1 WHERE id=$2', [finalAmount, cardId]);
    await client.query('COMMIT');
    await fetch(auditUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'payment', payload: { cardId, amount, finalAmount, modes, discount } })
    });
    await producer.send({
      topic: 'payment.events',
      messages: [{ value: JSON.stringify({ cardId, amount: finalAmount, modes, discount, timestamp: new Date().toISOString() }) }]
    });
    return res.json({ status: 'success', finalAmount, discount });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.listen(3003, () => console.log('Payment service running on port 3003'));
