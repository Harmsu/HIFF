const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS festivals (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name       TEXT NOT NULL,
      year       INTEGER NOT NULL,
      start_date TEXT,
      end_date   TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS theaters (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name       TEXT NOT NULL,
      location   TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS events (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      festival_id      UUID NOT NULL REFERENCES festivals(id) ON DELETE CASCADE,
      type             TEXT NOT NULL CHECK (type IN ('elokuva', 'ravintola', 'muu')),
      date             TEXT NOT NULL,
      name             TEXT NOT NULL,
      link             TEXT NOT NULL DEFAULT '',
      theater_id       UUID REFERENCES theaters(id) ON DELETE SET NULL,
      start_time       TEXT NOT NULL,
      end_time         TEXT NOT NULL,
      duration_minutes INTEGER,
      highlight        TEXT NOT NULL DEFAULT '',
      note             TEXT NOT NULL DEFAULT '',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_events_festival ON events(festival_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
  `);

  await seedAdmin();
}

async function seedAdmin() {
  const { rows } = await pool.query("SELECT value FROM config WHERE key='password_hash'");
  if (rows.length === 0 && process.env.ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await pool.query(
      "INSERT INTO config (key, value) VALUES ('username', $1) ON CONFLICT (key) DO NOTHING",
      [process.env.ADMIN_USERNAME || 'admin']
    );
    await pool.query(
      "INSERT INTO config (key, value) VALUES ('password_hash', $1) ON CONFLICT (key) DO NOTHING",
      [hash]
    );
    if (process.env.ADMIN_EMAIL) {
      await pool.query(
        "INSERT INTO config (key, value) VALUES ('email', $1) ON CONFLICT (key) DO NOTHING",
        [process.env.ADMIN_EMAIL]
      );
    }
    console.log('Admin-käyttäjä luotu ympäristömuuttujista.');
  }
}

module.exports = { pool, initDB };
