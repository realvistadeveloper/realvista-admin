"use client";
// app/(dashboard)/notifications/log/client.tsx
import { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import {
  sendNotificationAction,
  searchUsersAction,
  fetchNotificationLogAction,
} from "./actions";
import type {
  NotificationLogEntry,
  NotificationTarget,
  NotificationType,
  UserSearchResult,
} from "./types";
import {
  Bell,
  Send,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowLeft,
  Search,
} from "lucide-react";
import { clsx } from "clsx";

// ── Config ────────────────────────────────────────────────────────────────────

const TARGET_OPTIONS: { value: NotificationTarget; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "agents", label: "Agents Only" },
  { value: "premium", label: "Premium Users" },
  { value: "user", label: "Specific User" },
];

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: "system", label: "System" },
  { value: "listing", label: "Listing" },
  { value: "subscription", label: "Subscription" },
  { value: "referral", label: "Referral" },
  { value: "payment", label: "Payment" },
  { value: "appointment", label: "Appointment" },
];

const TYPE_BADGE: Record<NotificationType, string> = {
  appointment: "bg-brand-50 text-brand-700",
  listing: "text-white",
  subscription: "bg-purple-50 text-purple-700",
  referral: "bg-green-50 text-green-700",
  payment: "bg-amber-50 text-amber-700",
  system: "bg-zinc-100 text-zinc-600",
};

function TypeBadge({ type }: { type: NotificationType }) {
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-md text-xs font-medium capitalize inline-block",
        TYPE_BADGE[type],
      )}
      style={type === "listing" ? { background: "#FB902D" } : undefined}
    >
      {type}
    </span>
  );
}

// ── User search (for "Specific User" target) ───────────────────────────────────

function UserSearchField({
  selected,
  onSelect,
}: {
  selected: UserSearchResult | null;
  onSelect: (user: UserSearchResult | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const found = await searchUsersAction(query);
      setResults(found);
      setSearching(false);
      setOpen(true);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-800 truncate">
            {selected.name || selected.email}
          </p>
          <p className="text-xs text-zinc-400 truncate">{selected.email}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery("");
          }}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-800 shrink-0 ml-3"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search by name or email…"
          className="w-full text-sm border border-zinc-200 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300"
        />
        {searching && (
          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-100 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onSelect(u);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
            >
              <p className="text-sm font-medium text-zinc-800">
                {u.name || u.email}
              </p>
              <p className="text-xs text-zinc-400">{u.email}</p>
            </button>
          ))}
        </div>
      )}
      {open && !searching && query.trim() && results.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-100 rounded-xl shadow-lg px-3 py-3">
          <p className="text-xs text-zinc-400">No users found.</p>
        </div>
      )}
    </div>
  );
}

// ── Extra data (collapsible JSON) ───────────────────────────────────────────────

function ExtraDataField({
  value,
  onChange,
  onValidChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onValidChange: (valid: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isValid = (() => {
    if (!value.trim()) return true; // empty is fine — optional field
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    onValidChange(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
        Extra data (optional)
      </button>
      {expanded && (
        <div className="mt-2 relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder='{"appointment_id": 12}'
            className={clsx(
              "w-full text-sm font-mono border rounded-xl px-3 py-2.5 pr-9 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300",
              isValid ? "border-zinc-200 bg-white" : "border-red-300 bg-red-50",
            )}
          />
          <div className="absolute right-3 top-2.5">
            {value.trim() ? (
              isValid ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Send notification composer ──────────────────────────────────────────────────

function NotificationComposer({
  onSent,
}: {
  onSent: () => void;
}) {
  const [target, setTarget] = useState<NotificationTarget>("all");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const [type, setType] = useState<NotificationType>("system");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [extraData, setExtraData] = useState("");
  const [extraDataValid, setExtraDataValid] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const TITLE_MAX = 255;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (title.length > TITLE_MAX) e.title = `Title must be ${TITLE_MAX} characters or fewer.`;
    if (!body.trim()) e.body = "Body is required.";
    if (target === "user" && !selectedUser) e.target = "Select a user.";
    if (!extraDataValid) e.data = "Extra data must be valid JSON.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = () => {
    if (!validate()) return;
    startTransition(async () => {
      try {
        const result = await sendNotificationAction({
          target,
          ...(target === "user" && { target_user: selectedUser!.id }),
          type,
          title: title.trim(),
          body: body.trim(),
          ...(extraData.trim() && { data: JSON.parse(extraData) }),
        });
        setBanner({
          kind: "success",
          message: `✓ Sent to ${result.sent_count} users`,
        });
        setTitle("");
        setBody("");
        setExtraData("");
        setSelectedUser(null);
        onSent();
        setTimeout(() => setBanner(null), 5000);
      } catch (err: unknown) {
        setBanner({
          kind: "error",
          message: err instanceof Error ? err.message : "Failed to send notification.",
        });
      }
    });
  };

  const inputCls = (err?: string) =>
    clsx(
      "w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300",
      err ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white",
    );

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-5">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Send in-app notification
      </p>

      {banner && (
        <div
          className={clsx(
            "px-3 py-2 rounded-lg text-sm font-medium",
            banner.kind === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700",
          )}
        >
          {banner.message}
        </div>
      )}

      {/* Target selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500">Send to</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TARGET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTarget(opt.value)}
              className={clsx(
                "px-3 py-2 rounded-xl text-xs font-medium border transition-colors",
                target === opt.value
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.target && (
          <p className="text-xs text-red-500">{errors.target}</p>
        )}
      </div>

      {target === "user" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">
            User email or name
          </label>
          <UserSearchField selected={selectedUser} onSelect={setSelectedUser} />
        </div>
      )}

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as NotificationType)}
          className={inputCls()}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-500">Title *</label>
          <span
            className={clsx(
              "text-xs",
              title.length > TITLE_MAX ? "text-red-500" : "text-zinc-400",
            )}
          >
            {title.length}/{TITLE_MAX}
          </span>
        </div>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((p) => ({ ...p, title: "" }));
          }}
          placeholder="Notification title"
          className={inputCls(errors.title)}
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-500">Body *</label>
          <span className="text-xs text-zinc-400">{body.length} chars</span>
        </div>
        <textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setErrors((p) => ({ ...p, body: "" }));
          }}
          rows={3}
          placeholder="Notification message…"
          className={clsx(inputCls(errors.body), "resize-none")}
        />
        {errors.body && <p className="text-xs text-red-500">{errors.body}</p>}
      </div>

      {/* Extra data */}
      <ExtraDataField
        value={extraData}
        onChange={setExtraData}
        onValidChange={setExtraDataValid}
      />
      {errors.data && <p className="text-xs text-red-500 -mt-3">{errors.data}</p>}

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

// ── Recent notifications table ───────────────────────────────────────────────────

function NotificationsTable({
  entries,
  onRefresh,
  refreshing,
}: {
  entries: NotificationLogEntry[];
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-50">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Recent notifications ({entries.length})
        </p>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 disabled:opacity-50"
        >
          <RefreshCw
            className={clsx("w-3.5 h-3.5", refreshing && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-zinc-400">
          No notifications sent yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-50">
                <th className="text-left font-medium text-zinc-400 text-xs uppercase tracking-wide px-5 py-2.5">
                  User email
                </th>
                <th className="text-left font-medium text-zinc-400 text-xs uppercase tracking-wide px-3 py-2.5">
                  Type
                </th>
                <th className="text-left font-medium text-zinc-400 text-xs uppercase tracking-wide px-3 py-2.5">
                  Title
                </th>
                <th className="text-left font-medium text-zinc-400 text-xs uppercase tracking-wide px-3 py-2.5">
                  Read
                </th>
                <th className="text-left font-medium text-zinc-400 text-xs uppercase tracking-wide px-5 py-2.5">
                  Sent
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((n) => (
                <tr
                  key={n.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                >
                  <td className="px-5 py-3 text-zinc-700 truncate max-w-[200px]">
                    {n.user_email}
                  </td>
                  <td className="px-3 py-3">
                    <TypeBadge type={n.type} />
                  </td>
                  <td className="px-3 py-3 text-zinc-800 font-medium truncate max-w-[220px]">
                    {n.title}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-md",
                        n.is_read
                          ? "bg-zinc-100 text-zinc-500"
                          : "bg-blue-50 text-blue-700",
                      )}
                    >
                      {n.is_read ? "Read" : "Unread"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {new Date(n.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NotificationLogPage({
  initialEntries,
}: {
  initialEntries: NotificationLogEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    const fresh = await fetchNotificationLogAction();
    setEntries(fresh);
    setRefreshing(false);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
            <Bell className="w-4.5 h-4.5 text-zinc-400" />
            In-App Notifications
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Send and manage user notifications
          </p>
        </div>
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Push &amp; email
        </Link>
      </div>

      <NotificationComposer onSent={refresh} />
      <NotificationsTable
        entries={entries}
        onRefresh={refresh}
        refreshing={refreshing}
      />
    </div>
  );
}
