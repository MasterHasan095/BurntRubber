import * as Crypto from "expo-crypto";
import { getDb } from "./index";

export type TripEventType = "hard_brake" | "hard_accel" | "sharp_turn";

export type TripEvent = {
  id: string;
  trip_id: string;
  type: TripEventType;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  severity: number | null;
  raw_data: string | null;
};

export async function addTripEvents(
  tripId: string,
  events: {
    type: TripEventType;
    timestamp: string;
    latitude?: number | null;
    longitude?: number | null;
    severity?: number | null;
    rawData?: Record<string, unknown> | null;
  }[],
): Promise<void> {
  if (events.length === 0) return;
  const db = await getDb();

  for (const event of events) {
    const id = Crypto.randomUUID();
    await db.runAsync(
      `INSERT INTO trip_events
       (id, trip_id, type, timestamp, latitude, longitude, severity, raw_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      tripId,
      event.type,
      event.timestamp,
      event.latitude ?? null,
      event.longitude ?? null,
      event.severity ?? null,
      event.rawData ? JSON.stringify(event.rawData) : null,
    );
  }
}

export async function getTripEvents(tripId: string): Promise<TripEvent[]> {
  const db = await getDb();
  return db.getAllAsync<TripEvent>(
    "SELECT * FROM trip_events WHERE trip_id = ? ORDER BY timestamp ASC",
    tripId,
  );
}