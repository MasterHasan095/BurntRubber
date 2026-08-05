-- 001_init.sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,              -- null if OAuth-only
  provider      TEXT DEFAULT 'password', -- 'password' | 'apple' | 'google'
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE backup_blobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  storage_key   TEXT NOT NULL,      -- pointer to the object in R2/S3
  size_bytes    BIGINT,
  device_label  TEXT,               -- e.g. "iPhone 15" for migration UX
  created_at    TIMESTAMPTZ DEFAULT now()
);