"use client";

import { useAuthStore } from "@store/auth-store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import axios from "@lib/api";

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, token, setAuth, logout: storeLogout, setOffline } = useAuthStore();

  const login = useCallback(async (email: string, password: string, deviceId?: string) => {
    const { data } = await axios.post("/api/auth/login", { email, password, deviceId });
    setAuth(data.data);
    router.push("/dashboard");
    return data.data;
  }, [setAuth, router]);

  const logout = useCallback(async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {}
    storeLogout();
    router.push("/login");
  }, [storeLogout, router]);

  const hasRole = useCallback((roles: string | string[]) => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  }, [user]);

  return {
    user,
    isAuthenticated,
    token,
    login,
    logout,
    hasRole,
    setOffline,
  };
}
