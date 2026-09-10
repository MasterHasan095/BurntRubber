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
  const db = await getDb();

  await db.withTransactionAsync(async () => {
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
}

export async function getTripPoints(tripId: string): Promise<TripPoint[]> {
  const db = await getDb();
  return db.getAllAsync<TripPoint>(
    "SELECT * FROM trip_points WHERE trip_id = ? ORDER BY timestamp ASC",
    tripId,
  );
}