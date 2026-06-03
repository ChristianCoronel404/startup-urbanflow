# UrbanFlow Hackathon Repository

## Instrucciones de despliegue

1. Desde la raíz del repositorio, ejecutar:

```bash
docker-compose up -d
```

2. Esperar a que los contenedores arranquen y el clúster Kafka esté disponible.

3. Cargar los datos iniciales:

```bash
node scripts/populate-neo4j.js
psql "postgresql://urbanflow:urbanflow@localhost:5432/payments" -f scripts/populate-postgres.sql
psql "postgresql://urbanflow:urbanflow@localhost:5434/timescale" -f scripts/populate-timescale.sql
bash scripts/populate-redis.sh
```

> Si `psql` no está disponible, puede usar un cliente PostgreSQL o ejecutar `docker exec -i <container> psql ...`.

4. Inicializar el simulador de GPS con:

```bash
node scripts/simulate-gps.js
```

5. Abrir el frontend en:

```text
http://localhost:8080
```

## Servicios expuestos

- Frontend: `http://localhost:8080`
- Routing Service: `http://localhost:3001`
- Tracking Service: `http://localhost:3002`
- Payment Service: `http://localhost:3003`
- Traffic Service: `http://localhost:3004`
- Micromobility Service: `http://localhost:3005`
- Congestion Service: `http://localhost:3006`
- Notification Service: `http://localhost:3007`
- Analytics Service: `http://localhost:3008`
- Audit Service: `http://localhost:3009`

## Cómo probar cada MVP

### MVP 1: Rutas multimodales
- En el frontend, usar origen `Centro` y destino `Aeropuerto`.
- El servicio `routing-service` consulta Neo4j y devuelve al menos 2 opciones con tiempo, costo y CO₂.

### MVP 2: Llegada de buses en tiempo real
- Seleccionar `stopA` o `stopB` en la sección de llegada.
- El `tracking-service` usa los mensajes de Kafka `gps.vehicles` para calcular la próxima llegada.

### MVP 3: Pago con descuento por modos combinados
- Usar tarjeta `card-1234` en la sección de pago.
- Seleccionar modos `bus` y `scooter` para activar 20% de descuento.
- El pago se guarda en PostgreSQL y se envía un evento de auditoría.

### MVP 4: Re-enrutamiento y cambio de tarifa
- En la sección de congestión, presionar `Predecir congestión en 30 min`.
- Si hay congestión, usar `Re-enrutar bus automático`.
- El `congestion-service` publica evento Kafka `reroute.needed`.
- El `tracking-service` consume el evento, simula re-enrutamiento y el `audit-service` registra el evento.

## URLs para pruebas rápidas

- `GET http://localhost:3001/routes?origin=Centro&dest=Aeropuerto`
- `GET http://localhost:3002/arrivals?stopId=stopA`
- `POST http://localhost:3003/pay`
- `POST http://localhost:3004/traffic/priority`
- `GET http://localhost:3005/scooters/available`
- `GET http://localhost:3006/predict`
- `POST http://localhost:3006/reroute`
- `GET http://localhost:3009/audit`

## Datos de ejemplo

- Usuario fijo: `ciudadano1`
- Tarjeta válida: `card-1234`
- Scooters precargados: `scooter-1`, `scooter-2`, `scooter-3`.
- Tópicos Kafka usados: `gps.vehicles`, `reroute.needed`, `payment.events`.
