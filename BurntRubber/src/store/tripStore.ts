import { create } from "zustand";
import {
  addTripPointsBatch,
  completeTrip,
  discardTrip,
  listTrips,
  startTrip,
  Trip,
} from "../db/trips";
import { locationTrackingService } from "../lib/tracking/locationService";

type TripState = {
  activeTrip: Trip | null;
  trips: Trip[];
  isLoading: boolean;
  error: string | null;

  fetchTrips: () => Promise<void>;
  beginTrip: (vehicleId: string) => Promise<void>;
  endTrip: () => Promise<void>;
  cancelActiveTrip: () => Promise<void>;
};

export const useTripStore = create<TripState>((set, get) => ({
  activeTrip: null,
  trips: [],
  isLoading: false,
  error: null,

  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const trips = await listTrips("completed");
      set({ trips, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  beginTrip: async (vehicleId) => {
  set({ error: null });
  try {
    const trip = await startTrip(vehicleId);
    await locationTrackingService.start(); // no tripId arg now — task reads from DB
    set({ activeTrip: trip });
  } catch (err) {
    set({ error: (err as Error).message });
    throw err;
  }
},

endTrip: async () => {
  const { activeTrip } = get();
  if (!activeTrip) return;

  set({ error: null });
  try {
    const summary = await locationTrackingService.stop(activeTrip.id);
    const durationSeconds = Math.round(
      (Date.now() - new Date(activeTrip.started_at).getTime()) / 1000,
    );

    await completeTrip(activeTrip.id, {
      distanceMeters: summary.distanceMeters,
      durationSeconds,
      maxSpeedMps: summary.maxSpeedMps,
      avgSpeedMps: summary.avgSpeedMps,
    });

    set({ activeTrip: null });
    await get().fetchTrips();
  } catch (err) {
    set({ error: (err as Error).message });
    throw err;
  }
},

  cancelActiveTrip: async () => {
    const { activeTrip } = get();
    if (!activeTrip) return;

    try {
      await locationTrackingService.stop();
      await discardTrip(activeTrip.id);
      set({ activeTrip: null });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },
}));