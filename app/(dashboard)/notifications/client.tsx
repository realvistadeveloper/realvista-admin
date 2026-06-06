"use client";
// app/(dashboard)/notifications/page.tsx — client component (simple enough)
import { useState, useTransition } from "react";
import { sendPushNotificationAction, toggleEmailOptAction } from "./actions";
import type {
  NotificationStats,
  PushNotification,
  EmailSetting,
  Device,
} from "./types";
import {
  Bell,
  Mail,
  Smartphone,
  Send,
  Check,
  X,
  Loader2,
  TriangleAlert,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { clsx } from "clsx";

// ── Stats strip ───────────────────────────────────────────────────────────────
function StatsStrip({ stats }: { stats: NotificationStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Devices",
          value: stats.devices,
          icon: Smartphone,
          color: "text-zinc-600",
        },
        {
          label: "Opted in",
          value: stats.email.opted_in,
          icon: Mail,
          color: "text-green-600",
        },
        {
          label: "Opted out",
          value: stats.email.opted_out,
          icon: EyeOff,
          color: "text-red-500",
        },
        {
          label: "Push sent",
          value: stats.push.sent,
          icon: Bell,
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
              {value}
            </p>
            <p className="text-xs text-zinc-400">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Push notification composer ────────────────────────────────────────────────
function PushComposer({ onSent }: { onSent: (n: PushNotification) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");
  const [userId, setUserId] = useState("");
  const [topic, setTopic] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [isPending, startTransition] = useTransition();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!body.trim()) e.body = "Body is required.";
    if (target === "user" && !userId) e.userId = "User ID is required.";
    if (target === "topic" && !topic) e.topic = "Topic is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = () => {
    if (!validate()) return;
    startTransition(async () => {
      try {
        const result = await sendPushNotificationAction({
          title: title.trim(),
          body: body.trim(),
          target,
          ...(target === "user" && { target_user: parseInt(userId) }),
          ...(target === "topic" && { topic }),
        });
        onSent(result);
        setTitle("");
        setBody("");
        setUserId("");
        setTopic("");
        setFeedback(`Sent to ${result.sent_count} devices.`);
        setTimeout(() => setFeedback(""), 4000);
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : "Failed to send.");
      }
    });
  };

  const inputCls = (err?: string) =>
    clsx(
      "w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300",
      err ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white",
    );

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Send push notification
      </p>
      {feedback && (
        <div
          className={clsx(
            "px-3 py-2 rounded-lg text-xs",
            feedback.startsWith("Sent")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700",
          )}
        >
          {feedback}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Title *</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((p) => ({ ...p, title: "" }));
            }}
            placeholder="Notification title"
            className={inputCls(errors.title)}
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Target</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={inputCls()}
          >
            <option value="all">All devices</option>
            <option value="user">Specific user</option>
            <option value="topic">Topic</option>
          </select>
        </div>
        {target === "user" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              User ID *
            </label>
            <input
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setErrors((p) => ({ ...p, userId: "" }));
              }}
              type="number"
              placeholder="User ID"
              className={inputCls(errors.userId)}
            />
            {errors.userId && (
              <p className="text-xs text-red-500">{errors.userId}</p>
            )}
          </div>
        )}
        {target === "topic" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Topic *</label>
            <input
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setErrors((p) => ({ ...p, topic: "" }));
              }}
              placeholder="e.g. property_updates"
              className={inputCls(errors.topic)}
            />
            {errors.topic && (
              <p className="text-xs text-red-500">{errors.topic}</p>
            )}
          </div>
        )}
        <div
          className={clsx(
            "flex flex-col gap-1.5",
            target === "all" ? "sm:col-span-2" : "",
          )}
        >
          <label className="text-xs font-medium text-zinc-500">Message *</label>
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setErrors((p) => ({ ...p, body: "" }));
            }}
            rows={3}
            placeholder="Notification body…"
            className={clsx(inputCls(errors.body), "resize-none sm:col-span-2")}
          />
          {errors.body && <p className="text-xs text-red-500">{errors.body}</p>}
        </div>
      </div>
      <button
        onClick={handleSend}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        Send notification
      </button>
    </div>
  );
}

// ── Email settings row ────────────────────────────────────────────────────────
function EmailSettingRow({ setting: init }: { setting: EmailSetting }) {
  const [setting, setSetting] = useState(init);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const updated = await toggleEmailOptAction(
        setting.id,
        !setting.receive_email_notifications,
      );
      setSetting(updated);
    });
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-zinc-800">
          {setting.user_email}
        </p>
        <p className="text-xs text-zinc-400">
          {setting.receive_email_notifications
            ? "Receiving emails"
            : "Opted out"}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={isPending}
        className={clsx(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50",
          setting.receive_email_notifications ? "bg-green-500" : "bg-zinc-200",
        )}
      >
        <span
          className={clsx(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
            setting.receive_email_notifications
              ? "translate-x-4"
              : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

// ── Push history row ──────────────────────────────────────────────────────────
function PushHistoryRow({ notif }: { notif: PushNotification }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-zinc-50 last:border-0">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-zinc-50/60 transition-colors text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 truncate">
            {notif.title}
          </p>
          <p className="text-xs text-zinc-400">
            {notif.target} · {notif.sent_count} sent ·{" "}
            {new Date(notif.created_at).toLocaleDateString("en-GB")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span
            className={clsx(
              "px-2 py-0.5 rounded-md text-xs font-medium",
              notif.status === "sent"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600",
            )}
          >
            {notif.status}
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-3">
          <p className="text-sm text-zinc-600 bg-zinc-50 rounded-xl p-3">
            {notif.body}
          </p>
          <p className="text-xs text-zinc-400 mt-2">
            Sent by {notif.created_by_name} · {notif.sent_count} delivered ·{" "}
            {notif.failed_count} failed
          </p>
        </div>
      )}
    </div>
  );
}

// ── Page (exported as default — used as server component wrapper) ─────────────
export default function NotificationsPage({
  stats,
  pushHistory,
  emailSettings,
}: {
  stats: NotificationStats | null;
  pushHistory: PushNotification[];
  emailSettings: EmailSetting[];
}) {
  const [history, setHistory] = useState(pushHistory);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Notifications</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Push notifications and email preferences
        </p>
      </div>
      <StatsStrip stats={stats} />
      <PushComposer onSent={(n) => setHistory((p) => [n, ...p])} />

      {/* Push history */}
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        <p className="px-5 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-50">
          Push history ({history.length})
        </p>
        {history.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">
            No notifications sent yet.
          </p>
        ) : (
          history.map((n) => <PushHistoryRow key={n.id} notif={n} />)
        )}
      </div>

      {/* Email settings */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Email opt-in settings ({emailSettings.length})
        </p>
        {emailSettings.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4">
            No email settings found.
          </p>
        ) : (
          emailSettings.map((s) => <EmailSettingRow key={s.id} setting={s} />)
        )}
      </div>
    </div>
  );
}
