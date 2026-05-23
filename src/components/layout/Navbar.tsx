"use client";

import { useAuth } from "@hooks/use-auth";
import { useUiStore } from "@store/ui-store";
import { useSyncStore } from "@store/sync-store";

export function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, toggleSidebar } = useUiStore();
  const { pendingCount } = useSyncStore();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Toggle sidebar">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-who-blue">WHO GIS</h1>
          <p className="text-xs text-gray-500">Surveillance Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            {pendingCount} pending sync
          </span>
        )}

        <button
          onClick={() => setLanguage(language === "en" ? "hi" : "en")}
          className="rounded-lg border px-3 py-1 text-sm font-medium hover:bg-gray-50"
        >
          {language === "en" ? "हिंदी" : "English"}
        </button>

        {user && (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role.replace("_", " ")}</p>
            </div>
            <button onClick={logout} className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
