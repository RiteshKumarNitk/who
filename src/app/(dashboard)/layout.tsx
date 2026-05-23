"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "@components/layout/DashboardLayout";
import { OfflineIndicator } from "@components/offline/OfflineIndicator";
import { useOfflineSync } from "@hooks/use-offline-sync";

function OfflineSyncInitializer() {
  useOfflineSync();
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineSyncInitializer />
      <DashboardLayout>
        {children}
      </DashboardLayout>
      <OfflineIndicator />
    </QueryClientProvider>
  );
}
