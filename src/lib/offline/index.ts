import Dexie, { type Table } from "dexie";
import LZString from "lz-string";

interface OfflineSurvey {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number;
  syncedAt?: number;
  retryCount: number;
}

interface OfflineGPSPoint {
  id: string;
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  timestamp: number;
}

interface OfflineBoundary {
  id: string;
  ashaId: string;
  points: Array<{ lat: number; lng: number }>;
  status: string;
  createdAt: number;
}

interface CachedData {
  key: string;
  data: string; // compressed JSON
  expiresAt: number;
}

class WHODatabase extends Dexie {
  surveys!: Table<OfflineSurvey, string>;
  gpsPoints!: Table<OfflineGPSPoint, string>;
  boundaries!: Table<OfflineBoundary, string>;
  cache!: Table<CachedData, string>;
  syncQueue!: Table<{
    id: string;
    entityType: string;
    operation: string;
    payload: string;
    status: string;
    retryCount: number;
    createdAt: number;
  }>;

  constructor() {
    super("WHO_GIS_Offline");
    this.version(1).stores({
      surveys: "id, type, createdAt, syncedAt",
      gpsPoints: "id, sessionId, timestamp",
      boundaries: "id, ashaId, status, createdAt",
      cache: "key, expiresAt",
      syncQueue: "id, entityType, status, createdAt",
    });
  }
}

export const db = new WHODatabase();

export class OfflineService {
  static async cacheData(key: string, data: unknown, ttlMs = 3600000): Promise<void> {
    const compressed = JSON.stringify(data);
    await db.cache.put({
      key,
      data: compressed,
      expiresAt: Date.now() + ttlMs,
    });
  }

  static async getCachedData<T>(key: string): Promise<T | null> {
    const entry = await db.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      await db.cache.delete(key);
      return null;
    }
    return JSON.parse(entry.data) as T;
  }

  static async queueSync(
    entityType: string,
    entityId: string,
    operation: "CREATE" | "UPDATE" | "DELETE",
    payload: Record<string, unknown>
  ): Promise<void> {
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      entityType,
      operation,
      payload: JSON.stringify(payload),
      status: "PENDING",
      retryCount: 0,
      createdAt: Date.now(),
    });
  }

  static async getPendingSyncItems(limit = 50) {
    return db.syncQueue
      .where("status")
      .equals("PENDING")
      .limit(limit)
      .toArray();
  }

  static async markSynced(id: string): Promise<void> {
    await db.syncQueue.update(id, { status: "SYNCED" });
  }

  static async markFailed(id: string, error: string): Promise<void> {
    const item = await db.syncQueue.get(id);
    if (!item) return;
    const newRetryCount = item.retryCount + 1;
    const newStatus = newRetryCount >= 5 ? "FAILED" : "PENDING";
    await db.syncQueue.update(id, {
      status: newStatus,
      retryCount: newRetryCount,
    });
  }

  static async getUnsyncedCount(): Promise<number> {
    return db.syncQueue.where("status").equals("PENDING").count();
  }

  static async storeGPSPoint(point: OfflineGPSPoint): Promise<void> {
    await db.gpsPoints.put(point);
  }

  static async getGPSPointsBySession(sessionId: string): Promise<OfflineGPSPoint[]> {
    return db.gpsPoints.where("sessionId").equals(sessionId).toArray();
  }

  static async clearSyncedData(): Promise<void> {
    const oldDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
    await db.syncQueue.where("createdAt").below(oldDate).delete();
    await db.gpsPoints.where("timestamp").below(oldDate).delete();
    await db.cache.where("expiresAt").below(Date.now()).delete();
  }
}
