import * as FileSystem from "expo-file-system/legacy";
import { addTripPointsBatch } from "../../db/trips";

const BUFFER_FILE = `${FileSystem.documentDirectory}location-buffer.jsonl`;

export async function flushLocationBufferToDb(tripId: string): Promise<number> {
  const fileInfo = await FileSystem.getInfoAsync(BUFFER_FILE);
  if (!fileInfo.exists) return 0;

  const content = await FileSystem.readAsStringAsync(BUFFER_FILE);
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    await FileSystem.deleteAsync(BUFFER_FILE, { idempotent: true });
    return 0;
  }

  const points = lines.map((line) => JSON.parse(line));
  await addTripPointsBatch(tripId, points);

  // Clear the buffer now that it's persisted to SQLite
  await FileSystem.deleteAsync(BUFFER_FILE, { idempotent: true });

  return points.length;
}