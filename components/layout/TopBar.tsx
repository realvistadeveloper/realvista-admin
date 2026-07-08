"use client";

// components/layout/TopBar.tsx
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
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";

// ── All routes (mirrors Sidebar) ──────────────────────────────────────────────

const ALL_NAV = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Agents", href: "/agents", icon: UserCheck },
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Trends", href: "/trends", icon: TrendingUp },
  { label: "Learn", href: "/learn", icon: GraduationCap },
  { label: "Promotions", href: "/promotions", icon: Tag },
  { label: "Referrals", href: "/referrals", icon: GitBranch },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  {
    label: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
    minLevel: 5,
  },
  { label: "Payments", href: "/payments", icon: Wallet, minLevel: 5 },
];

const MOBILE_SECTIONS = [
  { heading: "General", hrefs: ["/overview"] },
  { heading: "People", hrefs: ["/users", "/agents"] },
  { heading: "Listings", hrefs: ["/properties", "/trends", "/learn"] },
  { heading: "Growth", hrefs: ["/promotions", "/referrals", "/marketing"] },
  { heading: "Communication", hrefs: ["/inbox", "/notifications"] },
  { heading: "Finance", hrefs: ["/subscriptions", "/payments"] },
];

// ── Page title from current path ──────────────────────────────────────────────

function getPageTitle(pathname: string): string {
  const match = [...ALL_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.href === "/overview"
        ? pathname === "/overview"
        : pathname.startsWith(item.href),
    );
  return match?.label ?? "Dashboard";
}

// ── Role display ──────────────────────────────────────────────────────────────

function roleLabel(user: AdminUser): string {
  const role = user.role?.replace(/_/g, " ") ?? "Admin";
  const level = user.access_level ?? 0;
  return `${role} · Level ${level}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TopBarProps {
  user: AdminUser;
  agentId: number | null;
}

export default function TopBar({ user, agentId }: TopBarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const title = getPageTitle(pathname);
  const avatarInitial = (
    user.name?.[0] ||
    user.email?.[0] ||
    "A"
  ).toUpperCase();

  const visibleNav = ALL_NAV.filter(
    (item) => !item.minLevel || (user.access_level ?? 0) >= item.minLevel,
  );

  return (
    <>
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-100 shrink-0">
        {/* Left: mobile hamburger + page title */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-zinc-900">{title}</h1>
        </div>

        {/* Right: user badge */}
        <div className="flex items-center gap-3">
          {agentId !== null && (
            <Link
              href={`/agents/${agentId}`}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              My Page
            </Link>
          )}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-zinc-800 leading-none">
              {user.name || user.first_name || user.email}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{roleLabel(user)}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-brand-700">
              {avatarInitial}
            </span>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-zinc-900 text-sm">
                  Realvista Admin
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sectioned nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
              {MOBILE_SECTIONS.map((section) => {
                const items = visibleNav.filter((n) =>
                  section.hrefs.includes(n.href),
                );
                if (items.length === 0) return null;
                return (
                  <div key={section.heading}>
                    <p className="px-3 mb-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                      {section.heading}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const active =
                          item.href === "/overview"
                            ? pathname === "/overview"
                            : pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={clsx(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                              active
                                ? "bg-brand-50 text-brand-700"
                                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                            )}
                          >
                            <item.icon
                              className={clsx(
                                "w-4 h-4 shrink-0",
                                active ? "text-brand-600" : "text-zinc-400",
                              )}
                            />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* User + sign out */}
            <div className="px-3 py-4 border-t border-zinc-100">
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-brand-700">
                    {avatarInitial}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {user.name || user.first_name || user.email}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {roleLabel(user)}
                  </p>
                </div>
              </div>
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
