import { create } from "zustand";
import { api, ApiError } from "../lib/apiClient";
import { clearToken, getToken, saveToken } from "../lib/tokenStorage";

interface User {
  id: string;
  email: string;
  provider?: string;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean; // true while checking for a stored token on app boot
  error: string | null;

  initialize: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitializing: true,
  error: null,

  // Call this once on app boot to restore session from stored token
  initialize: async () => {
    const token = await getToken();
    if (!token) {
      set({ isInitializing: false });
      return;
    }
    try {
      await get().fetchMe();
    } catch {
      await clearToken();
    } finally {
      set({ isInitializing: false });
    }
  },

  signup: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post<{ token: string; user: User }>(
        "/signup",
        { email, password },
        { auth: false },
      );
      await saveToken(data.token);
      set({ user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // /login only returns { token }, not the user — fetch profile separately
      const data = await api.post<{ token: string }>(
        "/login",
        { email, password },
        { auth: false },
      );
      await saveToken(data.token);
      await get().fetchMe();
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err) });
      throw err;
    }
  },

  logout: async () => {
    await clearToken();
    set({ user: null });
  },

  fetchMe: async () => {
    const user = await api.get<User>("/account/me");
    set({ user });
  },
}));

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Something went wrong";
}
