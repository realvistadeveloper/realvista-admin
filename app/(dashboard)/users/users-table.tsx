"use client";

// app/(dashboard)/users/users-table.tsx
import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { PlatformUser, PaginatedUsers } from "./page";
import CreateUserModal from "./create-user-modal";
import {
  Search,
  SlidersHorizontal,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  ArrowUpRight,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

const USER_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "user", label: "Users" },
  { value: "agent", label: "Agents" },
  { value: "admin", label: "Admins" },
];

const ACTIVE_OPTIONS = [
  { value: "", label: "Any status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function UserTypeBadge({ type }: { type: PlatformUser["user_type"] }) {
  const map = {
    user: "bg-zinc-100 text-zinc-600",
    agent: "bg-blue-50 text-blue-700",
    admin: "bg-violet-50 text-violet-700",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
        map[type],
      )}
    >
      {type}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
        active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600",
      )}
    >
      <span
        className={clsx(
          "w-1.5 h-1.5 rounded-full",
          active ? "bg-green-500" : "bg-red-400",
        )}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface UsersTableProps {
  initialData: PaginatedUsers | null;
  initialParams: Record<string, string>;
  accessToken: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsersTable({
  initialData,
  initialParams,
  accessToken,
}: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<PaginatedUsers | null>(initialData);
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [type, setType] = useState(initialParams.user_type ?? "");
  const [active, setActive] = useState(initialParams.is_active ?? "");
  const [error, setError] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── Fetch helper ────────────────────────────────────────────────────────────

  const fetchPage = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setError(false);
      const params: Record<string, string> = {
        page_size: "20",
        ...(search && { search }),
        ...(type && { user_type: type }),
        ...(active && { is_active: active }),
        ...overrides,
      };

      // Sync URL (no navigation — just reflects state)
      const qs = new URLSearchParams(params).toString();
      router.replace(`${pathname}?${qs}`, { scroll: false });

      try {
        const result = await apiFetch<PaginatedUsers>(
          `/api/admin/all-users/${qs ? `?${qs}` : ""}`,
          {},
          accessToken,
        );
        setData(result);
      } catch {
        setError(true);
      }
    },
    [search, type, active, accessToken, pathname, router],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => fetchPage({ page: "1" }));
  };

  const handleFilter = (key: string, value: string) => {
    if (key === "user_type") setType(value);
    if (key === "is_active") setActive(value);
    startTransition(() =>
      fetchPage({
        page: "1",
        ...(key === "user_type" ? { user_type: value } : {}),
        ...(key === "is_active" ? { is_active: value } : {}),
      }),
    );
  };

  const handlePage = (page: number) => {
    startTransition(() => fetchPage({ page: String(page) }));
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const users = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {/* ── Create modal ── */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Users</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {data ? `${data.count.toLocaleString()} total` : "—"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          New user
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
        </form>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => handleFilter("user_type", e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            {USER_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Active filter */}
          <select
            value={active}
            onChange={(e) => handleFilter("is_active", e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            {ACTIVE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {isPending && (
          <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-red-600">
            <TriangleAlert className="w-4 h-4" />
            Failed to load users. Please try again.
          </div>
        )}

        {!error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
                  Joined
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-zinc-400"
                  >
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className={clsx(
                    "transition-colors group hover:bg-blue-50/40",
                    index % 2 === 0 ? "bg-white" : "bg-zinc-100",
                  )}
                >
                  {/* User info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 truncate">
                          {user.name || user.first_name || "—"}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <UserTypeBadge type={user.user_type} />
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <StatusBadge active={user.is_active} />
                  </td>

                  {/* Joined */}
                  <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-zinc-400">
                    {formatDate(user.date_joined)}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/users/${user.id}`}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      View <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-400 text-xs">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers — show window of 5 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2,
              )
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-zinc-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePage(p as number)}
                    disabled={isPending}
                    className={clsx(
                      "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                      p === currentPage
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                    )}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              onClick={() => handlePage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
