import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { getDb } from "../../db";
import { addTripPointsBatch } from "../../db/trips";

export const LOCATION_TASK_NAME = "burnt-rubber-location-tracking";

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Location task error:", error);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  try {
    const db = await getDb();
    const activeTrip = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM trips WHERE status = 'in_progress' LIMIT 1",
    );
    if (!activeTrip) return; // no active trip — ignore stray updates

    const points = locations.map((loc) => ({
      timestamp: new Date(loc.timestamp).toISOString(),
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      speedMps: loc.coords.speed ?? null,
      heading: loc.coords.heading ?? null,
      accuracy: loc.coords.accuracy ?? null,
    }));

    await addTripPointsBatch(activeTrip.id, points);
  } catch (err) {
    console.error("Failed to persist background location points:", err);
  }
});