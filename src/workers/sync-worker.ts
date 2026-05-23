// Web Worker for background sync processing
// Registered from the main thread for offline data synchronization

export interface SyncTask {
  id: string;
  endpoint: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
  retryCount: number;
  maxRetries: number;
}

const syncQueue: SyncTask[] = [];
let isProcessing = false;

self.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case "ENQUEUE":
      syncQueue.push(data);
      if (!isProcessing) processQueue();
      break;
    case "GET_STATUS":
      self.postMessage({ type: "STATUS", data: { queueLength: syncQueue.length, isProcessing } });
      break;
    case "CLEAR":
      syncQueue.length = 0;
      break;
  }
};

async function processQueue() {
  isProcessing = true;

  while (syncQueue.length > 0) {
    const task = syncQueue[0];

    try {
      const response = await fetch(task.endpoint, {
        method: task.method,
        headers: { "Content-Type": "application/json" },
        body: task.body,
      });

      if (response.ok) {
        syncQueue.shift();
        self.postMessage({ type: "SYNCED", data: { id: task.id } });
      } else if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        syncQueue.push(syncQueue.shift()!);
      } else {
        syncQueue.shift();
        self.postMessage({ type: "FAILED", data: { id: task.id, error: `Max retries exceeded` } });
      }
    } catch (error) {
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        syncQueue.push(syncQueue.shift()!);
      } else {
        syncQueue.shift();
        self.postMessage({ type: "FAILED", data: { id: task.id, error: String(error) } });
      }
    }

    // Wait before next attempt (rate limiting)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  isProcessing = false;
  self.postMessage({ type: "IDLE" });
}
