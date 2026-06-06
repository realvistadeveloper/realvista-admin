"use client";
// app/(dashboard)/subscriptions/subscriptions-client.tsx
import { useState, useTransition } from "react";
import { apiFetch } from "@/lib/api";
import {
  createPlanAction,
  updatePlanAction,
  deletePlanAction,
  activateSubscriptionAction,
  cancelSubscriptionAction,
  updateQuoteAction,
  activateQuoteAction,
} from "./actions";
import type {
  Plan,
  Subscription,
  EnterpriseQuote,
  SubscriptionStats,
  PaginatedSubscriptions,
  PaginatedQuotes,
  SubStatus,
  QuoteStatus,
  PlanTier,
} from "./types";
import {
  CreditCard,
  Users,
  Building2,
  Plus,
  Check,
  X,
  Loader2,
  Trash2,
  Pencil,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  Zap,
  Ban,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}

function fmtNaira(naira: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TIER_COLORS: Record<PlanTier, string> = {
  free: "bg-zinc-100 text-zinc-500",
  premium: "bg-blue-50 text-blue-700",
  enterprise: "bg-purple-50 text-purple-700",
};

const STATUS_COLORS: Record<SubStatus, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-zinc-100 text-zinc-500",
  expired: "bg-red-50 text-red-600",
  cancelled: "bg-zinc-100 text-zinc-400",
};

const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  quoted: "bg-blue-50 text-blue-700",
  paid: "bg-emerald-50 text-emerald-700",
  activated: "bg-green-50 text-green-700",
  rejected: "bg-zinc-100 text-zinc-500",
};

const inputCls = (err?: string) =>
  clsx(
    "w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300",
    err ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white",
  );

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({ stats }: { stats: SubscriptionStats | null }) {
  if (!stats) return null;
  const s = stats.subscriptions;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Active subs", value: s.active, color: "text-green-600" },
        {
          label: "Revenue (active)",
          value: fmtNaira(stats.revenue_naira),
          color: "text-blue-600",
          raw: true,
        },
        {
          label: "Expiring soon",
          value: s.expiring_soon_7d,
          color: "text-amber-600",
        },
        {
          label: "Pending quotes",
          value: stats.quotes.pending + stats.quotes.quoted,
          color: "text-purple-600",
        },
      ].map(({ label, value, color, raw }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-zinc-100 px-4 py-3"
        >
          <p
            className={clsx(
              "font-bold tabular-nums",
              raw ? "text-base" : "text-xl",
              color,
            )}
          >
            {value}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onUpdate,
  onDelete,
}: {
  plan: Plan;
  onUpdate: (p: Plan) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.price));
  const [days, setDays] = useState(String(plan.duration_days));
  const [code, setCode] = useState(plan.paystack_plan_code ?? "");
  const [active, setActive] = useState(plan.is_active);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const updated = await updatePlanAction(plan.id, {
        name,
        price: parseInt(price),
        duration_days: parseInt(days),
        paystack_plan_code: code || null,
        is_active: active,
      });
      onUpdate(updated);
      setEditing(false);
    });
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border p-5 space-y-3",
        !plan.is_active ? "opacity-60 border-zinc-100" : "border-zinc-100",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-zinc-900">{plan.name}</p>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                TIER_COLORS[plan.tier],
              )}
            >
              {plan.tier}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs bg-zinc-50 text-zinc-500 capitalize">
              {plan.interval}
            </span>
            {!plan.is_active && (
              <span className="px-2 py-0.5 rounded-md text-xs bg-red-50 text-red-500">
                Inactive
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-zinc-900 tabular-nums mt-1">
            {fmt(plan.price)}
          </p>
          <p className="text-xs text-zinc-400">
            {plan.duration_days} days · {plan.subscriber_count} active
            subscribers
          </p>
          {plan.paystack_plan_code && (
            <p className="text-xs font-mono text-zinc-400 mt-1">
              {plan.paystack_plan_code}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setEditing((p) => !p)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {plan.yearly_savings_naira > 0 && (
        <p className="text-xs text-green-600 bg-green-50 rounded-lg px-2.5 py-1.5">
          Saves {fmtNaira(plan.yearly_savings_naira)} vs monthly
        </p>
      )}

      {editing && (
        <div className="pt-3 border-t border-zinc-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">
                Price (kobo)
              </label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                min="0"
                className={inputCls()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">
                Duration (days)
              </label>
              <input
                value={days}
                onChange={(e) => setDays(e.target.value)}
                type="number"
                min="1"
                className={inputCls()}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">
                Paystack plan code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PLN_…"
                className={inputCls()}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-3.5 h-3.5 rounded"
              />
              Active
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-lg disabled:opacity-60 flex items-center gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}{" "}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subscription row ──────────────────────────────────────────────────────────

function SubscriptionRow({
  sub,
  onUpdate,
}: {
  sub: Subscription;
  onUpdate: (s: Subscription) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");
  const [showActivate, setShowActivate] = useState(false);
  const [duration, setDuration] = useState("");

  const handleActivate = () => {
    startTransition(async () => {
      try {
        const r = await activateSubscriptionAction(
          sub.id,
          duration ? parseInt(duration) : undefined,
        );
        onUpdate({
          ...sub,
          status: r.status as SubStatus,
          expiry_date: r.expiry_date,
        });
        setFeedback(`Activated — expires ${fmtDate(r.expiry_date)}`);
        setShowActivate(false);
        setTimeout(() => setFeedback(""), 4000);
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : "Failed.");
      }
    });
  };

  const handleCancel = () => {
    startTransition(async () => {
      try {
        const r = await cancelSubscriptionAction(sub.id);
        onUpdate({ ...sub, status: r.status as SubStatus });
        setFeedback("Subscription cancelled.");
        setTimeout(() => setFeedback(""), 4000);
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : "Failed.");
      }
    });
  };

  const userName =
    typeof sub.user === "object" ? sub.user.name : (sub.user_name ?? "");
  const userEmail =
    typeof sub.user === "object" ? sub.user.email : (sub.user_email ?? "");

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border overflow-hidden",
        sub.is_active ? "border-green-100" : "border-zinc-100",
      )}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50/60 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900">{userName}</p>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                TIER_COLORS[sub.tier],
              )}
            >
              {sub.tier}
            </span>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                STATUS_COLORS[sub.status],
              )}
            >
              {sub.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {userEmail}
            {sub.is_active && sub.days_remaining > 0 && (
              <>
                {" "}
                ·{" "}
                <span
                  className={clsx(
                    sub.days_remaining <= 7 ? "text-amber-600 font-medium" : "",
                  )}
                >
                  {sub.days_remaining}d remaining
                </span>
              </>
            )}
            {sub.expiry_date && <> · expires {fmtDate(sub.expiry_date)}</>}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-50 pt-4">
          {feedback && (
            <div className="px-3 py-2 bg-green-50 text-green-700 text-xs rounded-lg">
              {feedback}
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {[
              {
                label: "Plan",
                value: sub.plan_name || sub.enterprise_label || "—",
              },
              { label: "Started", value: fmtDate(sub.start_date) },
              { label: "Expires", value: fmtDate(sub.expiry_date) },
              { label: "Status", value: sub.status },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex justify-between border-b border-zinc-50 py-1"
              >
                <span className="text-zinc-400">{label}</span>
                <span className="text-zinc-700 capitalize">{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {!showActivate ? (
            <div className="flex gap-2 flex-wrap">
              {sub.status !== "active" && (
                <button
                  onClick={() => setShowActivate(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Zap className="w-3 h-3" /> Activate
                </button>
              )}
              {sub.status === "active" && (
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Ban className="w-3 h-3" />
                  )}
                  Cancel subscription
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {!sub.plan && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">
                    Duration (days)
                  </label>
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    type="number"
                    min="1"
                    placeholder="e.g. 30"
                    className={inputCls()}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowActivate(false)}
                  className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivate}
                  disabled={isPending}
                  className="flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Confirm activation
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Enterprise quote card ─────────────────────────────────────────────────────

function QuoteCard({
  quote: init,
  accessToken,
  onUpdate,
}: {
  quote: EnterpriseQuote;
  accessToken: string;
  onUpdate: (q: EnterpriseQuote) => void;
}) {
  const [quote, setQuote] = useState(init);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(quote.quoted_price ?? ""));
  const [days, setDays] = useState(String(quote.duration_days ?? ""));
  const [link, setLink] = useState(quote.payment_link);
  const [notes, setNotes] = useState(quote.admin_notes);
  const [userId, setUserId] = useState("");
  const [showActivate, setShowActivate] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const TRANSITIONS: Record<string, string[]> = {
    pending: ["quoted", "rejected"],
    quoted: ["paid", "rejected"],
    paid: [],
    activated: [],
    rejected: ["pending"],
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const updated = await updateQuoteAction(quote.id, {
          ...(price && { quoted_price: parseInt(price) }),
          ...(days && { duration_days: parseInt(days) }),
          ...(link && { payment_link: link }),
          admin_notes: notes,
        });
        setQuote(updated);
        onUpdate(updated);
        setEditing(false);
        setFeedback("Saved.");
        setTimeout(() => setFeedback(""), 3000);
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : "Failed.");
      }
    });
  };

  const handleStatusMove = (newStatus: string) => {
    startTransition(async () => {
      try {
        const updated = await updateQuoteAction(quote.id, {
          status: newStatus,
        });
        setQuote(updated);
        onUpdate(updated);
        setFeedback(`Moved to ${newStatus}.`);
        setTimeout(() => setFeedback(""), 3000);
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : "Failed.");
      }
    });
  };

  const handleActivate = () => {
    if (!userId) return;
    startTransition(async () => {
      try {
        const r = await activateQuoteAction(quote.id, parseInt(userId));
        setQuote((p) => ({ ...p, status: "activated" }));
        onUpdate({ ...quote, status: "activated" });
        setShowActivate(false);
        setFeedback(`Activated! Expires ${fmtDate(r.expiry_date)}`);
        setTimeout(() => setFeedback(""), 5000);
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : "Activation failed.");
      }
    });
  };

  const allowed = TRANSITIONS[quote.status] ?? [];

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border overflow-hidden",
        quote.status === "pending" ? "border-amber-100" : "border-zinc-100",
      )}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-zinc-50/60 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900">
              {quote.org_name}
            </p>
            <span className="text-xs text-zinc-400">
              {quote.org_size} users
            </span>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                QUOTE_STATUS_COLORS[quote.status],
              )}
            >
              {quote.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {quote.contact_name} · {quote.contact_email}
            {quote.quoted_price_naira &&
              ` · ${fmtNaira(quote.quoted_price_naira)}`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-50 pt-4">
          {feedback && (
            <div className="px-3 py-2 bg-green-50 text-green-700 text-xs rounded-lg">
              {feedback}
            </div>
          )}

          {/* Org info */}
          <div className="bg-zinc-50 rounded-xl p-4 space-y-1.5 text-xs">
            {[
              ["Org type", quote.org_type.replace(/_/g, " ")],
              [
                "Contact",
                `${quote.contact_name} · ${quote.contact_email} · ${quote.contact_phone}`,
              ],
              ["Submitted", fmtDate(quote.created_at)],
              ...(quote.message ? [["Message", quote.message]] : []),
              ...(quote.user_email ? [["Linked user", quote.user_email]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="text-zinc-400 shrink-0 w-20">{label}</span>
                <span className="text-zinc-700">{value}</span>
              </div>
            ))}
          </div>

          {/* Quote fields */}
          {!editing ? (
            <div className="space-y-2 text-sm">
              {quote.quoted_price_naira && (
                <div className="flex justify-between py-1 border-b border-zinc-50">
                  <span className="text-zinc-400">Quoted price</span>
                  <span className="font-semibold text-zinc-800">
                    {fmtNaira(quote.quoted_price_naira)}
                  </span>
                </div>
              )}
              {quote.duration_days && (
                <div className="flex justify-between py-1 border-b border-zinc-50">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-zinc-700">
                    {quote.duration_days} days
                  </span>
                </div>
              )}
              {quote.payment_link && (
                <div className="flex justify-between py-1 border-b border-zinc-50">
                  <span className="text-zinc-400">Payment link</span>
                  <a
                    href={quote.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {quote.admin_notes && (
                <div className="bg-amber-50 rounded-xl px-3 py-2 text-xs text-amber-800">
                  {quote.admin_notes}
                </div>
              )}
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700"
              >
                <Pencil className="w-3 h-3" /> Edit quote details
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">
                    Price (kobo)
                  </label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    min="0"
                    className={inputCls()}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">
                    Duration (days)
                  </label>
                  <input
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    type="number"
                    min="1"
                    className={inputCls()}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">
                  Payment link
                </label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://paystack.com/pay/…"
                  className={inputCls()}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-zinc-500">
                  Admin notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={clsx(inputCls(), "resize-none")}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-lg disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}{" "}
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Status transitions */}
          {allowed.length > 0 && !showActivate && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-zinc-400">Move to:</span>
              {allowed.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusMove(s)}
                  disabled={isPending}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-lg border capitalize transition-colors disabled:opacity-50",
                    QUOTE_STATUS_COLORS[s as QuoteStatus] ??
                      "bg-zinc-100 text-zinc-600",
                    "border-current/20 hover:opacity-80",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Activate enterprise */}
          {quote.status === "paid" && !showActivate && (
            <button
              onClick={() => setShowActivate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-green-600 text-white rounded-xl hover:bg-green-700"
            >
              <Zap className="w-3.5 h-3.5" /> Activate enterprise subscription
            </button>
          )}

          {showActivate && (
            <div className="space-y-2 bg-green-50 rounded-xl p-4">
              <p className="text-xs font-medium text-green-800">
                Enter the user ID to link this enterprise subscription to:
              </p>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                type="number"
                placeholder="User ID…"
                className={inputCls()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowActivate(false)}
                  className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-600 bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivate}
                  disabled={isPending || !userId}
                  className="flex-1 px-3 py-1.5 text-xs bg-green-700 text-white rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Activate
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Tab = "plans" | "subscribers" | "quotes";

export default function SubscriptionsClient({
  initialStats,
  initialPlans,
  initialSubs,
  initialQuotes,
  accessToken,
}: {
  initialStats: SubscriptionStats | null;
  initialPlans: Plan[];
  initialSubs: PaginatedSubscriptions | null;
  initialQuotes: PaginatedQuotes | null;
  accessToken: string;
}) {
  const [tab, setTab] = useState<Tab>("plans");
  const [plans, setPlans] = useState(initialPlans);
  const [subs, setSubs] = useState(initialSubs?.results ?? []);
  const [quotes, setQuotes] = useState(initialQuotes?.results ?? []);

  // Subscriber filter/search
  const [search, setSearch] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [subPage, setSubPage] = useState(1);
  const [subTotal, setSubTotal] = useState(initialSubs?.total_pages ?? 1);

  // Create plan modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTier, setNewTier] = useState("premium");
  const [newInterval, setNewInterval] = useState("monthly");
  const [newPrice, setNewPrice] = useState("");
  const [newDays, setNewDays] = useState("30");
  const [newCode, setNewCode] = useState("");
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const fetchSubs = async (page = 1, s = search, st = subStatus) => {
    startTransition(async () => {
      const params: Record<string, string> = {
        page_size: "20",
        page: String(page),
      };
      if (s) params.search = s;
      if (st) params.status = st;
      const qs = new URLSearchParams(params).toString();
      const result = await apiFetch<PaginatedSubscriptions>(
        `/api/admin/subscriptions/?${qs}`,
        {},
        accessToken,
      ).catch(() => null);
      if (result) {
        setSubs(result.results);
        setSubPage(result.page);
        setSubTotal(result.total_pages);
      }
    });
  };

  const handleCreatePlan = () => {
    const e: Record<string, string> = {};
    if (!newName.trim()) e.newName = "Name is required.";
    if (!newPrice) e.newPrice = "Price is required.";
    if (!newDays) e.newDays = "Duration is required.";
    setCreateErrors(e);
    if (Object.keys(e).length) return;

    startTransition(async () => {
      const created = await createPlanAction({
        name: newName.trim(),
        tier: newTier,
        interval: newInterval,
        price: parseInt(newPrice),
        duration_days: parseInt(newDays),
        paystack_plan_code: newCode || undefined,
        is_active: true,
      });
      setPlans((p) => [...p, created]);
      setShowCreate(false);
      setNewName("");
      setNewPrice("");
      setNewDays("30");
      setNewCode("");
    });
  };

  const TABS = [
    { id: "plans" as Tab, label: `Plans (${plans.length})`, icon: CreditCard },
    {
      id: "subscribers" as Tab,
      label: `Subscribers (${initialSubs?.count ?? 0})`,
      icon: Users,
    },
    {
      id: "quotes" as Tab,
      label: `Enterprise quotes (${quotes.length})`,
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Subscriptions</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Plans, subscribers, and enterprise deals
        </p>
      </div>

      <StatsStrip stats={initialStats} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-zinc-100 p-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-1 justify-center",
              tab === t.id
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50",
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Plans tab ── */}
      {tab === "plans" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreate((p) => !p)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700"
            >
              <Plus className="w-4 h-4" /> New plan
            </button>
          </div>

          {showCreate && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                New plan
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-500">
                    Name *
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={inputCls(createErrors.newName)}
                  />
                  {createErrors.newName && (
                    <p className="text-xs text-red-500">
                      {createErrors.newName}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Tier
                  </label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className={inputCls()}
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Interval
                  </label>
                  <select
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value)}
                    className={inputCls()}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Price (kobo) *
                  </label>
                  <input
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="e.g. 500000"
                    className={inputCls(createErrors.newPrice)}
                  />
                  {createErrors.newPrice && (
                    <p className="text-xs text-red-500">
                      {createErrors.newPrice}
                    </p>
                  )}
                  {newPrice && (
                    <p className="text-xs text-zinc-400">
                      {fmt(parseInt(newPrice) || 0)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Duration (days) *
                  </label>
                  <input
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    type="number"
                    min="1"
                    className={inputCls(createErrors.newDays)}
                  />
                  {createErrors.newDays && (
                    <p className="text-xs text-red-500">
                      {createErrors.newDays}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-3">
                  <label className="text-xs font-medium text-zinc-500">
                    Paystack plan code
                  </label>
                  <input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="PLN_xxxxxxxx"
                    className={inputCls()}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePlan}
                  disabled={isPending}
                  className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl disabled:opacity-60 flex items-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}{" "}
                  Create plan
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans.length === 0 ? (
              <div className="sm:col-span-2 bg-white rounded-2xl border border-zinc-100 p-10 text-center text-sm text-zinc-400">
                No plans yet.
              </div>
            ) : (
              plans.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  onUpdate={(u) =>
                    setPlans((prev) => prev.map((x) => (x.id === u.id ? u : x)))
                  }
                  onDelete={(id) => {
                    startTransition(async () => {
                      await deletePlanAction(id);
                      setPlans((prev) => prev.filter((x) => x.id !== id));
                    });
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Subscribers tab ── */}
      {tab === "subscribers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchSubs(1, search, subStatus);
              }}
              className="relative flex-1 max-w-sm"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
              />
            </form>
            <select
              value={subStatus}
              onChange={(e) => {
                setSubStatus(e.target.value);
                fetchSubs(1, search, e.target.value);
              }}
              className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-3">
            {subs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-100 p-10 text-center text-sm text-zinc-400">
                No subscriptions found.
              </div>
            ) : (
              subs.map((s) => (
                <SubscriptionRow
                  key={s.id}
                  sub={s}
                  onUpdate={(u) =>
                    setSubs((prev) => prev.map((x) => (x.id === u.id ? u : x)))
                  }
                />
              ))
            )}
          </div>

          {subTotal > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Page {subPage} of {subTotal}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchSubs(subPage - 1)}
                  disabled={subPage <= 1 || isPending}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchSubs(subPage + 1)}
                  disabled={subPage >= subTotal || isPending}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Enterprise quotes tab ── */}
      {tab === "quotes" && (
        <div className="space-y-3">
          {quotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-100 p-10 text-center text-sm text-zinc-400">
              No enterprise quotes yet.
            </div>
          ) : (
            quotes.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                accessToken={accessToken}
                onUpdate={(u) =>
                  setQuotes((prev) => prev.map((x) => (x.id === u.id ? u : x)))
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
