// components/sidebar/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { logoutAction } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  TicketCheck,
  MessageSquare,
  Bell,
  BarChart2,
  BookOpen,
  Mail,
  UserCheck,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  FileText,
  ChevronDown,
  GraduationCap,
  Building2,
  Menu,
  X,
  ListChecks,
} from "lucide-react";

// Nav icon aliases
const StudentIcon = GraduationCap;
const TutorIcon = BookOpen;
const ParentIcon = Users;

interface NavSubItem {
  label: string;
  href: string;
  icon: React.ElementType;
}
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavSubItem[];
}
interface NavGroup {
  section: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/analytics", icon: BarChart2 },
    ],
  },
  {
    section: "People",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: Users,
        children: [
          { label: "Students", href: "/users/students", icon: StudentIcon },
          { label: "Tutors", href: "/users/tutors", icon: TutorIcon },
          { label: "Parents", href: "/users/parents", icon: ParentIcon },
          {
            label: "Institutions",
            href: "/users/institutions",
            icon: Building2,
          },
        ],
      },
      { label: "Leads", href: "/leads", icon: UserCheck },
    ],
  },
  {
    section: "Support",
    items: [
      { label: "Tickets", href: "/support", icon: TicketCheck },
      { label: "Enquiries", href: "/contact", icon: MessageSquare },
    ],
  },
  {
    section: "Content",
    items: [
      { label: "Subjects", href: "/subjects", icon: BookOpen },
      { label: "Exams & Boards", href: "/exams", icon: GraduationCap },
      { label: "Syllabus", href: "/syllabus", icon: ListChecks },
      { label: "Question Bank", href: "/questions", icon: HelpCircle },
      { label: "Past Papers", href: "/past-papers", icon: FileText },
    ],
  },
  {
    section: "Comms",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Email", href: "/email", icon: Mail },
    ],
  },
  {
    section: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

function isParentActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href || pathname.startsWith(item.href + "/"))
    return true;
  return (
    item.children?.some(
      (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
    ) ?? false
  );
}

interface Props {
  userName: string;
  staffLevel: number;
  sidebarOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  userName,
  staffLevel,
  sidebarOpen,
  onToggle,
}: Props) {
  const pathname = usePathname();

  const initialOpen = NAV.flatMap((g) => g.items)
    .filter((item) => item.children && isParentActive(item, pathname))
    .map((item) => item.href);

  const [openMenus, setOpenMenus] = useState<string[]>(initialOpen);

  // Close on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024 && sidebarOpen) onToggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleMenu = (href: string) =>
    setOpenMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href],
    );

  const drawer = (
    <aside className="flex w-64 flex-col bg-zinc-900 text-white h-full">
      {/* Brand + close */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-700">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Super Prep</p>
            <p className="text-xs text-zinc-400 leading-tight">Admin Panel</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = !!item.children?.length;
                const isOpen = openMenus.includes(item.href);
                const parentActive = isParentActive(item, pathname);
                const rowActive = pathname === item.href;

                return (
                  <li key={item.href}>
                    {hasChildren ? (
                      <div
                        className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          parentActive && !isOpen
                            ? "bg-green-700 text-white"
                            : parentActive
                              ? "text-white"
                              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        }`}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                        <button
                          onClick={() => toggleMenu(item.href)}
                          className="ml-2 p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                          aria-label={isOpen ? "Collapse" : "Expand"}
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          rowActive
                            ? "bg-green-700 text-white"
                            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                        {rowActive && (
                          <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
                        )}
                      </Link>
                    )}

                    {hasChildren && isOpen && (
                      <ul className="mt-0.5 ml-4 pl-3 border-l border-zinc-700 space-y-0.5">
                        {item.children!.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive =
                            pathname === child.href ||
                            pathname.startsWith(child.href + "/");
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                                  childActive
                                    ? "bg-green-700 text-white font-medium"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                }`}
                              >
                                <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                {child.label}
                                {childActive && (
                                  <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-700 text-xs font-bold flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {userName}
            </p>
            <p className="text-xs text-zinc-400">Level {staffLevel} Staff</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <>
      {/* Menu button — all screen sizes, only when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Desktop — fixed sidebar, content shifts via ml-64 in DashboardShell */}
      {sidebarOpen && (
        <div className="hidden lg:block fixed inset-y-0 left-0 z-50 w-64">
          {drawer}
        </div>
      )}

      {/* Mobile — overlay drawer */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onToggle}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">{drawer}</div>
        </div>
      )}
    </>
  );
}
