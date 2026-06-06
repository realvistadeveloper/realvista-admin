"use client";

// app/(dashboard)/promotions/[id]/promotion-detail-client.tsx
import { useState, useTransition } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import {
  updatePromotionAction,
  togglePromotionActiveAction,
  deletePromotionAction,
  addConditionAction,
  updateConditionAction,
  deleteConditionAction,
} from "../actions";
import type { Promotion, StopCondition, PromotionEarning } from "../types";
import {
  ArrowLeft,
  Tag,
  Zap,
  Trash2,
  Loader2,
  X,
  Check,
  TriangleAlert,
  Clock,
  DollarSign,
  Plus,
  Pencil,
  Users,
  TrendingDown,
  Copy,
} from "lucide-react";
import { clsx } from "clsx";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "details" | "conditions" | "earnings";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputCls = (err?: string) =>
  clsx(
    "w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300",
    err ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white",
  );

// ── Main component ────────────────────────────────────────────────────────────

export default function PromotionDetailClient({
  promotion: initialPromotion,
  accessToken,
}: {
  promotion: Promotion;
  accessToken: string;
}) {
  const [promotion, setPromotion] = useState(initialPromotion);
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        const r = await togglePromotionActiveAction(promotion.id);
        setPromotion((p) => ({
          ...p,
          is_active: r.is_active,
          is_active_now: r.is_active_now,
        }));
        showFeedback("success", r.detail);
      } catch {
        showFeedback("error", "Failed to update status.");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePromotionAction(promotion.id);
      } catch {
        showFeedback("error", "Failed to delete.");
        setShowDelete(false);
      }
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(promotion.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    {
      id: "conditions",
      label: `Conditions (${promotion.stop_conditions?.length ?? 0})`,
    },
    { id: "earnings", label: `Earnings (${promotion.earnings_count})` },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/promotions"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to promotions
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActive}
            disabled={isPending}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl transition-colors disabled:opacity-60",
              promotion.is_active
                ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                : "bg-green-600 text-white hover:bg-green-700",
            )}
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {promotion.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={clsx(
            "flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm",
            feedback.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100",
          )}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={clsx(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                  promotion.is_active_now
                    ? "bg-green-50 text-green-700"
                    : promotion.is_active
                      ? "bg-amber-50 text-amber-700"
                      : "bg-zinc-100 text-zinc-500",
                )}
              >
                <span
                  className={clsx(
                    "w-1.5 h-1.5 rounded-full",
                    promotion.is_active_now
                      ? "bg-green-500"
                      : promotion.is_active
                        ? "bg-amber-500"
                        : "bg-zinc-400",
                  )}
                />
                {promotion.is_active_now
                  ? "Live"
                  : promotion.is_active
                    ? "Paused by conditions"
                    : "Inactive"}
              </span>
              <span
                className={clsx(
                  "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                  promotion.promotion_type === "referral"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-zinc-100 text-zinc-500",
                )}
              >
                {promotion.promotion_type}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">
              {promotion.name}
            </h1>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors"
            >
              <span className="font-mono text-sm font-semibold text-zinc-700 tracking-wider">
                {promotion.code}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>
          </div>

          {/* Reward + earnings */}
          <div className="text-right space-y-1">
            <p className="text-2xl font-bold text-zinc-900 tabular-nums">
              {formatAmount(promotion.reward_amount, promotion.currency)}
            </p>
            <p className="text-xs text-zinc-400">per reward</p>
            <p className="text-sm text-zinc-600 tabular-nums">
              {formatAmount(promotion.total_earned, promotion.currency)} total
              earned
            </p>
            <p className="text-xs text-zinc-400">
              {promotion.earnings_count} payouts
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-zinc-100 p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-1",
              activeTab === tab.id
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <DetailsTab
          promotion={promotion}
          onUpdate={setPromotion}
          onFeedback={showFeedback}
        />
      )}
      {activeTab === "conditions" && (
        <ConditionsTab
          promotion={promotion}
          onUpdate={setPromotion}
          onFeedback={showFeedback}
        />
      )}
      {activeTab === "earnings" && (
        <EarningsTab
          promotionId={promotion.id}
          accessToken={accessToken}
          currency={promotion.currency}
        />
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TriangleAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Delete promotion?</p>
                <p className="text-sm text-zinc-400">
                  Earnings history will be preserved.
                </p>
              </div>
            </div>
            <p className="text-sm bg-zinc-50 rounded-xl px-4 py-3 font-medium text-zinc-700 truncate">
              {promotion.name}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Details ──────────────────────────────────────────────────────────────

function DetailsTab({
  promotion,
  onUpdate,
  onFeedback,
}: {
  promotion: Promotion;
  onUpdate: (p: Promotion) => void;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const [name, setName] = useState(promotion.name);
  const [promotionType, setPromotionType] = useState(promotion.promotion_type);
  const [currency, setCurrency] = useState(promotion.currency);
  const [rewardAmount, setRewardAmount] = useState(promotion.reward_amount);
  const [saving, startSave] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!rewardAmount) e.rewardAmount = "Amount is required.";
    else if (parseFloat(rewardAmount) <= 0)
      e.rewardAmount = "Must be greater than zero.";
    setErrors(e);
    if (Object.keys(e).length) return;

    startSave(async () => {
      try {
        const updated = await updatePromotionAction(promotion.id, {
          name: name.trim(),
          promotion_type: promotionType,
          currency,
          reward_amount: rewardAmount,
        });
        onUpdate(updated);
        onFeedback("success", "Promotion updated.");
      } catch {
        onFeedback("error", "Failed to save.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Edit details
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          Save
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-500">Name</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((p) => ({ ...p, name: "" }));
          }}
          className={inputCls(errors.name)}
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Type</label>
          <select
            value={promotionType}
            onChange={(e) =>
              setPromotionType(e.target.value as typeof promotionType)
            }
            className={inputCls()}
          >
            <option value="other">Other</option>
            <option value="referral">Referral</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as typeof currency)}
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
          Reward amount
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
          className={inputCls(errors.rewardAmount)}
        />
        {errors.rewardAmount && (
          <p className="text-xs text-red-500">{errors.rewardAmount}</p>
        )}
      </div>

      {/* Read-only info */}
      <div className="pt-2 border-t border-zinc-50 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Promo code</span>
          <span className="font-mono font-semibold text-zinc-800">
            {promotion.code}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Created</span>
          <span className="text-zinc-800">
            {formatDate(promotion.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Conditions ───────────────────────────────────────────────────────────

function ConditionsTab({
  promotion,
  onUpdate,
  onFeedback,
}: {
  promotion: Promotion;
  onUpdate: (p: Promotion) => void;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const [conditions, setConditions] = useState<StopCondition[]>(
    promotion.stop_conditions ?? [],
  );
  const [showAdd, setShowAdd] = useState(false);

  const handleAdded = (c: StopCondition) => {
    const updated = [...conditions, c];
    setConditions(updated);
    onUpdate({ ...promotion, stop_conditions: updated });
    setShowAdd(false);
    onFeedback("success", "Condition added.");
  };

  const handleDeleted = (id: number) => {
    const updated = conditions.filter((c) => c.id !== id);
    setConditions(updated);
    onUpdate({ ...promotion, stop_conditions: updated });
    onFeedback("success", "Condition removed.");
  };

  const handleUpdated = (c: StopCondition) => {
    const updated = conditions.map((x) => (x.id === c.id ? c : x));
    setConditions(updated);
    onUpdate({ ...promotion, stop_conditions: updated });
    onFeedback("success", "Condition updated.");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Conditions that automatically pause this promotion when met.
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700"
        >
          <Plus className="w-3.5 h-3.5" /> Add condition
        </button>
      </div>

      {conditions.length === 0 && !showAdd && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-10 flex flex-col items-center text-center gap-3">
          <Zap className="w-8 h-8 text-zinc-200" />
          <p className="text-sm font-medium text-zinc-700">
            No stop conditions
          </p>
          <p className="text-xs text-zinc-400">
            This promotion runs indefinitely until manually deactivated.
          </p>
        </div>
      )}

      {conditions.map((condition) => (
        <ConditionCard
          key={condition.id}
          condition={condition}
          promotionId={promotion.id}
          onUpdated={handleUpdated}
          onDeleted={() => handleDeleted(condition.id)}
          onFeedback={onFeedback}
        />
      ))}

      {showAdd && (
        <AddConditionForm
          promotionId={promotion.id}
          onAdded={handleAdded}
          onCancel={() => setShowAdd(false)}
          onFeedback={onFeedback}
        />
      )}
    </div>
  );
}

function ConditionCard({
  condition,
  promotionId,
  onUpdated,
  onDeleted,
  onFeedback,
}: {
  condition: StopCondition;
  promotionId: number;
  onUpdated: (c: StopCondition) => void;
  onDeleted: () => void;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    condition.type === "time"
      ? (condition.end_date?.slice(0, 16) ?? "")
      : (condition.total_budget ?? ""),
  );
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const handleSave = () => {
    startSave(async () => {
      try {
        const payload =
          condition.type === "time"
            ? { end_date: value }
            : { total_budget: value };
        const updated = await updateConditionAction(
          promotionId,
          condition.id,
          payload,
        );
        onUpdated(updated);
        setEditing(false);
      } catch {
        onFeedback("error", "Failed to update condition.");
      }
    });
  };

  const handleDelete = () => {
    startDelete(async () => {
      try {
        await deleteConditionAction(promotionId, condition.id);
        onDeleted();
      } catch {
        onFeedback("error", "Failed to delete condition.");
      }
    });
  };

  const isTime = condition.type === "time";
  const isBudget = condition.type === "budget";

  // Check if condition is triggered
  const isTriggered = isTime
    ? !!(condition.end_date && new Date(condition.end_date) < new Date())
    : !!(
        condition.total_budget &&
        parseFloat(condition.spent_budget) >= parseFloat(condition.total_budget)
      );

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border p-5",
        isTriggered ? "border-amber-200 bg-amber-50/30" : "border-zinc-100",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              isTime ? "bg-blue-50" : "bg-green-50",
            )}
          >
            {isTime ? (
              <Clock className="w-4 h-4 text-blue-600" />
            ) : (
              <DollarSign className="w-4 h-4 text-green-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-800 capitalize">
              {condition.type}-based condition
              {isTriggered && (
                <span className="ml-2 text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                  Triggered
                </span>
              )}
            </p>
            {isTime && condition.end_date && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Ends {formatDateTime(condition.end_date)}
              </p>
            )}
            {isBudget && condition.total_budget && (
              <p className="text-xs text-zinc-400 mt-0.5">
                Budget: {condition.total_budget} · Spent:{" "}
                {condition.spent_budget}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setEditing((p) => !p)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-zinc-100 space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              {isTime ? "End date & time" : "Total budget"}
            </label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type={isTime ? "datetime-local" : "number"}
              min={isBudget ? "0" : undefined}
              step={isBudget ? "0.01" : undefined}
              className={inputCls()}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 px-3 py-1.5 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddConditionForm({
  promotionId,
  onAdded,
  onCancel,
  onFeedback,
}: {
  promotionId: number;
  onAdded: (c: StopCondition) => void;
  onCancel: () => void;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const [type, setType] = useState<"time" | "budget">("time");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, startSave] = useTransition();

  const handleAdd = () => {
    if (!value) {
      setError("This field is required.");
      return;
    }
    startSave(async () => {
      try {
        const payload =
          type === "time"
            ? { type, end_date: value }
            : { type, total_budget: value };
        const created = await addConditionAction(promotionId, payload);
        onAdded(created);
      } catch {
        onFeedback("error", "Failed to add condition.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        New condition
      </p>

      <div className="grid grid-cols-2 gap-3">
        {(["time", "budget"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setValue("");
              setError("");
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
              type === t
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
            )}
          >
            {t === "time" ? (
              <Clock className="w-4 h-4" />
            ) : (
              <DollarSign className="w-4 h-4" />
            )}
            {t === "time" ? "Time-based" : "Budget-based"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-zinc-500">
          {type === "time"
            ? "Stop after this date & time"
            : "Stop when budget reaches"}
        </label>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          type={type === "time" ? "datetime-local" : "number"}
          min={type === "budget" ? "0" : undefined}
          step={type === "budget" ? "0.01" : undefined}
          placeholder={type === "budget" ? "Total budget amount…" : undefined}
          className={inputCls(error)}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={saving}
          className="flex-1 px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Add condition
        </button>
      </div>
    </div>
  );
}

// ── Tab: Earnings ─────────────────────────────────────────────────────────────

function EarningsTab({
  promotionId,
  accessToken,
  currency,
}: {
  promotionId: number;
  accessToken: string;
  currency: string;
}) {
  const [earnings, setEarnings] = useState<PromotionEarning[] | null>(null);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(false);

  const load = async (reversed = "") => {
    setLoading(true);
    setError(false);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";
      const qs = reversed
        ? `?is_reversed=${reversed}&page_size=50`
        : "?page_size=50";
      const res = await fetch(
        `${base}/api/admin/promotions/${promotionId}/earnings/${qs}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEarnings(data.results ?? []);
      setCount(data.count ?? 0);
      setLoaded(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (val: string) => {
    setFilter(val);
    load(val);
  };

  if (!loaded) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-10 flex flex-col items-center gap-3 text-center">
        <Users className="w-8 h-8 text-zinc-200" />
        <p className="text-sm font-medium text-zinc-700">Earnings history</p>
        <p className="text-xs text-zinc-400">
          Load to view all payouts for this promotion.
        </p>
        <button
          onClick={() => load()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Load earnings
        </button>
        {error && (
          <p className="text-xs text-red-500">Failed to load. Try again.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{count} total payouts</p>
        <select
          value={filter}
          onChange={(e) => handleFilter(e.target.value)}
          className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
        >
          <option value="">All payouts</option>
          <option value="false">Active only</option>
          <option value="true">Reversed only</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {earnings?.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-zinc-400">
            No earnings found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {earnings?.map((earning) => (
                <tr
                  key={earning.id}
                  className={clsx(
                    "transition-colors",
                    earning.is_reversed
                      ? "bg-red-50/30"
                      : "hover:bg-zinc-50/60",
                  )}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-800 truncate max-w-[160px]">
                      {earning.user_name}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">
                      {earning.user_email}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 font-semibold tabular-nums text-zinc-800">
                    {formatAmount(earning.amount, currency)}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-xs text-zinc-400">
                    {formatDate(earning.created_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    {earning.is_reversed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-600">
                        <TrendingDown className="w-3 h-3" /> Reversed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
