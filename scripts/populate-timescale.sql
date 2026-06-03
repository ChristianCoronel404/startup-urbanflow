CREATE EXTENSION IF NOT EXISTS timescaledb;

DROP TABLE IF EXISTS traffic_history;

CREATE TABLE traffic_history (
  id SERIAL,
  corridor TEXT NOT NULL,
  hour INT NOT NULL,
  avg_speed NUMERIC NOT NULL,
  occupancy NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

SELECT create_hypertable('traffic_history', 'created_at', if_not_exists => TRUE);

INSERT INTO traffic_history (corridor, hour, avg_speed, occupancy, created_at)
VALUES
  ('Corredor Norte', 8, 35, 0.8, now() - interval '1 day'),
  ('Corredor Norte', 9, 32, 0.75, now() - interval '1 day'),
  ('Corredor Norte', 17, 28, 0.9, now() - interval '1 day'),
  ('Corredor Sur', 8, 40, 0.5, now() - interval '1 day'),
  ('Corredor Sur', 18, 30, 0.85, now() - interval '1 day'),
  ('Corredor Este', 12, 45, 0.4, now() - interval '1 day'),
  ('Corredor Oeste', 17, 20, 0.95, now() - interval '1 day');
