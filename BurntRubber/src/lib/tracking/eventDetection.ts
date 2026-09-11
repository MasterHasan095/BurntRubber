import { TripPoint } from "../../db/trips";
import { TripEventType } from "../../db/tripEvents";

// Thresholds — tunable based on real-world testing
const HARD_BRAKE_THRESHOLD_MPS2 = -3.0; // deceleration (negative = slowing down)
const HARD_ACCEL_THRESHOLD_MPS2 = 3.0; // acceleration
const SHARP_TURN_THRESHOLD_DEG_PER_SEC = 25; // heading change rate
const MIN_SPEED_FOR_TURN_DETECTION_MPS = 3; // ~7 mph — ignore parking-lot maneuvers

export type DetectedEvent = {
  type: TripEventType;
  timestamp: string;
  latitude: number;
  longitude: number;
  severity: number;
};

function headingDelta(a: number, b: number): number {
  // Shortest angular distance between two headings (0-360 wraparound safe)
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function detectEvents(points: TripPoint[]): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  if (points.length < 2) return events;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    const t1 = new Date(prev.timestamp).getTime();
    const t2 = new Date(curr.timestamp).getTime();
    const dtSeconds = (t2 - t1) / 1000;
    if (dtSeconds <= 0) continue;

    // --- Hard brake / hard acceleration ---
    if (prev.speed_mps != null && curr.speed_mps != null) {
      const speedDelta = curr.speed_mps - prev.speed_mps;
      const acceleration = speedDelta / dtSeconds;

      if (acceleration <= HARD_BRAKE_THRESHOLD_MPS2) {
        events.push({
          type: "hard_brake",
          timestamp: curr.timestamp,
          latitude: curr.latitude,
          longitude: curr.longitude,
          severity: Math.abs(acceleration),
        });
      } else if (acceleration >= HARD_ACCEL_THRESHOLD_MPS2) {
        events.push({
          type: "hard_accel",
          timestamp: curr.timestamp,
          latitude: curr.latitude,
          longitude: curr.longitude,
          severity: acceleration,
        });
      }
    }

    // --- Sharp turn ---
    if (
      prev.heading != null &&
      curr.heading != null &&
      curr.speed_mps != null &&
      curr.speed_mps >= MIN_SPEED_FOR_TURN_DETECTION_MPS
    ) {
      const delta = headingDelta(prev.heading, curr.heading);
      const turnRate = delta / dtSeconds; // degrees per second

      if (turnRate >= SHARP_TURN_THRESHOLD_DEG_PER_SEC) {
        events.push({
          type: "sharp_turn",
          timestamp: curr.timestamp,
          latitude: curr.latitude,
          longitude: curr.longitude,
          severity: turnRate,
        });
      }
    }
  }

  return events;
}