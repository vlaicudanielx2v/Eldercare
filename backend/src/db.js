// Conexiunea la baza de date SQLite si crearea tabelelor.
// In teste se foloseste o baza de date in memorie (DB_FILE=':memory:').
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const file = process.env.DB_FILE || path.join(__dirname, '..', 'eldercare.db');
const db = new Database(file);
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('elder','caregiver','admin')),
  caregiver_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  blocked         INTEGER NOT NULL DEFAULT 0,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS medications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  elder_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  dose        TEXT NOT NULL,
  times       TEXT NOT NULL,          -- ex: "08:00,20:00"
  start_date  TEXT NOT NULL,          -- YYYY-MM-DD
  end_date    TEXT                    -- YYYY-MM-DD sau NULL (fara sfarsit)
);

CREATE TABLE IF NOT EXISTS doses (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id  INTEGER NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  elder_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheduled_at   TEXT NOT NULL,       -- YYYY-MM-DDTHH:MM (ora locala)
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','taken','missed')),
  taken_at       TEXT,
  UNIQUE (medication_id, scheduled_at)
);

CREATE TABLE IF NOT EXISTS alerts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  elder_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  caregiver_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('missed','sos')),
  message       TEXT NOT NULL,
  is_read       INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);
`);

// Contul de administrator implicit
const admin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get();
if (!admin) {
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run('Administrator', 'admin@eldercare.ro', bcrypt.hashSync('admin123', 10), 'admin');
}

module.exports = db;
