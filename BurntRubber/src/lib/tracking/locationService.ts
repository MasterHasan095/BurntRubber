import * as Location from "expo-location";
import { LOCATION_TASK_NAME } from "./locationTask";
import { flushLocationBufferToDb } from "./locationBuffer";
import { getTripPoints } from "../../db/trips";
import { haversineDistance } from "./geo";

export type TrackingSummary = {
  distanceMeters: number;
  maxSpeedMps: number | null;
  avgSpeedMps: number | null;
};

class LocationTrackingService {
  async requestPermissions(): Promise<boolean> {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== "granted") return false;

    const bg = await Location.requestBackgroundPermissionsAsync();
    return bg.status === "granted";
  }

  async start(): Promise<void> {
    const granted = await this.requestPermissions();
    if (!granted) {
      throw new Error(
        "Location permission (foreground + background) not granted",
      );
    }

    const alreadyStarted =
      await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (alreadyStarted) return;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: 5,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Burnt Rubber is tracking your drive",
        notificationBody: "Recording trip in progress",
      },
      pausesUpdatesAutomatically: false,
    });
  }

  async stop(tripId: string): Promise<TrackingSummary> {
    const started =
      await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (started) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }

    // Flush any buffered points from the background task into SQLite now,
    // since we're back in the foreground JS context where SQLite works.
    const flushedCount = await flushLocationBufferToDb(tripId);
    console.log(`Flushed ${flushedCount} buffered points to DB`);

    const points = await getTripPoints(tripId);
    if (points.length === 0) {
      return { distanceMeters: 0, maxSpeedMps: null, avgSpeedMps: null };
    }

    let totalDistance = 0;
    const speeds: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.speed_mps != null && p.speed_mps >= 0) speeds.push(p.speed_mps);
      if (i > 0) {
        const prev = points[i - 1];
        totalDistance += haversineDistance(
          prev.latitude,
          prev.longitude,
          p.latitude,
          p.longitude,
        );
      }
    }

    return {
      distanceMeters: totalDistance,
      maxSpeedMps: speeds.length > 0 ? Math.max(...speeds) : null,
      avgSpeedMps:
        speeds.length > 0
          ? speeds.reduce((a, b) => a + b, 0) / speeds.length
          : null,
    };
  }
}

export const locationTrackingService = new LocationTrackingService();