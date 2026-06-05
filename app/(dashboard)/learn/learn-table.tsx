"use client";

// app/(dashboard)/learn/learn-table.tsx
import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { createLearnAction, deleteLearnAction } from "./actions";
import type { LearnResource, PaginatedLearn, LearnStats } from "./types";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  ArrowUpRight,
  Loader2,
  TriangleAlert,
  Eye,
  BookOpen,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORIES = ["Real Estate", "Finance", "Investment"] as const;

function CategoryBadge({ category }: { category: string }) {
  const map: Record<string, string> = {
    "Real Estate": "bg-blue-50 text-blue-700",
    Finance: "bg-green-50 text-green-700",
    Investment: "bg-purple-50 text-purple-700",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-md text-xs font-medium",
        map[category] ?? "bg-zinc-100 text-zinc-500",
      )}
    >
      {category}
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

function getYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: LearnStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3 flex items-center gap-3">
        <BookOpen className="w-4 h-4 text-zinc-500 shrink-0" />
        <div>
          <p className="text-lg font-bold text-zinc-900 tabular-nums">
            {stats.total}
          </p>
          <p className="text-xs text-zinc-400">Total resources</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3 flex items-center gap-3">
        <Eye className="w-4 h-4 text-blue-500 shrink-0" />
        <div>
          <p className="text-lg font-bold text-zinc-900 tabular-nums">
            {stats.total_views.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400">Total views</p>
        </div>
      </div>
      {stats.by_category.slice(0, 2).map((c) => (
        <div
          key={c.category}
          className="bg-white rounded-2xl border border-zinc-100 px-4 py-3 flex items-center gap-3"
        >
          <Play className="w-4 h-4 text-zinc-400 shrink-0" />
          <div>
            <p className="text-lg font-bold text-zinc-900 tabular-nums">
              {c.count}
            </p>
            <p className="text-xs text-zinc-400">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────

function CreateLearnModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: LearnResource) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Real Estate");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState("");

  // Live YouTube preview
  const previewId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!description.trim()) e.description = "Description is required.";
    if (!youtubeUrl.trim()) e.youtubeUrl = "YouTube URL is required.";
    else if (!previewId) e.youtubeUrl = "Invalid YouTube URL.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    setServerError("");
    startTransition(async () => {
      try {
        const created = await createLearnAction({
          title: title.trim(),
          description: description.trim(),
          category,
          youtube_url: youtubeUrl.trim(),
          duration: duration.trim() || undefined,
        });
        onCreated(created);
        onClose();
      } catch (err: unknown) {
        setServerError(
          err instanceof Error ? err.message : "Failed to create.",
        );
      }
    });
  };

  const inputCls = (err?: string) =>
    clsx(
      "w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300",
      err ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white",
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
              <Play className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Add resource</p>
              <p className="text-xs text-zinc-400">New learn video</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {serverError && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
              {serverError}
            </div>
          )}

          {/* YouTube URL first — so preview shows early */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              YouTube URL <span className="text-red-400">*</span>
            </label>
            <input
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                setErrors((p) => ({ ...p, youtubeUrl: "" }));
              }}
              placeholder="https://youtube.com/watch?v=..."
              className={inputCls(errors.youtubeUrl)}
            />
            {errors.youtubeUrl && (
              <p className="text-xs text-red-500">{errors.youtubeUrl}</p>
            )}
          </div>

          {/* Thumbnail preview */}
          {previewId && (
            <div className="rounded-xl overflow-hidden border border-zinc-100 aspect-video bg-zinc-100">
              <img
                src={`https://img.youtube.com/vi/${previewId}/maxresdefault.jpg`}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((p) => ({ ...p, title: "" }));
              }}
              placeholder="e.g. How to buy your first property"
              className={inputCls(errors.title)}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((p) => ({ ...p, description: "" }));
              }}
              rows={3}
              placeholder="Brief description of what the video covers…"
              className={clsx(inputCls(errors.description), "resize-none")}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls()}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">
                Duration
              </label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 12:45"
                className={inputCls()}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="flex-1 px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Add resource
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main table component ──────────────────────────────────────────────────────

interface LearnTableProps {
  initialData: PaginatedLearn | null;
  initialStats: LearnStats | null;
  initialParams: Record<string, string>;
  accessToken: string;
}

export default function LearnTable({
  initialData,
  initialStats,
  initialParams,
  accessToken,
}: LearnTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [category, setCategory] = useState(initialParams.category ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchPage = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setError(false);
      const params: Record<string, string> = {
        page_size: "20",
        ...(search && { search }),
        ...(category && { category }),
        ...overrides,
      };
      const qs = new URLSearchParams(params).toString();
      router.replace(`${pathname}?${qs}`, { scroll: false });
      try {
        const result = await apiFetch<PaginatedLearn>(
          `/api/admin/learn/?${qs}`,
          {},
          accessToken,
        );
        setData(result);
      } catch {
        setError(true);
      }
    },
    [search, category, accessToken, pathname, router],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => fetchPage({ page: "1" }));
  };

  const handleCreated = (resource: LearnResource) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            count: prev.count + 1,
            results: [resource, ...prev.results],
          }
        : null,
    );
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    startTransition(async () => {
      try {
        await deleteLearnAction(id);
        setData((prev) =>
          prev
            ? {
                ...prev,
                count: prev.count - 1,
                results: prev.results.filter((r) => r.id !== id),
              }
            : null,
        );
      } catch {
        /* handled by redirect in action */
      } finally {
        setDeletingId(null);
      }
    });
  };

  const resources = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {showCreate && (
        <CreateLearnModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Learn</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {data ? `${data.count.toLocaleString()} resources` : "—"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add resource
        </button>
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
            placeholder="Search title…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              startTransition(() =>
                fetchPage({ page: "1", category: e.target.value }),
              );
            }}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
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
            <TriangleAlert className="w-4 h-4" /> Failed to load resources.
          </div>
        )}
        {!error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Resource
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Category
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Views
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
                  Added
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {resources.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-zinc-400"
                  >
                    No resources found.
                  </td>
                </tr>
              )}
              {resources.map((resource) => (
                <tr
                  key={resource.id}
                  className="hover:bg-zinc-50/60 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                        {resource.thumbnail_url ? (
                          <img
                            src={resource.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-4 h-4 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 truncate max-w-[200px]">
                          {resource.title}
                        </p>
                        {resource.duration && (
                          <p className="text-xs text-zinc-400">
                            {resource.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <CategoryBadge category={resource.category} />
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Eye className="w-3 h-3" />{" "}
                      {resource.view_count.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-zinc-400">
                    {formatDate(resource.created_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/learn/${resource.id}`}
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                      >
                        Edit <ArrowUpRight className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => handleDelete(resource.id)}
                        disabled={deletingId === resource.id}
                        className="text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingId === resource.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
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
