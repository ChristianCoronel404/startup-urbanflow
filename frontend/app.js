const API = {
  routing: 'http://localhost:3001',
  tracking: 'http://localhost:3002',
  payment: 'http://localhost:3003',
  traffic: 'http://localhost:3004',
  micro: 'http://localhost:3005',
  congestion: 'http://localhost:3006',
  notification: 'http://localhost:3007',
  audit: 'http://localhost:3009'
};

const map = L.map('map').setView([4.605, -74.075], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);

function renderItems(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map((item) => `<div class="item"><pre>${JSON.stringify(item, null, 2)}</pre></div>`).join('');
}

async function searchRoutes() {
  const origin = document.getElementById('origin').value;
  const dest = document.getElementById('dest').value;
  const res = await fetch(`${API.routing}/routes?origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}`);
  const data = await res.json();
  renderItems('routes', data);
}

async function checkArrival() {
  const stopId = document.getElementById('stopId').value;
  const res = await fetch(`${API.tracking}/arrivals?stopId=${stopId}`);
  const data = await res.json();
  renderItems('arrival', [data]);
}

async function payTrip() {
  const cardId = document.getElementById('cardId').value;
  const amount = Number(document.getElementById('amount').value);
  const modes = document.getElementById('modes').value.split(',').map((m) => m.trim()).filter(Boolean);
  const res = await fetch(`${API.payment}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, amount, modes })
  });
  const data = await res.json();
  renderItems('paymentResult', [data]);
}

async function sendTraffic() {
  const busId = document.getElementById('busId').value;
  const delaySeconds = Number(document.getElementById('delaySeconds').value);
  const res = await fetch(`${API.traffic}/traffic/priority`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ busId, delaySeconds })
  });
  const data = await res.json();
  renderItems('trafficResult', [data]);
}

async function loadScooters() {
  const res = await fetch(`${API.micro}/scooters/available`);
  const data = await res.json();
  const container = document.getElementById('scooterList');
  container.innerHTML = data.map((item) => `
    <div class="item">
      <strong>${item.id}</strong> - ${item.status} - reserved: ${item.reserved}<br>
      <button onclick="reserveScooter('${item.id}')">Reservar</button>
      <button onclick="unlockScooter('${item.id}')">Desbloquear</button>
      <button onclick="reportDamage('${item.id}')">Reportar daño</button>
    </div>
  `).join('');
}

window.reserveScooter = async (id) => {
  const res = await fetch(`${API.micro}/scooters/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, userId: 'ciudadano1' })
  });
  const data = await res.json();
  renderItems('scooterList', [{ id, ...data }]);
};

window.unlockScooter = async (id) => {
  const res = await fetch(`${API.micro}/scooters/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, code: '1234' })
  });
  const data = await res.json();
  renderItems('scooterList', [{ id, ...data }]);
};

window.reportDamage = async (id) => {
  const res = await fetch(`${API.micro}/scooters/report-damage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, description: 'Rueda pinchada' })
  });
  const data = await res.json();
  renderItems('scooterList', [{ id, ...data }]);
};

async function predictCongestion() {
  const res = await fetch(`${API.congestion}/predict`);
  const data = await res.json();
  renderItems('congestionResult', [data]);
}

async function rerouteBus() {
  const res = await fetch(`${API.congestion}/reroute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ routeId: 'Corredor Norte', reason: 'Autore-envío por congestión' })
  });
  const data = await res.json();
  renderItems('rerouteResult', [data]);
}

async function loadAudit() {
  const res = await fetch(`${API.audit}/audit`);
  const data = await res.json();
  renderItems('auditList', data);
}

async function initNotifications() {
  const eventSource = new EventSource(`${API.notification}/events`);
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const container = document.getElementById('notifications');
    const entry = document.createElement('div');
    entry.className = 'item';
    entry.textContent = `${data.timestamp} ${data.topic}: ${JSON.stringify(data.payload)}`;
    container.prepend(entry);
  };
}

window.addEventListener('load', () => {
  document.getElementById('searchRoutes').addEventListener('click', searchRoutes);
  document.getElementById('checkArrival').addEventListener('click', checkArrival);
  document.getElementById('payTrip').addEventListener('click', payTrip);
  document.getElementById('sendTraffic').addEventListener('click', sendTraffic);
  document.getElementById('loadScooters').addEventListener('click', loadScooters);
  document.getElementById('predictCongestion').addEventListener('click', predictCongestion);
  document.getElementById('rerouteBus').addEventListener('click', rerouteBus);
  document.getElementById('loadAudit').addEventListener('click', loadAudit);
  initNotifications();
});
