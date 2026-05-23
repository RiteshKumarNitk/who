import { create } from "zustand";

interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  setOnline: (online: boolean) => void;
  setPendingCount: (count: number) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (timestamp: string) => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,

  setOnline: (isOnline: boolean) => set({ isOnline }),
  setPendingCount: (pendingCount: number) => set({ pendingCount }),
  setSyncing: (isSyncing: boolean) => set({ isSyncing }),
  setLastSyncAt: (lastSyncAt: string) => set({ lastSyncAt }),
}));
