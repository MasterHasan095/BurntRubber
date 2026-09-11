import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("burntrubber.db");
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      nickname TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY NOT NULL,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      distance_meters REAL NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      max_speed_mps REAL,
      avg_speed_mps REAL,
      status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'discarded'
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trip_points (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed_mps REAL,
      heading REAL,
      accuracy REAL
    );

    CREATE TABLE IF NOT EXISTS trip_events (
      id TEXT PRIMARY KEY NOT NULL,
      trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- 'hard_brake' | 'hard_accel' | 'sharp_turn' | etc.
      timestamp TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      severity REAL,
      raw_data TEXT -- JSON blob of raw sensor readings around the event, optional
    );


    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_trip_points_trip_id ON trip_points(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_events_trip_id ON trip_events(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
  `);
}