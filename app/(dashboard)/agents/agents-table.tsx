"use client";

// app/(dashboard)/agents/agents-table.tsx
import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Agent, PaginatedAgents, AgentStats } from "./types";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ArrowUpRight,
  Loader2,
  TriangleAlert,
  BadgeCheck,
  Star,
  ShieldAlert,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null)
    return <span className="text-xs text-zinc-300">No ratings</span>;
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
    </span>
  );
}

function VerificationBadge({ agent }: { agent: Agent }) {
  if (agent.verified) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
        <BadgeCheck className="w-3 h-3" /> Verified
      </span>
    );
  }
  if (
    agent.has_verification &&
    agent.verification &&
    !agent.verification.reviewed
  ) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
        <ShieldAlert className="w-3 h-3" /> Pending review
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-500">
      Unverified
    </span>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: AgentStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Total agents",
          value: stats.total,
          icon: Users,
          color: "text-zinc-600",
        },
        {
          label: "Verified",
          value: stats.verified,
          icon: BadgeCheck,
          color: "text-green-600",
        },
        {
          label: "Pending review",
          value: stats.pending_verification,
          icon: ShieldAlert,
          color: "text-amber-600",
        },
        {
          label: "Unassigned",
          value: stats.unassigned,
          icon: UserCheck,
          color: "text-red-500",
        },
      ].map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-zinc-100 px-4 py-3 flex items-center gap-3"
        >
          <Icon className={clsx("w-4 h-4 shrink-0", color)} />
          <div>
            <p className="text-lg font-bold text-zinc-900 tabular-nums">
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AgentsTableProps {
  initialData: PaginatedAgents | null;
  initialStats: AgentStats | null;
  initialParams: Record<string, string>;
  accessToken: string;
}

export default function AgentsTable({
  initialData,
  initialStats,
  initialParams,
  accessToken,
}: AgentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [verified, setVerified] = useState(initialParams.verified ?? "");
  const [hasDocs, setHasDocs] = useState(initialParams.has_verification ?? "");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchPage = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setError(false);
      const params: Record<string, string> = {
        page_size: "20",
        ...(search && { search }),
        ...(verified && { verified }),
        ...(hasDocs && { has_verification: hasDocs }),
        ...overrides,
      };
      const qs = new URLSearchParams(params).toString();
      router.replace(`${pathname}?${qs}`, { scroll: false });
      try {
        const result = await apiFetch<PaginatedAgents>(
          `/api/admin/agents/?${qs}`,
          {},
          accessToken,
        );
        setData(result);
      } catch {
        setError(true);
      }
    },
    [search, verified, hasDocs, accessToken, pathname, router],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => fetchPage({ page: "1" }));
  };

  const handleFilter = (key: string, value: string) => {
    if (key === "verified") setVerified(value);
    if (key === "has_verification") setHasDocs(value);
    startTransition(() => fetchPage({ page: "1", [key]: value }));
  };

  const agents = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Agents</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {data ? `${data.count.toLocaleString()} total` : "—"}
          {initialStats?.scope === "assigned" && (
            <span className="ml-2 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
              Your assigned agents
            </span>
          )}
        </p>
      </div>

      <StatsStrip stats={initialStats} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, agency…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            value={verified}
            onChange={(e) => handleFilter("verified", e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">All agents</option>
            <option value="true">Verified only</option>
            <option value="false">Unverified only</option>
          </select>
          <select
            value={hasDocs}
            onChange={(e) => handleFilter("has_verification", e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">Any docs status</option>
            <option value="true">Has submitted docs</option>
            <option value="false">No docs submitted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {isPending && (
          <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-red-600">
            <TriangleAlert className="w-4 h-4" /> Failed to load agents.
          </div>
        )}
        {!error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Agent
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Agency
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Rating
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Assigned to
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {agents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-zinc-400"
                  >
                    No agents found.
                  </td>
                </tr>
              )}
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="hover:bg-zinc-50/60 transition-colors group"
                >
                  {/* Agent info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 truncate">
                          {agent.user.name || "—"}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {agent.user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Agency */}
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <p className="text-sm text-zinc-700 truncate max-w-[160px]">
                      {agent.agency_name || (
                        <span className="text-zinc-300 italic">No agency</span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {agent.experience_years}y exp.
                    </p>
                  </td>

                  {/* Rating */}
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <StarRating rating={agent.average_rating} />
                      {agent.rating_count > 0 && (
                        <p className="text-xs text-zinc-400">
                          {agent.rating_count} reviews
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Assigned admin */}
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {agent.admin ? (
                      <p className="text-sm text-zinc-600 truncate max-w-[140px]">
                        {agent.admin.name}
                      </p>
                    ) : (
                      <span className="text-xs text-red-400 italic">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <VerificationBadge agent={agent} />
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Manage <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-zinc-400 text-xs">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                startTransition(() =>
                  fetchPage({ page: String(currentPage - 1) }),
                )
              }
              disabled={currentPage <= 1 || isPending}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
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
                  <span key={`e-${i}`} className="px-1 text-zinc-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() =>
                      startTransition(() => fetchPage({ page: String(p) }))
                    }
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
              onClick={() =>
                startTransition(() =>
                  fetchPage({ page: String(currentPage + 1) }),
                )
              }
              disabled={currentPage >= totalPages || isPending}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
