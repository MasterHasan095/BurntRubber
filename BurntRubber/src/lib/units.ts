import { UnitSystem } from "../store/settingsStore";

const MPS_TO_MPH = 2.23694;
const MPS_TO_KMH = 3.6;
const METERS_TO_MILES = 1 / 1609.34;
const METERS_TO_KM = 1 / 1000;

export function formatDistance(meters: number, units: UnitSystem): string {
  const value =
    units === "imperial" ? meters * METERS_TO_MILES : meters * METERS_TO_KM;
  return value.toFixed(1);
}

export function distanceUnitLabel(units: UnitSystem): string {
  return units === "imperial" ? "mi" : "km";
}

export function formatSpeed(
  mps: number | null,
  units: UnitSystem,
): string {
  if (mps == null) return "--";
  const value = units === "imperial" ? mps * MPS_TO_MPH : mps * MPS_TO_KMH;
  return value.toFixed(0);
}

export function speedUnitLabel(units: UnitSystem): string {
  return units === "imperial" ? "mph" : "km/h";
}