import { create } from "zustand";
import {
  addTripPointsBatch,
  completeTrip,
  discardTrip,
  listTrips,
  startTrip,
  Trip,
} from "../db/trips";

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
      // No real GPS yet — stub summary values for now to test the layer
      await completeTrip(activeTrip.id, {
        distanceMeters: 0,
        durationSeconds: Math.round(
          (Date.now() - new Date(activeTrip.started_at).getTime()) / 1000,
        ),
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
      await discardTrip(activeTrip.id);
      set({ activeTrip: null });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },
}));