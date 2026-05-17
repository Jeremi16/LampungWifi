CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS places (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  wifi_available BOOLEAN NOT NULL DEFAULT FALSE,
  wifi_access_type TEXT,
  wifi_password TEXT,
  password_source TEXT,
  access_notes TEXT,
  wifi_speed_mbps NUMERIC(8, 2),
  upload_mbps NUMERIC(8, 2),
  ping_ms INTEGER,
  has_power_outlets BOOLEAN NOT NULL DEFAULT FALSE,
  open_24_hours BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_zone BOOLEAN NOT NULL DEFAULT FALSE,
  ambience_label TEXT,
  map_context TEXT,
  operating_hours TEXT,
  image_tone TEXT NOT NULL DEFAULT 'lagoon',
  image_url TEXT,
  submitter_name TEXT,
  submitter_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT places_status_check CHECK (status IN ('approved', 'pending', 'rejected')),
  CONSTRAINT places_password_source_check CHECK (
    wifi_password IS NULL OR CHAR_LENGTH(TRIM(COALESCE(password_source, ''))) > 0
  )
);

CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_search ON places USING GIN (
  to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(address, '') || ' ' || COALESCE(district, '') || ' ' || COALESCE(category, ''))
);

ALTER TABLE places ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  review_title TEXT NOT NULL DEFAULT 'Ulasan pengunjung',
  rating_speed INTEGER NOT NULL CHECK (rating_speed BETWEEN 1 AND 5),
  rating_comfort INTEGER NOT NULL CHECK (rating_comfort BETWEEN 1 AND 5),
  image_url TEXT,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS place_metrics AS
SELECT
  p.id AS place_id,
  COALESCE(AVG(r.rating_speed), 0)::numeric(10, 2) AS avg_speed_rating,
  COALESCE(AVG(r.rating_comfort), 0)::numeric(10, 2) AS avg_comfort_rating,
  COALESCE(AVG((r.rating_speed + r.rating_comfort) / 2.0), 0)::numeric(10, 2) AS avg_rating,
  COUNT(r.id)::int AS review_count
FROM places p
LEFT JOIN reviews r ON r.place_id = p.id
GROUP BY p.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_place_metrics_place_id ON place_metrics(place_id);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_title TEXT NOT NULL DEFAULT 'Ulasan pengunjung';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS author_email TEXT;
