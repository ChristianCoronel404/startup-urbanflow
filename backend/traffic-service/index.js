const express = require('express');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  next();
});

app.post('/traffic/priority', (req, res) => {
  const { busId, delaySeconds } = req.body;
  if (!busId || typeof delaySeconds !== 'number') {
    return res.status(400).json({ error: 'busId and delaySeconds required' });
  }
  const granted = delaySeconds > 300;
  console.log(`NTCIP mock: busId=${busId} delaySeconds=${delaySeconds} priority=${granted}`);
  return res.json({ status: granted ? 'Prioridad concedida' : 'No prioridad concedida' });
});

app.listen(3004, () => console.log('Traffic service running on port 3004'));
