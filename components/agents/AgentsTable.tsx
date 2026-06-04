"use client";
// components/agents/AgentsTable.tsx

import { useState, useCallback, useTransition } from "react";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse, Agent, AgentStats } from "@/lib/types";
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Star,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Users,
  Award,
  AlertCircle,
  UserCog,
} from "lucide-react";
import { clsx } from "clsx";
import AgentDrawer from "./AgentDrawer";

interface Props {
  initialAgents: PaginatedResponse<Agent> | null;
  stats: AgentStats | null;
  accessToken: string;
  staffLevel: number;
  currentUserId: number;
}

type Filters = {
  search: string;
  verified: string;
  featured: string;
};

const EMPTY: Filters = { search: "", verified: "", featured: "" };

function buildQuery(f: Filters, page: number) {
  const p = new URLSearchParams({ page: String(page), page_size: "20" });
  if (f.search) p.set("search", f.search);
  if (f.verified) p.set("verified", f.verified);
  if (f.featured) p.set("featured", f.featured);
  return `/admin-api/agents/?${p}`;
}

function RatingStars({ avg, count }: { avg: number | null; count: number }) {
  if (!avg) return <span className="text-xs text-zinc-300">No ratings</span>;
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      <span className="text-xs font-semibold text-zinc-700">
        {avg.toFixed(1)}
      </span>
      <span className="text-xs text-zinc-400">({count})</span>
    </div>
  );
}

export default function AgentsTable({
  initialAgents,
  stats,
  accessToken,
  staffLevel,
  currentUserId,
}: Props) {
  const [data, setData] = useState(initialAgents);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [drawerAgent, setDrawerAgent] = useState<Agent | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isPending, start] = useTransition();

  const isSuperAdmin = staffLevel >= 5;

  const notify = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetch = useCallback(
    (f: Filters, p: number) => {
      start(async () => {
        try {
          const res = await apiFetch<PaginatedResponse<Agent>>(
            buildQuery(f, p),
            {},
            accessToken,
          );
          setData(res);
        } catch (e: any) {
          notify(e.message ?? "Failed to load agents", false);
        }
      });
    },
    [accessToken],
  );

  const setFilter = (key: keyof Filters, val: string) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    setPage(1);
    fetch(next, 1);
  };

  const changePage = (p: number) => {
    setPage(p);
    fetch(filters, p);
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const agents = data?.results ?? [];

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={clsx(
            "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
            toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white",
          )}
        >
          {toast.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: "Total",
              value: stats.total_agents,
              icon: Users,
              bg: "bg-zinc-50",
              text: "text-zinc-700",
            },
            {
              label: "Verified",
              value: stats.verified,
              icon: ShieldCheck,
              bg: "bg-green-50",
              text: "text-green-700",
            },
            {
              label: "Unverified",
              value: stats.unverified,
              icon: AlertCircle,
              bg: "bg-amber-50",
              text: "text-amber-700",
            },
            {
              label: "Featured",
              value: stats.featured,
              icon: Award,
              bg: "bg-purple-50",
              text: "text-purple-700",
            },
            {
              label: "Pending review",
              value: stats.pending_verification_review,
              icon: UserCog,
              bg: "bg-red-50",
              text: "text-red-700",
            },
          ].map(({ label, value, icon: Icon, bg, text }) => (
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
                <Icon className={clsx("w-4 h-4", text)} />
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

      {/* Scope notice for non-super-admins */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          <UserCog className="w-4 h-4 shrink-0" />
          Showing only agents assigned to you. Contact a super-admin to manage
          all agents.
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-zinc-100">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search agent name, email, agency…"
              value={filters.search}
              onChange={(e) => setFilter("search", e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition",
              showFilters || hasFilters
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
            )}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Filter row */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-4 px-5 py-3 bg-zinc-50 border-b border-zinc-100">
            {[
              {
                key: "verified" as const,
                label: "Verified",
                opts: [
                  ["", "Any"],
                  ["true", "Verified"],
                  ["false", "Unverified"],
                ],
              },
              {
                key: "featured" as const,
                label: "Featured",
                opts: [
                  ["", "Any"],
                  ["true", "Featured"],
                  ["false", "Not featured"],
                ],
              },
            ].map(({ key, label, opts }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium">
                  {label}
                </span>
                <select
                  value={filters[key]}
                  onChange={(e) => setFilter(key, e.target.value)}
                  className="text-sm rounded-lg border border-zinc-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                >
                  {opts.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {hasFilters && (
              <button
                onClick={() => {
                  setFilters(EMPTY);
                  fetch(EMPTY, 1);
                }}
                className="text-xs text-zinc-400 hover:text-red-600 flex items-center gap-1 ml-auto"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                {[
                  "Agent",
                  "Agency",
                  "Status",
                  "Rating",
                  "Assigned to",
                  "Experience",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      "px-5 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider",
                      h === "Experience" && "hidden lg:table-cell",
                      h === "Assigned to" && "hidden md:table-cell",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody
              className={clsx(
                "divide-y divide-zinc-50",
                isPending && "opacity-50",
              )}
            >
              {agents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-sm text-zinc-400"
                  >
                    No agents found
                  </td>
                </tr>
              ) : (
                agents.map((agent) => (
                  <tr
                    key={agent.id}
                    onClick={() => setDrawerAgent(agent)}
                    className="group hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    {/* Agent */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {agent.avatar ? (
                          <img
                            src={agent.avatar}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                            alt=""
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
                            {agent.user.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-zinc-900 leading-none">
                            {agent.user.name}
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {agent.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Agency */}
                    <td className="px-5 py-3">
                      <p className="text-sm text-zinc-700">
                        {agent.agency_name ?? (
                          <span className="text-zinc-300">—</span>
                        )}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                            agent.verified
                              ? "bg-green-50 text-green-700"
                              : "bg-amber-50 text-amber-600",
                          )}
                        >
                          {agent.verified ? (
                            <ShieldCheck className="w-2.5 h-2.5" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5" />
                          )}
                          {agent.verified ? "Verified" : "Unverified"}
                        </span>
                        {agent.featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700">
                            <Award className="w-2.5 h-2.5" /> Featured
                          </span>
                        )}
                        {!agent.user.is_active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-600">
                            <UserX className="w-2.5 h-2.5" /> Inactive
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-5 py-3">
                      <RatingStars
                        avg={agent.rating_avg}
                        count={agent.rating_count}
                      />
                    </td>

                    {/* Assigned to */}
                    <td className="px-5 py-3 hidden md:table-cell">
                      {agent.admin ? (
                        <span className="text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded-lg">
                          {agent.admin.email}
                        </span>
                      ) : (
                        <span className="text-xs text-red-400">Unassigned</span>
                      )}
                    </td>

                    {/* Experience */}
                    <td className="px-5 py-3 hidden lg:table-cell text-xs text-zinc-500">
                      {agent.experience_years} yr
                      {agent.experience_years !== 1 ? "s" : ""}
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, data.count)} of{" "}
              {data.count.toLocaleString()} agents
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => changePage(page - 1)}
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
                    onClick={() => changePage(p)}
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
                onClick={() => changePage(page + 1)}
                disabled={page === data.total_pages || isPending}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerAgent && (
        <AgentDrawer
          agent={drawerAgent}
          accessToken={accessToken}
          staffLevel={staffLevel}
          onClose={() => setDrawerAgent(null)}
          onUpdated={(a) => {
            setDrawerAgent(a);
            fetch(filters, page);
          }}
          onDeleted={() => {
            setDrawerAgent(null);
            fetch(filters, page);
          }}
        />
      )}
    </div>
  );
}
