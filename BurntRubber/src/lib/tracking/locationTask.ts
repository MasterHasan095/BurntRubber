import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";

export const LOCATION_TASK_NAME = "burnt-rubber-location-tracking";

const BUFFER_FILE = `${FileSystem.documentDirectory}location-buffer.jsonl`;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Location task error:", error);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  try {
    const lines = locations
      .map((loc) =>
        JSON.stringify({
          timestamp: new Date(loc.timestamp).toISOString(),
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          speedMps: loc.coords.speed ?? null,
          heading: loc.coords.heading ?? null,
          accuracy: loc.coords.accuracy ?? null,
        }),
      )
      .join("\n") + "\n";

    const fileInfo = await FileSystem.getInfoAsync(BUFFER_FILE);
    if (fileInfo.exists) {
      // Append via read+rewrite, since expo-file-system has no native append
      const existing = await FileSystem.readAsStringAsync(BUFFER_FILE);
      await FileSystem.writeAsStringAsync(BUFFER_FILE, existing + lines);
    } else {
      await FileSystem.writeAsStringAsync(BUFFER_FILE, lines);
    }
  } catch (err) {
    console.error("Failed to buffer background location points:", err);
  }
});