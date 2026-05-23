"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@store/ui-store";
import { useAuthStore } from "@store/auth-store";
import { useSyncStore } from "@store/sync-store";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", labelHi: "डैशबोर्ड", icon: "📊", roles: ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "MOIC", "ANM", "ASHA"] },
  { href: "/gis", label: "GIS Map", labelHi: "जीआईएस मानचित्र", icon: "🗺️", roles: ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "MOIC", "ANM", "ASHA"] },
  { href: "/surveys", label: "Surveys", labelHi: "सर्वेक्षण", icon: "📋", roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "ANM", "ASHA"] },
  { href: "/vaccination", label: "Vaccination", labelHi: "टीकाकरण", icon: "💉", roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "MOIC", "ANM", "ASHA"] },
  { href: "/disease", label: "Disease", labelHi: "रोग निगरानी", icon: "🦠", roles: ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "MOIC", "ANM", "ASHA"] },
  { href: "/hierarchy", label: "Hierarchy", labelHi: "पदानुक्रम", icon: "🏛️", roles: ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN"] },
  { href: "/sessions", label: "Sessions", labelHi: "सत्र", icon: "📅", roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "MOIC", "ANM", "ASHA"] },
  { href: "/households", label: "Households", labelHi: "परिवार", icon: "🏠", roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "ANM", "ASHA"] },
  { href: "/children", label: "Children", labelHi: "बच्चे", icon: "👶", roles: ["SUPER_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "ANM", "ASHA"] },
  { href: "/reports", label: "Reports", labelHi: "रिपोर्ट", icon: "📈", roles: ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN"] },
  { href: "/notifications", label: "Alerts", labelHi: "सूचनाएं", icon: "🔔", roles: ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN", "BLOCK_ADMIN", "MOIC", "ANM", "ASHA"] },
  { href: "/users", label: "Users", labelHi: "उपयोगकर्ता", icon: "👥", roles: ["SUPER_ADMIN", "STATE_ADMIN", "DISTRICT_ADMIN"] },
  { href: "/settings", label: "Settings", labelHi: "सेटिंग्स", icon: "⚙️", roles: ["SUPER_ADMIN"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { language, sidebar, toggleSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const { pendingCount } = useSyncStore();
  const isHi = language === "hi";

  const visibleItems = menuItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-white transition-all duration-300 ${sidebar === "collapsed" ? "w-16" : "w-64"}`}>
      <div className="flex h-full flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 p-2">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-who-blue text-white" : "text-gray-700 hover:bg-gray-100"
                }`}
                title={isHi ? item.labelHi : item.label}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebar === "expanded" && (
                  <span className="truncate">{isHi ? item.labelHi : item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {sidebar === "expanded" && (
          <div className="border-t p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`h-2 w-2 rounded-full ${useSyncStore.getState().isOnline ? "bg-green-500" : "bg-red-500"}`} />
              <span>{useSyncStore.getState().isOnline ? "Online" : "Offline"}</span>
              {pendingCount > 0 && <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">{pendingCount} pending</span>}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
