"use client";

// components/layout/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth";
import { AdminUser } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  GraduationCap,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  minLevel?: number;
}

const NAV: NavItem[] = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Agents", href: "/agents", icon: UserCheck },
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Trends", href: "/trends", icon: TrendingUp },
  { label: "Learn", href: "/learn", icon: GraduationCap },
];

export default function Sidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();

  const visibleNav = NAV.filter(
    (item) => !item.minLevel || (user.access_level ?? 0) >= item.minLevel,
  );

  // Best available display name
  const displayName = user.name || user.first_name || user.email;
  const avatarInitial = (
    user.name?.[0] ||
    user.first_name?.[0] ||
    user.email?.[0] ||
    "A"
  ).toUpperCase();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-zinc-100 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-800">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900 leading-none">
            Realvista
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => {
          const active =
            item.href === "/overview"
              ? pathname === "/overview"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
              )}
            >
              <item.icon
                className={clsx(
                  "w-4 h-4 shrink-0",
                  active
                    ? "text-brand-600"
                    : "text-zinc-400 group-hover:text-zinc-600",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {active && (
                <ChevronRight className="w-3.5 h-3.5 text-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-zinc-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-brand-700">
              {avatarInitial}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              {user.role?.replace(/_/g, " ") ?? "Admin"}
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
  );
}
