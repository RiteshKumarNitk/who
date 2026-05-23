"use client";

import { useEffect, useCallback } from "react";
import { useSyncStore } from "@store/sync-store";
import { OfflineService } from "@lib/offline";
import { useAuthStore } from "@store/auth-store";

export function useOfflineSync() {
  const { isOnline, setOnline, setPendingCount, setSyncing, setLastSyncAt, isSyncing } = useSyncStore();
  const token = useAuthStore((s) => s.token);

  const syncPendingItems = useCallback(async () => {
    if (!isOnline || isSyncing || !token) return;

    setSyncing(true);
    try {
      const items = await OfflineService.getPendingSyncItems(50);
      if (items.length === 0) {
        setSyncing(false);
        return;
      }

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            entityType: item.entityType,
            operation: item.operation,
            entityId: item.id,
            payload: JSON.parse(item.payload),
          })),
          deviceId: "web-client",
        }),
      });

      if (res.ok) {
        for (const item of items) {
          await OfflineService.markSynced(item.id);
        }
        setLastSyncAt(new Date().toISOString());
      }
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
      const count = await OfflineService.getUnsyncedCount();
      setPendingCount(count);
    }
  }, [isOnline, isSyncing, token, setSyncing, setLastSyncAt, setPendingCount]);

  const updatePendingCount = useCallback(async () => {
    const count = await OfflineService.getUnsyncedCount();
    setPendingCount(count);
  }, [setPendingCount]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(syncPendingItems, 30000);
    return () => clearInterval(interval);
  }, [syncPendingItems, updatePendingCount]);

  return { isOnline, syncPendingItems, updatePendingCount };
}
