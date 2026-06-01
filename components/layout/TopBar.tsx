// components/layout/TopBar.tsx
"use client";

import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth";
import { AdminUser } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/users": "Users",
  "/dashboard/agents": "Agents",
  "/dashboard/properties": "Properties",
};

const NAV = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/users", icon: Users },
  { label: "Agents", href: "/dashboard/agents", icon: UserCheck },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
];

export default function TopBar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Best-match page title
  const title =
    Object.entries(TITLES)
      .filter(([path]) => pathname.startsWith(path))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? "Dashboard";

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-100 shrink-0">
        {/* Left: mobile menu + page title */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden text-zinc-500 hover:text-zinc-900"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        </div>

        {/* Right: user badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-zinc-800 leading-none">
              {user.name}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Level {user.staff_level ?? 0} ·{" "}
              {user.is_superuser ? "Super Admin" : "Staff"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-brand-700">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-700" />
                <span className="font-bold text-zinc-900">Realvista Admin</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {NAV.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="px-3 py-4 border-t border-zinc-100">
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
