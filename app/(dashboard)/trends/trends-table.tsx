"use client";

// app/(dashboard)/trends/trends-table.tsx
import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Trend, PaginatedTrends, TrendStats, Category } from "./types";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
  ArrowUpRight,
  Loader2,
  TriangleAlert,
  Eye,
  BookOpen,
  PenLine,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatsStrip({ stats }: { stats: TrendStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Total",
          value: stats.total,
          icon: FileText,
          color: "text-zinc-600",
        },
        {
          label: "Published",
          value: stats.published,
          icon: BookOpen,
          color: "text-green-600",
        },
        {
          label: "Drafts",
          value: stats.drafts,
          icon: PenLine,
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

interface TrendsTableProps {
  initialData: PaginatedTrends | null;
  initialStats: TrendStats | null;
  categories: Category[];
  initialParams: Record<string, string>;
  accessToken: string;
}

export default function TrendsTable({
  initialData,
  initialStats,
  categories,
  initialParams,
  accessToken,
}: TrendsTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [category, setCategory] = useState(initialParams.category ?? "");
  const [publish, setPublish] = useState(initialParams.publish ?? "");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchPage = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setError(false);
      const params: Record<string, string> = {
        page_size: "20",
        ...(search && { search }),
        ...(category && { category }),
        ...(publish && { publish }),
        ...overrides,
      };
      const qs = new URLSearchParams(params).toString();
      router.replace(`${pathname}?${qs}`, { scroll: false });
      try {
        const result = await apiFetch<PaginatedTrends>(
          `/api/admin/trends/?${qs}`,
          {},
          accessToken,
        );
        setData(result);
      } catch {
        setError(true);
      }
    },
    [search, category, publish, accessToken, pathname, router],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => fetchPage({ page: "1" }));
  };

  const handleFilter = (key: string, value: string) => {
    if (key === "category") setCategory(value);
    if (key === "publish") setPublish(value);
    startTransition(() => fetchPage({ page: "1", [key]: value }));
  };

  const trends = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Trends</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {data ? `${data.count.toLocaleString()} articles` : "—"}
          </p>
        </div>
        <Link
          href="/trends/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New article
        </Link>
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
            placeholder="Search title, source…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => handleFilter("category", e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={publish}
            onChange={(e) => handleFilter("publish", e.target.value)}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">All status</option>
            <option value="true">Published</option>
            <option value="false">Draft</option>
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
            <TriangleAlert className="w-4 h-4" /> Failed to load trends.
          </div>
        )}
        {!error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Article
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Category
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Views
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {trends.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-zinc-400"
                  >
                    No articles found.
                  </td>
                </tr>
              )}
              {trends.map((trend) => (
                <tr
                  key={trend.id}
                  className="hover:bg-zinc-50/60 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-900 truncate max-w-[240px]">
                      {trend.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate max-w-[240px] mt-0.5">
                      {trend.excerpt}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600">
                      {trend.category_name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Eye className="w-3 h-3" /> {trend.views ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-xs text-zinc-400">
                    {formatDate(trend.date_created)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-md text-xs font-medium",
                        trend.publish
                          ? "bg-green-50 text-green-700"
                          : "bg-zinc-100 text-zinc-500",
                      )}
                    >
                      {trend.publish ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/trends/${trend.id}`}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Edit <ArrowUpRight className="w-3 h-3" />
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
