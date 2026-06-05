"use client";

// app/(dashboard)/properties/properties-table.tsx
import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type {
  MarketProperty,
  PaginatedProperties,
  PropertyStats,
  PropertyStatus,
} from "./types";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowUpRight,
  Loader2,
  TriangleAlert,
  TrendingUp,
  Eye,
  MessageSquare,
  Bookmark,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

const PURPOSE_OPTIONS = [
  { value: "", label: "All purposes" },
  { value: "sale", label: "For Sale" },
  { value: "lease", label: "For Lease" },
  { value: "rent", label: "For Rent" },
];

const STATUS_STYLES: Record<PropertyStatus, string> = {
  draft: "bg-zinc-100 text-zinc-500",
  pending: "bg-amber-50 text-amber-700",
  published: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

function StatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

function formatPrice(price: string, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(parseFloat(price));
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: PropertyStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Total",
          value: stats.total,
          icon: Building2,
          color: "text-zinc-700",
        },
        {
          label: "Published",
          value: stats.by_status.published ?? 0,
          icon: TrendingUp,
          color: "text-green-600",
        },
        {
          label: "Pending",
          value: stats.by_status.pending ?? 0,
          icon: TriangleAlert,
          color: "text-amber-600",
        },
        {
          label: "Views",
          value: stats.total_views,
          icon: Eye,
          color: "text-blue-600",
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface PropertiesTableProps {
  initialData: PaginatedProperties | null;
  initialStats: PropertyStats | null;
  initialParams: Record<string, string>;
  accessToken: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PropertiesTable({
  initialData,
  initialStats,
  initialParams,
  accessToken,
}: PropertiesTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [status, setStatus] = useState(initialParams.status ?? "");
  const [purpose, setPurpose] = useState(initialParams.listing_purpose ?? "");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchPage = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setError(false);
      const params: Record<string, string> = {
        page_size: "20",
        ...(search && { search }),
        ...(status && { status }),
        ...(purpose && { listing_purpose: purpose }),
        ...overrides,
      };
      const qs = new URLSearchParams(params).toString();
      router.replace(`${pathname}?${qs}`, { scroll: false });
      try {
        const result = await apiFetch<PaginatedProperties>(
          `/api/admin/properties/?${qs}`,
          {},
          accessToken,
        );
        setData(result);
      } catch {
        setError(true);
      }
    },
    [search, status, purpose, accessToken, pathname, router],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => fetchPage({ page: "1" }));
  };

  const handleFilter = (key: string, value: string) => {
    if (key === "status") setStatus(value);
    if (key === "listing_purpose") setPurpose(value);
    startTransition(() => fetchPage({ page: "1", [key]: value }));
  };

  const handlePage = (page: number) => {
    startTransition(() => fetchPage({ page: String(page) }));
  };

  const properties = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Properties</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {data ? `${data.count.toLocaleString()} total` : "—"}
          </p>
        </div>
        <Link
          href="/properties/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New property
        </Link>
      </div>

      {/* ── Stats ── */}
      <StatsStrip stats={initialStats} />

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, city, state…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
          {[
            {
              key: "status",
              val: status,
              opts: STATUS_OPTIONS,
              setter: setStatus,
            },
            {
              key: "listing_purpose",
              val: purpose,
              opts: PURPOSE_OPTIONS,
              setter: setPurpose,
            },
          ].map(({ key, val, opts }) => (
            <select
              key={key}
              value={val}
              onChange={(e) => handleFilter(key, e.target.value)}
              className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
            >
              {opts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {isPending && (
          <div className="flex items-center gap-2 px-5 py-3 bg-zinc-50 border-b border-zinc-100 text-xs text-zinc-500">
            <Loader2 className="w-3 h-3 animate-spin" /> Loading…
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-red-600">
            <TriangleAlert className="w-4 h-4" /> Failed to load properties.
          </div>
        )}
        {!error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Property
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Owner
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Price
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
                  Stats
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {properties.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-zinc-400"
                  >
                    No properties found.
                  </td>
                </tr>
              )}
              {properties.map((prop) => (
                <tr
                  key={prop.id}
                  className="hover:bg-zinc-50/60 transition-colors group"
                >
                  {/* Property info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {prop.images?.[0]?.image_url ? (
                          <img
                            src={prop.images[0].image_url}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-zinc-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 truncate max-w-[180px]">
                          {prop.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {prop.city}, {prop.state} ·{" "}
                          {prop.property_type.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <p className="text-sm text-zinc-700 truncate max-w-[140px]">
                      {prop.owner?.name || "—"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {prop.owner?.is_agent ? "Agent" : "User"}
                    </p>
                  </td>

                  {/* Price */}
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-sm font-semibold text-zinc-800 tabular-nums">
                      {formatPrice(prop.price, prop.currency)}
                    </p>
                    <p className="text-xs text-zinc-400 capitalize">
                      {prop.listing_purpose}
                    </p>
                  </td>

                  {/* Stats */}
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {prop.views ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {prop.inquiries ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        {prop.bookmarked ?? 0}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <StatusBadge status={prop.status} />
                  </td>

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/properties/${prop.id}`}
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
