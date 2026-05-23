import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, LoginResponse } from "@shared/types";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isOffline: boolean;
  setAuth: (data: LoginResponse) => void;
  setUser: (user: UserProfile) => void;
  setOffline: (offline: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isOffline: false,

      setAuth: (data: LoginResponse) =>
        set({
          user: data.user,
          token: data.tokens.accessToken,
          isAuthenticated: true,
        }),

      setUser: (user: UserProfile) => set({ user }),

      setOffline: (isOffline: boolean) => set({ isOffline }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "who-auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
