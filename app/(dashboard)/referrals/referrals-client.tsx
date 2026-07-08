"use client";

// app/(dashboard)/referrals/referrals-client.tsx
import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { markEarningPaidAction, cancelEarningAction } from "./actions";
import type {
  Referral,
  PaginatedReferrals,
  ReferralStats,
  ReferralEarning,
  UserReferralSummary,
  EarningStatus,
} from "./types";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  ArrowUpRight,
  Loader2,
  TriangleAlert,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  X,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  Smartphone,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(amount: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
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

function StatusBadge({ status }: { status: EarningStatus }) {
  const map: Record<EarningStatus, string> = {
    pending: "bg-amber-50 text-amber-700",
    paid: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
        map[status],
      )}
    >
      {status}
    </span>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: ReferralStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Total referrals",
          value: stats.total_referrals,
          icon: Users,
          color: "text-zinc-600",
        },
        {
          label: "Pending payout",
          value: formatAmount(stats.total_pending_amount),
          icon: Clock,
          color: "text-amber-600",
          raw: true,
        },
        {
          label: "Total paid out",
          value: formatAmount(stats.total_paid_amount),
          icon: DollarSign,
          color: "text-green-600",
          raw: true,
        },
        {
          label: "Suspicious",
          value: stats.suspicious_count,
          icon: ShieldAlert,
          color: "text-red-500",
        },
      ].map(({ label, value, icon: Icon, color, raw }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-zinc-100 px-4 py-3 flex items-center gap-3"
        >
          <Icon className={clsx("w-4 h-4 shrink-0", color)} />
          <div>
            <p
              className={clsx(
                "font-bold text-zinc-900 tabular-nums",
                raw ? "text-base" : "text-lg",
              )}
            >
              {value}
            </p>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Earning action row ────────────────────────────────────────────────────────

function EarningRow({
  earning,
  onUpdate,
}: {
  earning: ReferralEarning;
  onUpdate: (e: ReferralEarning) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"pay" | "cancel" | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const updated =
          action === "pay"
            ? await markEarningPaidAction(earning.id, notes)
            : await cancelEarningAction(earning.id, notes);
        onUpdate(updated);
        setShowNotes(false);
        setNotes("");
        setAction(null);
      } catch {
        /* swallow — parent handles feedback */
      }
    });
  };

  return (
    <div
      className={clsx(
        "rounded-xl border p-4 space-y-2",
        earning.is_suspicious
          ? "border-amber-200 bg-amber-50/40"
          : "border-zinc-100 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={earning.status} />
            {earning.is_suspicious && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-600">
                <ShieldAlert className="w-3 h-3" /> Suspicious
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-zinc-800 mt-1">
            {earning.referred_user_name}
            <span className="text-zinc-400 font-normal">
              {" "}
              · {earning.referred_user_email}
            </span>
          </p>
          {earning.is_suspicious && earning.suspicious_reason && (
            <p className="text-xs text-amber-700 mt-1 bg-amber-100 rounded-lg px-2.5 py-1.5">
              {earning.suspicious_reason}
            </p>
          )}
          {earning.notes && (
            <p className="text-xs text-zinc-400 mt-1 italic">
              Note: {earning.notes}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-zinc-900 tabular-nums">
            {formatAmount(earning.reward_amount)}
          </p>
          <p className="text-xs text-zinc-400">
            {earning.reward_percent}% of {formatAmount(earning.payment_amount)}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {formatDate(earning.created_at)}
          </p>
        </div>
      </div>

      {/* Action buttons — only for actionable statuses */}
      {earning.status === "pending" && !showNotes && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              setAction("pay");
              setShowNotes(true);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Mark paid
          </button>
          <button
            onClick={() => {
              setAction("cancel");
              setShowNotes(true);
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {showNotes && (
        <div className="pt-2 space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Notes for ${action === "pay" ? "payment" : "cancellation"} (optional)…`}
            rows={2}
            className="w-full text-xs border border-zinc-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNotes(false);
                setAction(null);
                setNotes("");
              }}
              className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className={clsx(
                "flex-1 px-3 py-1.5 text-xs rounded-lg font-medium disabled:opacity-60 flex items-center justify-center gap-1.5",
                action === "pay"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-red-600 text-white hover:bg-red-700",
              )}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Confirm {action === "pay" ? "payment" : "cancellation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Referral row with expandable earnings ─────────────────────────────────────

function ReferralRow({
  referral,
  accessToken,
}: {
  referral: Referral;
  accessToken: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [earnings, setEarnings] = useState<ReferralEarning[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadEarnings = async () => {
    if (earnings !== null) {
      setExpanded((p) => !p);
      return;
    }
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/admin/referrals/${referral.id}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      setEarnings(data.earnings ?? []);
      setExpanded(true);
    } catch {
      setEarnings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEarningUpdate = (updated: ReferralEarning) => {
    setEarnings(
      (prev) => prev?.map((e) => (e.id === updated.id ? updated : e)) ?? null,
    );
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border overflow-hidden transition-colors",
        referral.has_suspicious ? "border-amber-200" : "border-zinc-100",
      )}
    >
      {/* Main row */}
      <button
        onClick={loadEarnings}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/60 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-zinc-900">
              {referral.referred_user_name}
            </p>
            <span className="text-xs text-zinc-400">
              {referral.referred_user_email}
            </span>
            {referral.has_suspicious && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-500">
                <ShieldAlert className="w-3 h-3" /> Suspicious
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Referred by{" "}
            <span className="font-medium text-zinc-600">
              {referral.referrer_name}
            </span>
            {" · "}
            {referral.earnings_count} earning
            {referral.earnings_count !== 1 ? "s" : ""}
            {" · "}
            {formatDate(referral.created_at)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-zinc-800 tabular-nums">
            {formatAmount(referral.total_earned)}
          </p>
          <p className="text-xs text-zinc-400">total paid</p>
        </div>
        <div className="shrink-0 text-zinc-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded earnings */}
      {expanded && earnings !== null && (
        <div className="px-5 pb-5 space-y-3 border-t border-zinc-50 pt-4">
          {earnings.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">
              No earnings yet.
            </p>
          ) : (
            earnings.map((earning) => (
              <EarningRow
                key={earning.id}
                earning={earning}
                onUpdate={handleEarningUpdate}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── User referral summary panel ───────────────────────────────────────────────

function UserReferralPanel({
  userId,
  accessToken,
  onClose,
}: {
  userId: number;
  accessToken: string;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<UserReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useState(() => {
    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
        const res = await fetch(
          `${base}/api/admin/referrals/users/${userId}/`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!res.ok) throw new Error();
        setSummary(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <p className="font-semibold text-zinc-900">
            {summary ? `${summary.user.name}'s referrals` : "User referrals"}
          </p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500 text-center py-10">
              Failed to load referral data.
            </p>
          )}
          {summary && (
            <>
              {/* User info */}
              <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {summary.user.name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {summary.user.email}
                    </p>
                  </div>
                  <Link
                    href={`/users/${summary.user.id}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    View account <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Device info */}
                {(summary.user.device_id || summary.user.install_id) && (
                  <div className="flex items-center gap-2 pt-1">
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <div className="text-xs text-zinc-500 space-y-0.5">
                      {summary.user.device_id && (
                        <p>
                          Device:{" "}
                          <span className="font-mono">
                            {summary.user.device_id}
                          </span>
                        </p>
                      )}
                      {summary.user.install_id && (
                        <p>
                          Install:{" "}
                          <span className="font-mono">
                            {summary.user.install_id}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Referrals",
                    value: summary.total_referrals,
                    raw: false,
                  },
                  {
                    label: "Earned",
                    value: formatAmount(summary.total_earned),
                    raw: true,
                  },
                  {
                    label: "Pending",
                    value: formatAmount(summary.pending_earnings),
                    raw: true,
                  },
                  {
                    label: "Suspicious",
                    value: summary.suspicious_count,
                    raw: false,
                    warn: summary.suspicious_count > 0,
                  },
                ].map(({ label, value, warn }) => (
                  <div
                    key={label}
                    className={clsx(
                      "rounded-xl border p-3 text-center",
                      warn
                        ? "border-amber-200 bg-amber-50"
                        : "border-zinc-100 bg-zinc-50",
                    )}
                  >
                    <p
                      className={clsx(
                        "text-lg font-bold tabular-nums",
                        warn ? "text-amber-700" : "text-zinc-900",
                      )}
                    >
                      {value}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Referral list */}
              {summary.referrals.length === 0 ? (
                <div className="text-center py-8 text-sm text-zinc-400">
                  No referrals made yet.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Referred users
                  </p>
                  {summary.referrals.map((referral) => (
                    <ReferralRow
                      key={referral.id}
                      referral={referral}
                      accessToken={accessToken}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ReferralsClientProps {
  initialData: PaginatedReferrals | null;
  initialStats: ReferralStats | null;
  initialParams: Record<string, string>;
  accessToken: string;
}

export default function ReferralsClient({
  initialData,
  initialStats,
  initialParams,
  accessToken,
}: ReferralsClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(initialParams.search ?? "");
  const [suspFilter, setSuspFilter] = useState(
    initialParams.has_suspicious ?? "",
  );
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchPage = useCallback(
    async (overrides: Record<string, string> = {}) => {
      setError(false);
      const params: Record<string, string> = {
        page_size: "20",
        ...(search && { search }),
        ...(suspFilter && { has_suspicious: suspFilter }),
        ...overrides,
      };
      const qs = new URLSearchParams(params).toString();
      router.replace(`${pathname}?${qs}`, { scroll: false });
      try {
        const result = await apiFetch<PaginatedReferrals>(
          `/api/admin/referrals/?${qs}`,
          {},
          accessToken,
        );
        setData(result);
      } catch {
        setError(true);
      }
    },
    [search, suspFilter, accessToken, pathname, router],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => fetchPage({ page: "1" }));
  };

  const referrals = data?.results ?? [];
  const totalPages = data?.total_pages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="space-y-4">
      {selectedUserId && (
        <UserReferralPanel
          userId={selectedUserId}
          accessToken={accessToken}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Referrals</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {data ? `${data.count.toLocaleString()} referral records` : "—"}
        </p>
      </div>

      <StatsStrip stats={initialStats} />

      {/* Top referrers */}
      {initialStats?.top_referrers && initialStats.top_referrers.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Top referrers
          </p>
          <div className="flex flex-wrap gap-2">
            {initialStats.top_referrers.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-zinc-600">
                    {u.name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-800 truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-zinc-400">{u.count} referrals</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
          />
        </form>
        <select
          value={suspFilter}
          onChange={(e) => {
            setSuspFilter(e.target.value);
            startTransition(() =>
              fetchPage({ page: "1", has_suspicious: e.target.value }),
            );
          }}
          className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
        >
          <option value="">All referrals</option>
          <option value="true">Suspicious only</option>
          <option value="false">Clean only</option>
        </select>
      </div>

      {/* Referrals list */}
      {error && (
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-red-600 bg-white rounded-2xl border border-zinc-100">
          <TriangleAlert className="w-4 h-4" /> Failed to load referrals.
        </div>
      )}

      {isPending && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading…
        </div>
      )}

      <div className="space-y-3">
        {referrals.length === 0 && !error && !isPending && (
          <div className="bg-white rounded-2xl border border-zinc-100 px-5 py-12 text-center text-sm text-zinc-400">
            No referrals found.
          </div>
        )}
        {referrals.map((referral) => (
          <ReferralRow
            key={referral.id}
            referral={referral}
            accessToken={accessToken}
          />
        ))}
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
