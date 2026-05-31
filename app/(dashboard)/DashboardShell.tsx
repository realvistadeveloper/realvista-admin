// app/(admin)/DashboardShell.tsx

"use client";

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import type { AdminUser } from "@/lib/types";

interface Props {
  user: AdminUser;
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: Props) {
  // Default open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar
        userName={user.full_name}
        staffLevel={user.staff_level ?? 1}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      {/* Main content — shifts right when sidebar is open on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search anything…"
              className="w-full rounded-xl border border-zinc-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-zinc-100 transition">
              <Bell className="w-5 h-5 text-zinc-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-zinc-200">
              <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-zinc-700">
                {user.full_name}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-screen-2xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
