import { create } from "zustand";
import { getSetting, setSetting } from "../db/settings";

export type UnitSystem = "metric" | "imperial";

type SettingsState = {
  units: UnitSystem;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  setUnits: (units: UnitSystem) => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  units: "metric",
  isLoaded: false,

  loadSettings: async () => {
    const stored = await getSetting("units");
    set({
      units: stored === "imperial" ? "imperial" : "metric",
      isLoaded: true,
    });
  },

  setUnits: async (units) => {
    await setSetting("units", units);
    set({ units });
  },
}));