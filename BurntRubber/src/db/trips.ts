import * as Crypto from "expo-crypto";
import { getDb } from "./index";

export type TripStatus = "in_progress" | "completed" | "discarded";

export type Trip = {
  id: string;
  vehicle_id: string;
  started_at: string;
  ended_at: string | null;
  distance_meters: number;
  duration_seconds: number;
  max_speed_mps: number | null;
  avg_speed_mps: number | null;
  status: TripStatus;
  created_at: string;
};

export type TripPoint = {
  id: string;
  trip_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_mps: number | null;
  heading: number | null;
  accuracy: number | null;
};

// ---- Trips ----

export async function startTrip(vehicleId: string): Promise<Trip> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const startedAt = new Date().toISOString();

  await db.runAsync(
    "INSERT INTO trips (id, vehicle_id, started_at, status) VALUES (?, ?, ?, 'in_progress')",
    id,
    vehicleId,
    startedAt,
  );

  const trip = await db.getFirstAsync<Trip>(
    "SELECT * FROM trips WHERE id = ?",
    id,
  );
  if (!trip) throw new Error("Failed to fetch newly created trip");
  return trip;
}

export async function completeTrip(
  tripId: string,
  summary: {
    distanceMeters: number;
    durationSeconds: number;
    maxSpeedMps?: number | null;
    avgSpeedMps?: number | null;
  },
): Promise<Trip> {
  const db = await getDb();
  const endedAt = new Date().toISOString();

  await db.runAsync(
    `UPDATE trips
     SET ended_at = ?, distance_meters = ?, duration_seconds = ?,
         max_speed_mps = ?, avg_speed_mps = ?, status = 'completed'
     WHERE id = ?`,
    endedAt,
    summary.distanceMeters,
    summary.durationSeconds,
    summary.maxSpeedMps ?? null,
    summary.avgSpeedMps ?? null,
    tripId,
  );

  const trip = await db.getFirstAsync<Trip>(
    "SELECT * FROM trips WHERE id = ?",
    tripId,
  );
  if (!trip) throw new Error("Trip not found after completion");
  return trip;
}

export async function discardTrip(tripId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "UPDATE trips SET status = 'discarded' WHERE id = ?",
    tripId,
  );
}

export async function listTrips(status?: TripStatus): Promise<Trip[]> {
  const db = await getDb();
  if (status) {
    return db.getAllAsync<Trip>(
      "SELECT * FROM trips WHERE status = ? ORDER BY started_at DESC",
      status,
    );
  }
  return db.getAllAsync<Trip>(
    "SELECT * FROM trips ORDER BY started_at DESC",
  );
}

export async function getTrip(tripId: string): Promise<Trip | null> {
  const db = await getDb();
  return db.getFirstAsync<Trip>("SELECT * FROM trips WHERE id = ?", tripId);
}

export async function deleteTrip(tripId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM trips WHERE id = ?", tripId);
}

// ---- Trip points ----

export async function addTripPoint(
  tripId: string,
  point: {
    timestamp: string;
    latitude: number;
    longitude: number;
    speedMps?: number | null;
    heading?: number | null;
    accuracy?: number | null;
  },
): Promise<void> {
  const db = await getDb();
  const id = Crypto.randomUUID();

  await db.runAsync(
    `INSERT INTO trip_points
     (id, trip_id, timestamp, latitude, longitude, speed_mps, heading, accuracy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    tripId,
    point.timestamp,
    point.latitude,
    point.longitude,
    point.speedMps ?? null,
    point.heading ?? null,
    point.accuracy ?? null,
  );
}

// Batched insert — used when flushing a buffer of points at once
// src/db/trips.ts

let writeLock: Promise<void> = Promise.resolve();

export async function addTripPointsBatch(
  tripId: string,
  points: {
    timestamp: string;
    latitude: number;
    longitude: number;
    speedMps?: number | null;
    heading?: number | null;
    accuracy?: number | null;
  }[],
): Promise<void> {
  if (points.length === 0) return;

  // Chain onto the existing lock so writes never overlap/nest
  const run = writeLock.then(async () => {
    const db = await getDb();
    for (const point of points) {
      const id = Crypto.randomUUID();
      await db.runAsync(
        `INSERT INTO trip_points
         (id, trip_id, timestamp, latitude, longitude, speed_mps, heading, accuracy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        tripId,
        point.timestamp,
        point.latitude,
        point.longitude,
        point.speedMps ?? null,
        point.heading ?? null,
        point.accuracy ?? null,
      );
    }
  });

  writeLock = run.catch(() => {}); // keep the chain alive even if this batch errors
  return run;
}

export async function getTripPoints(tripId: string): Promise<TripPoint[]> {
  const db = await getDb();
  return db.getAllAsync<TripPoint>(
    "SELECT * FROM trip_points WHERE trip_id = ? ORDER BY timestamp ASC",
    tripId,
  );
}

export type TripStats = {
  totalTrips: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalHardBrakes: number;
  totalHardAccels: number;
  totalSharpTurns: number;
};

export async function getOverallStats(): Promise<TripStats> {
  const db = await getDb();

  const tripSummary = await db.getFirstAsync<{
    totalTrips: number;
    totalDistanceMeters: number;
    totalDurationSeconds: number;
  }>(
    `SELECT
       COUNT(*) as totalTrips,
       COALESCE(SUM(distance_meters), 0) as totalDistanceMeters,
       COALESCE(SUM(duration_seconds), 0) as totalDurationSeconds
     FROM trips
     WHERE status = 'completed'`,
  );

  const eventSummary = await db.getFirstAsync<{
    totalHardBrakes: number;
    totalHardAccels: number;
    totalSharpTurns: number;
  }>(
    `SELECT
       COUNT(CASE WHEN type = 'hard_brake' THEN 1 END) as totalHardBrakes,
       COUNT(CASE WHEN type = 'hard_accel' THEN 1 END) as totalHardAccels,
       COUNT(CASE WHEN type = 'sharp_turn' THEN 1 END) as totalSharpTurns
     FROM trip_events
     WHERE trip_id IN (SELECT id FROM trips WHERE status = 'completed')`,
  );

  return {
    totalTrips: tripSummary?.totalTrips ?? 0,
    totalDistanceMeters: tripSummary?.totalDistanceMeters ?? 0,
    totalDurationSeconds: tripSummary?.totalDurationSeconds ?? 0,
    totalHardBrakes: eventSummary?.totalHardBrakes ?? 0,
    totalHardAccels: eventSummary?.totalHardAccels ?? 0,
    totalSharpTurns: eventSummary?.totalSharpTurns ?? 0,
  };
}

export async function getMostRecentTrip(): Promise<Trip | null> {
  const db = await getDb();
  return db.getFirstAsync<Trip>(
    "SELECT * FROM trips WHERE status = 'completed' ORDER BY started_at DESC LIMIT 1",
  );
}