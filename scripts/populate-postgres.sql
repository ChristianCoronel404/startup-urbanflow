CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tarjetas (
  id TEXT PRIMARY KEY,
  user_id INT REFERENCES usuarios(id),
  balance NUMERIC DEFAULT 100.00
);

CREATE TABLE IF NOT EXISTS viajes (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES usuarios(id),
  card_id TEXT REFERENCES tarjetas(id),
  amount NUMERIC,
  discount NUMERIC,
  modes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO usuarios (username, full_name) VALUES
  ('ciudadano1', 'Ciudadano Uno')
ON CONFLICT DO NOTHING;

INSERT INTO tarjetas (id, user_id, balance) VALUES
  ('card-1234', 1, 200.00)
ON CONFLICT DO NOTHING;
