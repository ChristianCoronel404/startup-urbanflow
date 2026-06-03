const { Kafka } = require('kafkajs');
const broker = process.env.KAFKA_BROKER || 'localhost:9092';
const kafka = new Kafka({ brokers: [broker] });
const producer = kafka.producer();
const vehicles = [
  { vehicleId: 'bus-1', routeId: 'Corredor Norte', lat: 4.600, lng: -74.080 },
  { vehicleId: 'bus-2', routeId: 'Corredor Sur', lat: 4.610, lng: -74.070 }
];

async function run() {
  await producer.connect();
  console.log('Simulador GPS conectado a Kafka', broker);
  setInterval(async () => {
    for (const vehicle of vehicles) {
      vehicle.lat += (Math.random() - 0.5) * 0.001;
      vehicle.lng += (Math.random() - 0.5) * 0.001;
      const delaySeconds = Math.random() > 0.8 ? 400 : Math.floor(Math.random() * 120);
      const message = {
        vehicleId: vehicle.vehicleId,
        lat: Number(vehicle.lat.toFixed(6)),
        lng: Number(vehicle.lng.toFixed(6)),
        timestamp: new Date().toISOString(),
        routeId: vehicle.routeId,
        delaySeconds
      };
      await producer.send({
        topic: 'gps.vehicles',
        messages: [{ value: JSON.stringify(message) }]
      });
      console.log('Publicado GPS', message);
    }
  }, 2000);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});