"use client";

import { useSyncStore } from "@store/sync-store";

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, lastSyncAt } = useSyncStore();

  if (isOnline && !pendingCount) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${
      isOnline ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-red-50 text-red-800 border border-red-200"
    }`}>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isOnline ? "bg-amber-500" : "bg-red-500"} ${isSyncing ? "animate-pulse" : ""}`} />
        <span>
          {!isOnline ? "Offline - working in local mode" : isSyncing ? "Syncing..." : `${pendingCount} items pending sync`}
        </span>
      </div>
      {lastSyncAt && isOnline && (
        <p className="mt-1 text-xs opacity-75">Last sync: {new Date(lastSyncAt).toLocaleTimeString()}</p>
      )}
    </div>
  );
}
