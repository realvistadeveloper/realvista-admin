"use client";

// components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  GraduationCap,
  Tag,
  GitBranch,
  Inbox,
  Bell,
  Megaphone,
  CreditCard,
  Wallet,
  LogOut,
  ShieldCheck,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";

// ── Nav sections ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minLevel?: number;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: "General",
    items: [{ label: "Overview", href: "/overview", icon: LayoutDashboard }],
  },
  {
    heading: "People",
    items: [
      { label: "Users", href: "/users", icon: Users },
      { label: "Agents", href: "/agents", icon: UserCheck },
    ],
  },
  {
    heading: "Listings",
    items: [
      { label: "Properties", href: "/properties", icon: Building2 },
      { label: "Trends", href: "/trends", icon: TrendingUp },
      { label: "Learn", href: "/learn", icon: GraduationCap },
    ],
  },
  {
    heading: "Growth",
    items: [
      { label: "Promotions", href: "/promotions", icon: Tag },
      { label: "Referrals", href: "/referrals", icon: GitBranch },
      { label: "Marketing", href: "/marketing", icon: Megaphone },
    ],
  },
  {
    heading: "Communication",
    items: [
      { label: "Inbox", href: "/inbox", icon: Inbox },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    heading: "Finance",
    items: [
      {
        label: "Subscriptions",
        href: "/subscriptions",
        icon: CreditCard,
        minLevel: 5,
      },
      { label: "Payments", href: "/payments", icon: Wallet, minLevel: 5 },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const displayName = user.name || user.first_name || user.email;
  const avatarInitial = (
    user.name?.[0] ||
    user.first_name?.[0] ||
    user.email?.[0] ||
    "A"
  ).toUpperCase();

  return (
    <aside
      className={clsx(
        "hidden lg:flex flex-col bg-zinc-900 shrink-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo + collapse toggle */}
      <div
        className={clsx(
          "flex items-center border-b border-zinc-800 shrink-0",
          collapsed ? "justify-center px-0 py-5" : "justify-between px-5 py-5",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-none">
                Realvista
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Admin Panel</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed((p) => !p)}
          className={clsx(
            "p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0",
            collapsed && "mx-auto",
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Collapsed — icon only with logo mark */}
      {collapsed && (
        <div className="flex items-center justify-center py-2 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden space-y-5">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) =>
              !item.minLevel || (user.access_level ?? 0) >= item.minLevel,
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.heading}>
              {/* Section label — hidden when collapsed */}
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                  {section.heading}
                </p>
              )}
              {/* Divider line when collapsed */}
              {collapsed && (
                <div className="mx-3 mb-2 border-t border-zinc-800" />
              )}

              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active =
                    item.href === "/overview"
                      ? pathname === "/overview"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={clsx(
                        "group flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                        collapsed
                          ? "justify-center px-0 py-2.5"
                          : "px-3 py-2.5",
                        active
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
                      )}
                    >
                      <item.icon
                        className={clsx(
                          "shrink-0 transition-colors",
                          collapsed ? "w-5 h-5" : "w-4 h-4",
                          active
                            ? "text-brand-400"
                            : "text-zinc-500 group-hover:text-zinc-200",
                        )}
                      />

                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {active && (
                            <ChevronRight className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className={clsx(
          "border-t border-zinc-800 py-4 shrink-0",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2 mb-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-zinc-200">
                  {avatarInitial}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {user.role?.replace(/_/g, " ") ?? "Admin"} · L
                  {user.access_level ?? 0}
                </p>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center"
              title={`${displayName} · Level ${user.access_level ?? 0}`}
            >
              <span className="text-xs font-semibold text-zinc-200">
                {avatarInitial}
              </span>
            </div>
            {/* Sign out icon */}
            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
