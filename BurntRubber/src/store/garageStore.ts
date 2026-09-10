import { create } from "zustand";
import { addVehicle, deleteVehicle, listVehicles, Vehicle } from "../db/vehicles";

type GarageState = {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  fetchVehicles: () => Promise<void>;
  createVehicle: (input: {
    make: string;
    model: string;
    year: number;
    nickname?: string | null;
  }) => Promise<void>;
  removeVehicle: (id: string) => Promise<void>;
};

export const useGarageStore = create<GarageState>((set, get) => ({
  vehicles: [],
  isLoading: false,
  error: null,

  fetchVehicles: async () => {
    set({ isLoading: true, error: null });
    try {
      const vehicles = await listVehicles();
      set({ vehicles, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  createVehicle: async (input) => {
    set({ error: null });
    try {
      await addVehicle(input);
      await get().fetchVehicles();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  removeVehicle: async (id) => {
    set({ error: null });
    try {
      await deleteVehicle(id);
      await get().fetchVehicles();
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },
}));