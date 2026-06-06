"use client";

// app/(dashboard)/promotions/promotions-table.tsx
import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { createPromotionAction } from "./actions";
import type { Promotion, PaginatedPromotions, PromotionStats } from "./types";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Tag,
  Plus,
  ArrowUpRight,
  Loader2,
  TriangleAlert,
  Zap,
  TrendingUp,
  X,
  Check,
  DollarSign,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({
  active,
  activeNow,
}: {
  active: boolean;
  activeNow: boolean;
}) {
  if (!active)
    return (
      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-500">
        Inactive
      </span>
    );
  if (activeNow)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Paused
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
        type === "referral"
          ? "bg-blue-50 text-blue-700"
          : "bg-zinc-100 text-zinc-500",
      )}
    >
      {type}
    </span>
  );
}

function formatAmount(amount: string, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: PromotionStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Total",
          value: stats.total_promotions,
          icon: Tag,
          color: "text-zinc-600",
        },
        {
          label: "Active",
          value: stats.active_promotions,
          icon: Zap,
          color: "text-green-600",
        },
        {
          label: "Total payouts",
          value: stats.total_payouts,
          icon: Users,
          color: "text-blue-600",
        },
        {
          label: "Reversed",
          value: stats.reversed_payouts,
          icon: TrendingUp,
          color: "text-amber-600",
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

// ── Create modal ──────────────────────────────────────────────────────────────

function CreatePromotionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: Promotion) => void;
}) {
  const [name, setName] = useState("");
  const [promotionType, setPromotionType] = useState("other");
  const [currency, setCurrency] = useState("NGN");
  const [rewardAmount, setRewardAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isPending, startTransition] = useTransition();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!rewardAmount) e.rewardAmount = "Reward amount is required.";
    else if (parseFloat(rewardAmount) <= 0)
      e.rewardAmount = "Must be greater than zero.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    setServerError("");
    startTransition(async () => {
      try {
        const created = await createPromotionAction({
          name: name.trim(),
          promotion_type: promotionType,
          currency,
          reward_amount: rewardAmount,
          is_active: isActive,
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
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
              <Tag className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">New promotion</p>
              <p className="text-xs text-zinc-400">
                Code auto-generated from name
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {serverError && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="e.g. Summer Referral Bonus"
              className={inputCls(errors.name)}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">Type</label>
              <select
                value={promotionType}
                onChange={(e) => setPromotionType(e.target.value)}
                className={inputCls()}
              >
                <option value="other">Other</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputCls()}
              >
                <option value="NGN">NGN — Naira</option>
                <option value="USD">USD — Dollar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Reward amount <span className="text-red-400">*</span>
            </label>
            <input
              value={rewardAmount}
              type="number"
              min="0"
              step="0.01"
              onChange={(e) => {
                setRewardAmount(e.target.value);
                setErrors((p) => ({ ...p, rewardAmount: "" }));
              }}
              placeholder="0.00"
              className={inputCls(errors.rewardAmount)}
            />
            {errors.rewardAmount && (
              <p className="text-xs text-red-500">{errors.rewardAmount}</p>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-zinc-700">
                Active on creation
              </p>
              <p className="text-xs text-zinc-400">Can be toggled later</p>
            </div>
            <button
              onClick={() => setIsActive((p) => !p)}
              className={clsx(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                isActive ? "bg-green-500" : "bg-zinc-200",
              )}
            >
              <span
                className={clsx(
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                  isActive ? "translate-x-4" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-zinc-100">
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
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

interface PromotionsTableProps {
  initialData: PaginatedPromotions | null;
  initialStats: PromotionStats | null;
  initialParams: Record<string, string>;
  accessToken: string;
}

export default function PromotionsTable({
  initialData,
  initialStats,
  initialParams,
  accessToken,
}: PromotionsTableProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [typeFilter, setTypeFilter] = useState(
    initialParams.promotion_type ?? "",
  );
  const [activeFilter, setActiveFilter] = useState(
    initialParams.is_active ?? "",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchPage = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setError(false);
      const params: Record<string, string> = {
        page_size: "20",
        ...(search && { search }),
        ...(typeFilter && { promotion_type: typeFilter }),
        ...(activeFilter && { is_active: activeFilter }),
        ...overrides,
      };
      const qs = new URLSearchParams(params).toString();
      router.replace(`${pathname}?${qs}`, { scroll: false });
      try {
        const result = await apiFetch<PaginatedPromotions>(
          `/api/admin/promotions/?${qs}`,
          {},
          accessToken,
        );
        setData(result);
      } catch {
        setError(true);
      }
    },
    [search, typeFilter, activeFilter, accessToken, pathname, router],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => fetchPage({ page: "1" }));
  };

  const handleCreated = (p: Promotion) => {
    setData((prev) =>
      prev
        ? { ...prev, count: prev.count + 1, results: [p, ...prev.results] }
        : null,
    );
  };

  const promotions = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {showCreate && (
        <CreatePromotionModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Promotions</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {data ? `${data.count.toLocaleString()} total` : "—"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New promotion
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
            placeholder="Search name or code…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
        </form>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              startTransition(() =>
                fetchPage({ page: "1", promotion_type: e.target.value }),
              );
            }}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">All types</option>
            <option value="referral">Referral</option>
            <option value="other">Other</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              startTransition(() =>
                fetchPage({ page: "1", is_active: e.target.value }),
              );
            }}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          >
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
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
            <TriangleAlert className="w-4 h-4" /> Failed to load promotions.
          </div>
        )}
        {!error && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Promotion
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Reward
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden lg:table-cell">
                  Earnings
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {promotions.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-zinc-400"
                  >
                    No promotions found.
                  </td>
                </tr>
              )}
              {promotions.map((promo) => (
                <tr
                  key={promo.id}
                  className="hover:bg-zinc-50/60 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-900 truncate max-w-[180px]">
                      {promo.name}
                    </p>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      {promo.code}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <TypeBadge type={promo.promotion_type} />
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <p className="text-sm font-semibold text-zinc-800 tabular-nums">
                      {formatAmount(promo.reward_amount, promo.currency)}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <p className="text-sm text-zinc-700 tabular-nums">
                      {formatAmount(promo.total_earned, promo.currency)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {promo.earnings_count} payouts
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      active={promo.is_active}
                      activeNow={promo.is_active_now}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/promotions/${promo.id}`}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 opacity-0 group-hover:opacity-100 transition-colors"
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
