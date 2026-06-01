"use client";

// components/users/UsersTable.tsx

import { useState, useCallback, useTransition } from "react";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse, AppUser, UserStats } from "@/lib/types";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Trash2,
  ShieldCheck,
  RefreshCw,
  X,
  Check,
  Users,
  TrendingUp,
  MailCheck,
  UserCog,
} from "lucide-react";
import { clsx } from "clsx";
import UserDrawer from "./UserDrawer";
import CreateUserModal from "./CreateUserModal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  initialUsers: PaginatedResponse<AppUser> | null;
  stats: UserStats | null;
  accessToken: string;
}

type FilterState = {
  search: string;
  is_active: string;
  is_agent: string;
  is_email_verified: string;
  auth_provider: string;
};

const EMPTY_FILTERS: FilterState = {
  search: "",
  is_active: "",
  is_agent: "",
  is_email_verified: "",
  auth_provider: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildQuery(filters: FilterState, page: number, pageSize: number) {
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("page_size", String(pageSize));
  if (filters.search) p.set("search", filters.search);
  if (filters.is_active) p.set("is_active", filters.is_active);
  if (filters.is_agent) p.set("is_agent", filters.is_agent);
  if (filters.is_email_verified)
    p.set("is_email_verified", filters.is_email_verified);
  if (filters.auth_provider) p.set("auth_provider", filters.auth_provider);
  return `/admin-api/users/?${p.toString()}`;
}

function Badge({
  active,
  label,
  activeClass,
  inactiveClass,
}: {
  active: boolean;
  label: string;
  activeClass: string;
  inactiveClass: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
        active ? activeClass : inactiveClass,
      )}
    >
      {active ? (
        <Check className="w-2.5 h-2.5" />
      ) : (
        <X className="w-2.5 h-2.5" />
      )}
      {label}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const map: Record<string, { label: string; className: string }> = {
    email: { label: "Email", className: "bg-zinc-100 text-zinc-600" },
    google: { label: "Google", className: "bg-blue-50 text-blue-600" },
    apple: { label: "Apple", className: "bg-zinc-900 text-white" },
  };
  const { label, className } = map[provider] ?? {
    label: provider,
    className: "bg-zinc-100 text-zinc-600",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-full text-[11px] font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function UsersTable({
  initialUsers,
  stats,
  accessToken,
}: Props) {
  const [data, setData] = useState(initialUsers);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [drawerUser, setDrawerUser] = useState<AppUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(
    (newFilters: FilterState, newPage: number) => {
      startTransition(async () => {
        try {
          const res = await apiFetch<PaginatedResponse<AppUser>>(
            buildQuery(newFilters, newPage, pageSize),
            {},
            accessToken,
          );
          setData(res);
          setSelected(new Set());
        } catch (e: any) {
          showToast(e.message ?? "Failed to load users", "error");
        }
      });
    },
    [accessToken, pageSize],
  );

  // ── Search (debounced via state) ──────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    const next = { ...filters, search: value };
    setFilters(next);
    setPage(1);
    fetchUsers(next, 1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setPage(1);
    fetchUsers(next, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers(filters, newPage);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
    fetchUsers(EMPTY_FILTERS, 1);
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "search" && v !== "",
  );

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleAll = () => {
    if (!data) return;
    if (selected.size === data.results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.results.map((u) => u.id)));
    }
  };

  const toggleOne = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // ── Bulk Actions ──────────────────────────────────────────────────────────

  const bulkAction = async (action: string) => {
    if (!selected.size) return;
    setBulkLoading(true);
    try {
      await apiFetch(
        "/admin-api/users/bulk-action/",
        {
          method: "POST",
          body: JSON.stringify({ action, user_ids: Array.from(selected) }),
        },
        accessToken,
      );
      showToast(`${action} applied to ${selected.size} user(s)`);
      fetchUsers(filters, page);
    } catch (e: any) {
      showToast(e.message ?? "Bulk action failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Toggle single user status ─────────────────────────────────────────────

  const toggleStatus = async (userId: number) => {
    try {
      await apiFetch(
        `/admin-api/users/${userId}/toggle-status/`,
        { method: "POST" },
        accessToken,
      );
      fetchUsers(filters, page);
    } catch (e: any) {
      showToast(e.message ?? "Failed to toggle status", "error");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const users = data?.results ?? [];
  const allSelected = users.length > 0 && selected.size === users.length;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* ── Toast ── */}
      {toast && (
        <div
          className={clsx(
            "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all",
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white",
          )}
        >
          {toast.type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* ── Stats row ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total",
              value: stats.total,
              icon: Users,
              color: "text-zinc-700",
              bg: "bg-zinc-50",
            },
            {
              label: "Active",
              value: stats.active,
              icon: TrendingUp,
              color: "text-green-700",
              bg: "bg-green-50",
            },
            {
              label: "Verified",
              value: stats.email_verified,
              icon: MailCheck,
              color: "text-blue-700",
              bg: "bg-blue-50",
            },
            {
              label: "Agents",
              value: stats.agents,
              icon: UserCog,
              color: "text-purple-700",
              bg: "bg-purple-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-zinc-100 px-4 py-3 flex items-center gap-3"
            >
              <div
                className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  bg,
                )}
              >
                <Icon className={clsx("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-900 leading-none tabular-nums">
                  {value.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-zinc-100">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search name or email…"
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition",
              showFilters || hasActiveFilters
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] flex items-center justify-center">
                {
                  Object.values(filters).filter((v, i) => i > 0 && v !== "")
                    .length
                }
              </span>
            )}
          </button>

          {/* Create */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-800 hover:bg-brand-700 text-white transition"
          >
            <Plus className="w-4 h-4" />
            New user
          </button>
        </div>

        {/* ── Filter bar ── */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-zinc-50 border-b border-zinc-100">
            {[
              {
                key: "is_active" as const,
                label: "Status",
                options: [
                  { value: "", label: "Any status" },
                  { value: "true", label: "Active" },
                  { value: "false", label: "Inactive" },
                ],
              },
              {
                key: "is_email_verified" as const,
                label: "Email",
                options: [
                  { value: "", label: "Any" },
                  { value: "true", label: "Verified" },
                  { value: "false", label: "Unverified" },
                ],
              },
              {
                key: "is_agent" as const,
                label: "Role",
                options: [
                  { value: "", label: "Any role" },
                  { value: "true", label: "Agents only" },
                  { value: "false", label: "Non-agents" },
                ],
              },
              {
                key: "auth_provider" as const,
                label: "Provider",
                options: [
                  { value: "", label: "Any provider" },
                  { value: "email", label: "Email" },
                  { value: "google", label: "Google" },
                  { value: "apple", label: "Apple" },
                ],
              },
            ].map(({ key, label, options }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">
                  {label}
                </span>
                <select
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                  className="text-sm rounded-lg border border-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                >
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-600 transition ml-auto"
              >
                <X className="w-3.5 h-3.5" /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Bulk action bar ── */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 bg-brand-50 border-b border-brand-100">
            <span className="text-sm font-medium text-brand-700">
              {selected.size} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              {[
                {
                  action: "activate",
                  icon: UserCheck,
                  label: "Activate",
                  className:
                    "text-green-700 bg-green-50 hover:bg-green-100 border-green-200",
                },
                {
                  action: "deactivate",
                  icon: UserX,
                  label: "Deactivate",
                  className:
                    "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200",
                },
                {
                  action: "verify_email",
                  icon: ShieldCheck,
                  label: "Verify email",
                  className:
                    "text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200",
                },
                {
                  action: "delete",
                  icon: Trash2,
                  label: "Delete",
                  className:
                    "text-red-700 bg-red-50 hover:bg-red-100 border-red-200",
                },
              ].map(({ action, icon: Icon, label, className }) => (
                <button
                  key={action}
                  onClick={() => bulkAction(action)}
                  disabled={bulkLoading}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50",
                    className,
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="px-5 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                  Provider
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                  Joined
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                  Referrals
                </th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>

            <tbody
              className={clsx(
                "divide-y divide-zinc-50",
                isPending && "opacity-50",
              )}
            >
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-sm text-zinc-400"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={clsx(
                      "group hover:bg-zinc-50 transition-colors cursor-pointer",
                      selected.has(user.id) && "bg-brand-50/50",
                    )}
                    onClick={() => setDrawerUser(user)}
                  >
                    {/* Checkbox */}
                    <td
                      className="px-5 py-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(user.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleOne(user.id)}
                        className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>

                    {/* User info */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center shrink-0 text-xs font-bold text-brand-700">
                          {user.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 leading-none">
                            {user.name}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {user.email}
                          </p>
                        </div>
                        {user.is_agent && (
                          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700">
                            Agent
                          </span>
                        )}
                        {user.is_staff && (
                          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700">
                            Staff
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status badges */}
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge
                          active={user.is_active}
                          label={user.is_active ? "Active" : "Inactive"}
                          activeClass="bg-green-50 text-green-700"
                          inactiveClass="bg-red-50 text-red-600"
                        />
                        <Badge
                          active={user.is_email_verified}
                          label="Email"
                          activeClass="bg-blue-50 text-blue-700"
                          inactiveClass="bg-zinc-100 text-zinc-500"
                        />
                      </div>
                    </td>

                    {/* Provider */}
                    <td className="px-5 py-3 hidden md:table-cell">
                      <ProviderBadge provider={user.auth_provider} />
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-3 hidden lg:table-cell text-xs text-zinc-500">
                      {new Date(user.date_joined).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Referrals */}
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-xs text-zinc-700 font-medium tabular-nums">
                        {user.referred_users_count}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleStatus(user.id)}
                        title={user.is_active ? "Deactivate" : "Activate"}
                        className={clsx(
                          "p-1.5 rounded-lg transition opacity-0 group-hover:opacity-100",
                          user.is_active
                            ? "text-zinc-400 hover:text-red-600 hover:bg-red-50"
                            : "text-zinc-400 hover:text-green-600 hover:bg-green-50",
                        )}
                      >
                        {user.is_active ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, data.count)} of{" "}
              {data.count.toLocaleString()} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || isPending}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(data.total_pages, 7) }, (_, i) => {
                const p =
                  data.total_pages <= 7
                    ? i + 1
                    : page <= 4
                      ? i + 1
                      : page >= data.total_pages - 3
                        ? data.total_pages - 6 + i
                        : page - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    disabled={isPending}
                    className={clsx(
                      "w-7 h-7 rounded-lg text-xs font-medium transition",
                      p === page
                        ? "bg-brand-800 text-white"
                        : "text-zinc-600 hover:bg-zinc-100",
                    )}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.total_pages || isPending}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Drawer ── */}
      {drawerUser && (
        <UserDrawer
          user={drawerUser}
          accessToken={accessToken}
          onClose={() => setDrawerUser(null)}
          onUpdated={(updated) => {
            setDrawerUser(updated);
            fetchUsers(filters, page);
          }}
          onDeleted={() => {
            setDrawerUser(null);
            fetchUsers(filters, page);
          }}
        />
      )}

      {/* ── Create modal ── */}
      {showCreate && (
        <CreateUserModal
          accessToken={accessToken}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchUsers(filters, page);
          }}
        />
      )}
    </div>
  );
}
