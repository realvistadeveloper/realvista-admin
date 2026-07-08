"use client";

// app/(dashboard)/properties/portfolio-table.tsx
import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type {
  PortfolioProperty,
  PortfolioPropertyDetail,
  PaginatedPortfolio,
  PortfolioStats,
} from "./portfolio-types";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TriangleAlert,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  MapPin,
  BarChart2,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(amount: string, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  } catch {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-50 text-green-700",
  occupied: "bg-blue-50 text-blue-700",
  under_maintenance: "bg-amber-50 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  under_maintenance: "Under maintenance",
};

// ── Stats strip ───────────────────────────────────────────────────────────────

function PortfolioStatsStrip({ stats }: { stats: PortfolioStats | null }) {
  if (!stats) return null;
  const p = stats.ngn_portfolio;
  const c = stats.ngn_cashflow;
  const appreciation = parseFloat(p.total_appreciation);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3">
          <p className="text-xl font-bold text-zinc-900 tabular-nums">
            {stats.total.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Total properties</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3">
          <p className="text-xl font-bold text-blue-700 tabular-nums">
            {fmtCurrency(p.total_current_value)}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Portfolio value (NGN)</p>
        </div>
        <div
          className={`rounded-2xl border px-4 py-3 ${appreciation >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
        >
          <div className="flex items-center gap-1.5">
            {appreciation >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
            )}
            <p
              className={`text-xl font-bold tabular-nums ${appreciation >= 0 ? "text-green-700" : "text-red-600"}`}
            >
              {fmtCurrency(p.total_appreciation)}
            </p>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Total appreciation (NGN)
          </p>
        </div>
        <div
          className={`rounded-2xl border px-4 py-3 ${parseFloat(c.net) >= 0 ? "bg-white border-zinc-100" : "bg-red-50 border-red-100"}`}
        >
          <p
            className={`text-xl font-bold tabular-nums ${parseFloat(c.net) >= 0 ? "text-zinc-900" : "text-red-600"}`}
          >
            {fmtCurrency(c.net)}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Net cashflow (NGN)</p>
        </div>
      </div>

      {/* Top owners */}
      {stats.top_owners.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Top portfolio owners
          </p>
          <div className="flex flex-wrap gap-2">
            {stats.top_owners.map((u) => (
              <div
                key={u.id}
                className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-zinc-600">
                    {u.name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-800">{u.name}</p>
                  <p className="text-xs text-zinc-400">
                    {u.count} propert{u.count === 1 ? "y" : "ies"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Property detail drawer ────────────────────────────────────────────────────

function PropertyDetailDrawer({
  propertyId,
  accessToken,
  onClose,
}: {
  propertyId: number;
  accessToken: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<PortfolioPropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"overview" | "financials" | "media">(
    "overview",
  );

  useState(() => {
    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
        const res = await fetch(`${base}/api/admin/portfolio/${propertyId}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error();
        setDetail(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  });

  const DETAIL_TABS = [
    { id: "overview" as const, label: "Overview" },
    { id: "financials" as const, label: "Financials" },
    { id: "media" as const, label: "Media" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <p className="font-semibold text-zinc-900">
              {detail?.title ?? "Loading…"}
            </p>
            {detail && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {detail.owner_name} · {detail.owner_email}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {detail && (
          <div className="flex items-center gap-1 px-6 py-3 border-b border-zinc-100 shrink-0">
            {DETAIL_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                  tab === t.id
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500 text-center py-10">
              Failed to load property details.
            </p>
          )}

          {detail && tab === "overview" && (
            <div className="space-y-4">
              {/* Status + type */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={clsx(
                    "px-2 py-0.5 rounded-md text-xs font-medium",
                    STATUS_COLORS[detail.status],
                  )}
                >
                  {STATUS_LABELS[detail.status]}
                </span>
                <span className="px-2 py-0.5 rounded-md text-xs bg-zinc-100 text-zinc-500 capitalize">
                  {detail.property_type.replace(/_/g, " ")}
                </span>
                {detail.is_group_property && (
                  <span className="px-2 py-0.5 rounded-md text-xs bg-purple-50 text-purple-700">
                    Group property
                  </span>
                )}
                {detail.is_listed && (
                  <span className="px-2 py-0.5 rounded-md text-xs bg-blue-50 text-blue-700">
                    Listed on market
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="bg-zinc-50 rounded-xl p-4 space-y-1.5 text-xs">
                <div className="flex gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-zinc-600">
                    <p>{detail.address}</p>
                    {detail.city && <p>{detail.city}</p>}
                    <p>{detail.location}</p>
                  </div>
                </div>
              </div>

              {/* Key specs */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                  ["Area", detail.area ? `${detail.area} m²` : "—"],
                  ["Units", String(detail.num_units)],
                  [
                    "Year bought",
                    detail.year_bought ? String(detail.year_bought) : "—",
                  ],
                  ["Added", fmtDate(detail.added_on)],
                  ["Incomes", String(detail.income_count)],
                  ["Expenses", String(detail.expenses_count)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between py-1 border-b border-zinc-50"
                  >
                    <span className="text-zinc-400">{label}</span>
                    <span className="text-zinc-700">{value}</span>
                  </div>
                ))}
              </div>

              {detail.description && (
                <div className="bg-zinc-50 rounded-xl p-4">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {detail.description}
                  </p>
                </div>
              )}

              {/* Value history mini chart */}
              {detail.value_history.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Value history
                  </p>
                  <div className="flex items-end gap-1.5 h-12 bg-zinc-50 rounded-xl px-3 py-2">
                    {detail.value_history.map((v, i) => {
                      const vals = detail.value_history.map((x) =>
                        parseFloat(x.value),
                      );
                      const min = Math.min(...vals);
                      const max = Math.max(...vals);
                      const pct =
                        max > min
                          ? ((parseFloat(v.value) - min) / (max - min)) * 100
                          : 50;
                      return (
                        <div
                          key={v.id}
                          title={`${fmtDate(v.recorded_at)}: ${fmtCurrency(v.value, detail.currency)}`}
                          className="flex-1 bg-blue-400 rounded-sm min-h-[4px]"
                          style={{ height: `${Math.max(pct, 8)}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {detail && tab === "financials" && (
            <div className="space-y-4">
              {/* Value summary */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Initial cost",
                    value: fmtCurrency(detail.initial_cost, detail.currency),
                    color: "text-zinc-700",
                  },
                  {
                    label: "Current value",
                    value: fmtCurrency(detail.current_value, detail.currency),
                    color: "text-blue-700",
                  },
                  {
                    label: "Appreciation",
                    value: detail.appreciation
                      ? fmtCurrency(detail.appreciation, detail.currency)
                      : "—",
                    color:
                      detail.appreciation &&
                      parseFloat(detail.appreciation) >= 0
                        ? "text-green-700"
                        : "text-red-600",
                  },
                  {
                    label: "ROI",
                    value: detail.roi !== null ? `${detail.roi}%` : "—",
                    color:
                      (detail.roi ?? 0) >= 0
                        ? "text-green-700"
                        : "text-red-600",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-zinc-50 rounded-xl p-3">
                    <p className={`text-base font-bold tabular-nums ${color}`}>
                      {value}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Net cashflow */}
              <div className="bg-zinc-50 rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-zinc-500">Net cashflow</span>
                <span
                  className={`font-bold tabular-nums ${parseFloat(detail.net_income) >= 0 ? "text-green-700" : "text-red-600"}`}
                >
                  {fmtCurrency(detail.net_income, detail.currency)}
                </span>
              </div>

              {/* Income list */}
              {detail.incomes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Income ({detail.incomes.length})
                  </p>
                  <div className="space-y-1">
                    {detail.incomes.map((inc) => (
                      <div
                        key={inc.id}
                        className="flex justify-between text-sm py-1.5 border-b border-zinc-50"
                      >
                        <div>
                          <p className="text-zinc-700 text-xs">
                            {inc.description || "Income"}
                          </p>
                          <p className="text-zinc-400 text-xs">
                            {fmtDate(inc.date_received)}
                          </p>
                        </div>
                        <p className="font-medium text-green-600 tabular-nums">
                          +{fmtCurrency(inc.amount, inc.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses list */}
              {detail.expenses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Expenses ({detail.expenses.length})
                  </p>
                  <div className="space-y-1">
                    {detail.expenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex justify-between text-sm py-1.5 border-b border-zinc-50"
                      >
                        <div>
                          <p className="text-zinc-700 text-xs">
                            {exp.description || "Expense"}
                          </p>
                          <p className="text-zinc-400 text-xs">
                            {fmtDate(exp.date_incurred)}
                          </p>
                        </div>
                        <p className="font-medium text-red-500 tabular-nums">
                          -{fmtCurrency(exp.amount, exp.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {detail && tab === "media" && (
            <div className="space-y-4">
              {detail.images.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Images ({detail.images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {detail.images.map((img) => (
                      <div
                        key={img.id}
                        className="aspect-square rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100"
                      >
                        <img
                          src={img.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-zinc-300 gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <p className="text-sm">No images uploaded</p>
                </div>
              )}

              {detail.files.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Files ({detail.files.length})
                  </p>
                  {detail.files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between py-2.5 border-b border-zinc-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <p className="text-sm text-zinc-700">
                          {f.name || "File"}
                        </p>
                      </div>
                      <a
                        href={f.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main portfolio table ──────────────────────────────────────────────────────

interface PortfolioTableProps {
  initialData: PaginatedPortfolio | null;
  initialStats: PortfolioStats | null;
  accessToken: string;
}

export default function PortfolioTable({
  initialData,
  initialStats,
  accessToken,
}: PortfolioTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchPage = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setError(false);
      const params: Record<string, string> = {
        page_size: "20",
        tab: "portfolio",
        ...(search && { psearch: search }),
        ...(typeFilter && { ptype: typeFilter }),
        ...(statusFilter && { pstatus: statusFilter }),
        ...overrides,
      };
      const qs = new URLSearchParams(params).toString();
      router.replace(`${pathname}?${qs}`, { scroll: false });
      try {
        const apiQs = new URLSearchParams({
          page_size: "20",
          ...(search && { search }),
          ...(typeFilter && { property_type: typeFilter }),
          ...(statusFilter && { status: statusFilter }),
          ...(overrides.page && { page: overrides.page }),
        }).toString();
        const result = await apiFetch<PaginatedPortfolio>(
          `/api/admin/portfolio/?${apiQs}`,
          {},
          accessToken,
        );
        setData(result);
      } catch {
        setError(true);
      }
    },
    [search, typeFilter, statusFilter, accessToken, pathname, router],
  );

  const properties = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {selectedId && (
        <PropertyDetailDrawer
          propertyId={selectedId}
          accessToken={accessToken}
          onClose={() => setSelectedId(null)}
        />
      )}

      <PortfolioStatsStrip stats={initialStats} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(() => fetchPage({ page: "1" }));
          }}
          className="relative flex-1 max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, owner, city…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              startTransition(() => fetchPage({ page: "1" }));
            }}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="under_maintenance">Under maintenance</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              startTransition(() => fetchPage({ page: "1" }));
            }}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">All types</option>
            {[
              ["house", "House"],
              ["apartment", "Apartment"],
              ["land", "Land"],
              ["commercial", "Commercial"],
              ["office", "Office"],
              ["duplex", "Duplex"],
              ["bungalow", "Bungalow"],
              ["terrace", "Terrace"],
              ["farm_land", "Farm Land"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
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
            <TriangleAlert className="w-4 h-4" /> Failed to load portfolio
            properties.
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
                  Value
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
                  ROI
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
                    No portfolio properties found.
                  </td>
                </tr>
              )}
              {properties.map((prop) => (
                <tr
                  key={prop.id}
                  className="hover:bg-zinc-50/60 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-8 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                        {prop.thumbnail ? (
                          <img
                            src={prop.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="w-3.5 h-3.5 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 truncate max-w-[160px]">
                          {prop.title}
                        </p>
                        <p className="text-xs text-zinc-400 capitalize">
                          {prop.property_type.replace(/_/g, " ")}
                          {prop.city && ` · ${prop.city}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <p className="text-sm text-zinc-700 truncate max-w-[140px]">
                      {prop.owner_name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {prop.owner_email}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-sm font-medium text-zinc-800 tabular-nums">
                      {fmtCurrency(prop.current_value, prop.currency)}
                    </p>
                    {prop.appreciation && (
                      <p
                        className={`text-xs tabular-nums ${parseFloat(prop.appreciation) >= 0 ? "text-green-600" : "text-red-500"}`}
                      >
                        {parseFloat(prop.appreciation) >= 0 ? "+" : ""}
                        {fmtCurrency(prop.appreciation, prop.currency)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {prop.roi !== null ? (
                      <span
                        className={`text-sm font-semibold ${prop.roi >= 0 ? "text-green-600" : "text-red-500"}`}
                      >
                        {prop.roi >= 0 ? "+" : ""}
                        {prop.roi}%
                      </span>
                    ) : (
                      <span className="text-zinc-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-md text-xs font-medium",
                        STATUS_COLORS[prop.status] ??
                          "bg-zinc-100 text-zinc-500",
                      )}
                    >
                      {STATUS_LABELS[prop.status] ?? prop.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedId(prop.id)}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      View <Eye className="w-3 h-3" />
                    </button>
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
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                startTransition(() =>
                  fetchPage({ page: String(currentPage + 1) }),
                )
              }
              disabled={currentPage >= totalPages || isPending}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
