"use client";
// app/(dashboard)/payments/payments-client.tsx
import { useState, useTransition } from "react";
import { apiFetch } from "@/lib/api";
import { refundPaymentAction } from "./actions";
import type {
  Payment,
  PaymentStats,
  PaginatedPayments,
  PaymentStatus,
} from "./types";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TriangleAlert,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  CreditCard,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  success: {
    label: "Success",
    color: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  failed: {
    label: "Failed",
    color: "bg-red-50 text-red-600",
    dot: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    color: "bg-zinc-100 text-zinc-500",
    dot: "bg-zinc-400",
  },
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
        c.color,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: PaymentStats | null }) {
  if (!stats) return null;
  const r = stats.revenue;
  const change = r.change_pct_30d;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3">
          <p className="text-xl font-bold text-zinc-900 tabular-nums">
            {stats.total_transactions.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Total transactions</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3">
          <p className="text-xl font-bold text-green-700 tabular-nums">
            {fmtNaira(r.net_naira)}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Net revenue</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-bold text-zinc-900 tabular-nums">
                {fmtNaira(r.last_30d_naira)}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">Last 30 days</p>
            </div>
            {change !== null && (
              <span
                className={clsx(
                  "inline-flex items-center gap-0.5 text-xs font-medium mt-0.5",
                  change >= 0 ? "text-green-600" : "text-red-500",
                )}
              >
                {change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3">
          <p className="text-xl font-bold text-zinc-400 tabular-nums">
            {fmtNaira(r.refunded_naira)}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Refunded</p>
        </div>
      </div>

      {/* Status breakdown + channel breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-zinc-100 px-5 py-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            By status
          </p>
          <div className="space-y-2">
            {(Object.entries(stats.by_status) as [PaymentStatus, number][]).map(
              ([s, count]) => {
                const pct = stats.total_transactions
                  ? Math.round((count / stats.total_transactions) * 100)
                  : 0;
                const c = STATUS_CONFIG[s];
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span
                      className={clsx("w-2 h-2 rounded-full shrink-0", c.dot)}
                    />
                    <span className="text-xs text-zinc-500 w-16 capitalize">
                      {s}
                    </span>
                    <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={clsx("h-full rounded-full", c.dot)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-zinc-700 tabular-nums w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {stats.by_channel.length > 0 && (
          <div className="bg-white rounded-2xl border border-zinc-100 px-5 py-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              By channel
            </p>
            <div className="space-y-2">
              {stats.by_channel.map((c) => (
                <div
                  key={c.channel}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-600 capitalize">{c.channel}</span>
                  <div className="text-right">
                    <span className="font-medium text-zinc-800 tabular-nums">
                      {fmtNaira(c.total_naira)}
                    </span>
                    <span className="text-zinc-400 text-xs ml-2">
                      ({c.count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Payment row ───────────────────────────────────────────────────────────────

function PaymentRow({
  payment: init,
  onUpdate,
}: {
  payment: Payment;
  onUpdate: (p: Payment) => void;
}) {
  const [payment, setPayment] = useState(init);
  const [expanded, setExpanded] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRefund = () => {
    startTransition(async () => {
      try {
        const r = await refundPaymentAction(payment.id, notes);
        const updated = { ...payment, status: r.status as PaymentStatus };
        setPayment(updated);
        onUpdate(updated);
        setShowRefund(false);
        setNotes("");
        setFeedback("Marked as refunded.");
        setTimeout(() => setFeedback(""), 4000);
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : "Failed.");
      }
    });
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border overflow-hidden",
        payment.status === "failed" ? "border-red-100" : "border-zinc-100",
      )}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/60 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900 tabular-nums">
              {fmtNaira(payment.amount_naira)}
            </p>
            <StatusBadge status={payment.status} />
            {payment.channel && (
              <span className="px-2 py-0.5 rounded-md text-xs bg-zinc-50 text-zinc-500 capitalize">
                {payment.channel}
              </span>
            )}
            {payment.plan_name && (
              <span className="px-2 py-0.5 rounded-md text-xs bg-blue-50 text-blue-600">
                {payment.plan_name}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {payment.user_name} · {payment.user_email} ·{" "}
            {fmtDate(payment.created_at)}
          </p>
        </div>
        <div className="shrink-0 text-zinc-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-50 pt-4">
          {feedback && (
            <div className="px-3 py-2 bg-green-50 text-green-700 text-xs rounded-lg">
              {feedback}
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              ["Reference", payment.reference],
              ["Paystack ref", payment.paystack_reference ?? "—"],
              ["Transaction ID", payment.paystack_transaction_id ?? "—"],
              ["Auth code", payment.authorization_code ?? "—"],
              ["Gateway", payment.gateway],
              ["IP address", payment.ip_address ?? "—"],
              ["Paid at", fmtDate(payment.paid_at)],
              ["Updated", fmtDate(payment.updated_at)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex gap-3 py-1 border-b border-zinc-50"
              >
                <span className="text-zinc-400 shrink-0 w-28">{label}</span>
                <span className="text-zinc-700 font-mono text-xs truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Metadata */}
          {Object.keys(payment.metadata).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Metadata
              </p>
              <pre className="bg-zinc-50 rounded-xl p-3 text-xs text-zinc-600 overflow-x-auto">
                {JSON.stringify(payment.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Refund */}
          {payment.status === "success" && !showRefund && (
            <button
              onClick={() => setShowRefund(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Mark as refunded
            </button>
          )}

          {showRefund && (
            <div className="bg-amber-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  This marks the payment as refunded in the admin system only.
                  You must separately process the refund on the Paystack
                  dashboard.
                </p>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Refund notes (optional)…"
                className="w-full text-xs border border-zinc-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300 bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRefund(false)}
                  className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-600 bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={isPending}
                  className="flex-1 px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Confirm refund
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PaymentsClient({
  initialStats,
  initialPayments,
  accessToken,
}: {
  initialStats: PaymentStats | null;
  initialPayments: PaginatedPayments | null;
  accessToken: string;
}) {
  const [payments, setPayments] = useState(initialPayments?.results ?? []);
  const [totalPages, setTotalPages] = useState(
    initialPayments?.total_pages ?? 1,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialPayments?.count ?? 0);

  const [search, setSearch] = useState("");
  const [statusFilt, setStatusFilt] = useState("");
  const [channelFilt, setChannelFilt] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  const fetchPayments = (
    page = 1,
    s = search,
    st = statusFilt,
    ch = channelFilt,
    df = dateFrom,
    dt = dateTo,
  ) => {
    setError(false);
    startTransition(async () => {
      const params: Record<string, string> = {
        page_size: "20",
        page: String(page),
      };
      if (s) params.search = s;
      if (st) params.status = st;
      if (ch) params.channel = ch;
      if (df) params.date_from = df;
      if (dt) params.date_to = dt;
      const qs = new URLSearchParams(params).toString();
      const result = await apiFetch<PaginatedPayments>(
        `/api/admin/payments/?${qs}`,
        {},
        accessToken,
      ).catch(() => null);
      if (result) {
        setPayments(result.results);
        setTotalPages(result.total_pages);
        setCurrentPage(result.page);
        setTotalCount(result.count);
      } else {
        setError(true);
      }
    });
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Payments</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {totalCount.toLocaleString()} transactions via Paystack
        </p>
      </div>

      <StatsStrip stats={initialStats} />

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchPayments(1);
            }}
            className="relative flex-1"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, email, or reference…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
            />
          </form>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={statusFilt}
              onChange={(e) => {
                setStatusFilt(e.target.value);
                fetchPayments(1, search, e.target.value);
              }}
              className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={channelFilt}
              onChange={(e) => {
                setChannelFilt(e.target.value);
                fetchPayments(1, search, statusFilt, e.target.value);
              }}
              className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
            >
              <option value="">All channels</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
              <option value="ussd">USSD</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 shrink-0">Date range:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              fetchPayments(
                1,
                search,
                statusFilt,
                channelFilt,
                e.target.value,
                dateTo,
              );
            }}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          />
          <span className="text-xs text-zinc-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              fetchPayments(
                1,
                search,
                statusFilt,
                channelFilt,
                dateFrom,
                e.target.value,
              );
            }}
            className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                fetchPayments(1, search, statusFilt, channelFilt, "", "");
              }}
              className="text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 bg-white rounded-2xl border border-zinc-100">
          <TriangleAlert className="w-4 h-4 shrink-0" /> Failed to load
          payments.
        </div>
      )}

      {/* Payment list */}
      <div className="space-y-3">
        {payments.length === 0 && !isPending && !error && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-12 flex flex-col items-center text-center gap-3">
            <CreditCard className="w-8 h-8 text-zinc-200" />
            <p className="text-sm text-zinc-400">No payments found.</p>
          </div>
        )}
        {payments.map((p) => (
          <PaymentRow
            key={p.id}
            payment={p}
            onUpdate={(u) =>
              setPayments((prev) => prev.map((x) => (x.id === u.id ? u : x)))
            }
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPayments(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
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
                  <span key={`e-${i}`} className="px-1 text-zinc-400 text-sm">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => fetchPayments(p as number)}
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
              onClick={() => fetchPayments(currentPage + 1)}
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
