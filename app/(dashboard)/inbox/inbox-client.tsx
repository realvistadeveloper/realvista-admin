"use client";

// app/(dashboard)/inbox/inbox-client.tsx
import { useState, useTransition } from "react";
import { apiFetch } from "@/lib/api";
import {
  updateContactAction,
  updateContactStatusAction,
  deleteContactAction,
  updateFeedbackAction,
  deleteFeedbackAction,
} from "./actions";
import type {
  ContactMessage,
  Feedback,
  PaginatedContacts,
  PaginatedFeedback,
  InboxStats,
  ContactStatus,
} from "./types";
import {
  MessageSquare,
  Star,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Check,
  Trash2,
  TriangleAlert,
  Mail,
  Phone,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  Sparkles,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<
  ContactStatus,
  { label: string; color: string; dot: string }
> = {
  open: {
    label: "Open",
    color: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  closed: {
    label: "Closed",
    color: "bg-zinc-100 text-zinc-500",
    dot: "bg-zinc-400",
  },
};

const TRANSITIONS: Record<ContactStatus, ContactStatus[]> = {
  open: ["in_progress"],
  in_progress: ["resolved", "open"],
  resolved: ["closed", "in_progress"],
  closed: ["open"],
};

const CATEGORY_LABELS: Record<string, string> = {
  enquiry: "Enquiry",
  support: "Support",
  feedback: "Feedback",
  report: "Report",
  other: "Other",
};

function StatusBadge({ status }: { status: ContactStatus }) {
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

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    enquiry: "bg-purple-50 text-purple-700",
    support: "bg-orange-50 text-orange-700",
    feedback: "bg-teal-50 text-teal-700",
    report: "bg-red-50 text-red-600",
    other: "bg-zinc-100 text-zinc-500",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
        colors[category] ?? "bg-zinc-100 text-zinc-500",
      )}
    >
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

// ── Stats strip ───────────────────────────────────────────────────────────────

function StatsStrip({
  stats,
  tab,
}: {
  stats: InboxStats | null;
  tab: "contacts" | "feedback";
}) {
  if (!stats) return null;
  if (tab === "contacts") {
    const c = stats.contacts;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: c.total, color: "text-zinc-600" },
          { label: "Open", value: c.by_status.open, color: "text-blue-600" },
          {
            label: "In progress",
            value: c.by_status.in_progress,
            color: "text-amber-600",
          },
          { label: "Unassigned", value: c.unassigned, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-zinc-100 px-4 py-3"
          >
            <p className={clsx("text-xl font-bold tabular-nums", color)}>
              {value}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    );
  }
  const f = stats.feedback;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total", value: f.total, color: "text-zinc-600" },
        { label: "Pending", value: f.pending, color: "text-amber-600" },
        { label: "Approved", value: f.approved, color: "text-green-600" },
        { label: "Featured", value: f.featured, color: "text-purple-600" },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-zinc-100 px-4 py-3"
        >
          <p className={clsx("text-xl font-bold tabular-nums", color)}>
            {value}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Contact message card ──────────────────────────────────────────────────────

function ContactCard({
  message: initialMsg,
  onUpdate,
  onDelete,
}: {
  message: ContactMessage;
  onUpdate: (m: ContactMessage) => void;
  onDelete: (id: number) => void;
}) {
  const [msg, setMsg] = useState(initialMsg);
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(msg.notes);
  const [showStatus, setShowStatus] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [pendingStatus, setPendingStatus] = useState<ContactStatus | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, msg: text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatusChange = (newStatus: ContactStatus) => {
    setPendingStatus(newStatus);
    setShowStatus(true);
  };

  const confirmStatus = () => {
    if (!pendingStatus) return;
    startTransition(async () => {
      try {
        const updated = await updateContactStatusAction(
          msg.id,
          pendingStatus,
          statusNote,
        );
        setMsg(updated);
        onUpdate(updated);
        setShowStatus(false);
        setPendingStatus(null);
        setStatusNote("");
        showFeedback(
          "success",
          `Status updated to ${pendingStatus.replace(/_/g, " ")}.`,
        );
      } catch {
        showFeedback("error", "Failed to update status.");
      }
    });
  };

  const handleSaveNotes = () => {
    startTransition(async () => {
      try {
        const updated = await updateContactAction(msg.id, { notes });
        setMsg(updated);
        onUpdate(updated);
        showFeedback("success", "Notes saved.");
      } catch {
        showFeedback("error", "Failed to save notes.");
      }
    });
  };

  const allowedTransitions = TRANSITIONS[msg.status] ?? [];

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border overflow-hidden",
        msg.status === "open" ? "border-blue-200" : "border-zinc-100",
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-zinc-50/60 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900">
              {msg.fullname}
            </p>
            <span className="font-mono text-xs text-zinc-400">
              {msg.ticket_number}
            </span>
            <CategoryBadge category={msg.category} />
            <StatusBadge status={msg.status} />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {msg.email} · {formatDate(msg.created_at)}
          </p>
          {!expanded && (
            <p className="text-sm text-zinc-600 mt-1 truncate">{msg.message}</p>
          )}
        </div>
        <div className="shrink-0 text-zinc-400 mt-0.5">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-50">
          {feedback && (
            <div
              className={clsx(
                "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs mt-3",
                feedback.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700",
              )}
            >
              <span>{feedback.msg}</span>
              <button onClick={() => setFeedback(null)}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Contact info */}
          <div className="flex flex-wrap gap-4 pt-3">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Mail className="w-3.5 h-3.5 text-zinc-300" /> {msg.email}
            </span>
            {msg.phone_number && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Phone className="w-3.5 h-3.5 text-zinc-300" />{" "}
                {msg.phone_number}
              </span>
            )}
            {msg.assigned_to_name && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <UserCheck className="w-3.5 h-3.5 text-zinc-300" />{" "}
                {msg.assigned_to_name}
              </span>
            )}
          </div>

          {/* Message */}
          <div className="bg-zinc-50 rounded-xl p-4">
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {msg.message}
            </p>
          </div>

          {/* Status actions */}
          {allowedTransitions.length > 0 && !showStatus && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400">Move to:</span>
              {allowedTransitions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isPending}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50",
                    STATUS_CONFIG[s].color,
                    "border-current/20 hover:opacity-80",
                  )}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          )}

          {/* Status note input */}
          {showStatus && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">
                Moving to <strong>{pendingStatus?.replace(/_/g, " ")}</strong> —
                add a note (optional):
              </p>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={2}
                placeholder="Internal note for this status change…"
                className="w-full text-xs border border-zinc-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowStatus(false);
                    setPendingStatus(null);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatus}
                  disabled={isPending}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Confirm
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500">
              Internal notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes visible only to admins…"
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
            <div className="flex justify-between">
              <button
                onClick={() => onDelete(msg.id)}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Save notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feedback card ─────────────────────────────────────────────────────────────

function FeedbackCard({
  item: initialItem,
  onUpdate,
  onDelete,
}: {
  item: Feedback;
  onUpdate: (f: Feedback) => void;
  onDelete: (id: number) => void;
}) {
  const [item, setItem] = useState(initialItem);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggle = (field: "is_approved" | "is_featured") => {
    startTransition(async () => {
      try {
        const updated = await updateFeedbackAction(item.id, {
          [field]: !item[field],
        });
        setItem(updated);
        onUpdate(updated);
      } catch {
        /* silent */
      }
    });
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border overflow-hidden",
        !item.is_approved ? "border-amber-100" : "border-zinc-100",
      )}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-zinc-50/60 transition-colors text-left"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-zinc-100 overflow-hidden shrink-0 flex items-center justify-center mt-0.5">
          {item.avatar_url ? (
            <img
              src={item.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-zinc-500">
              {item.user_name?.[0]?.toUpperCase() ?? "U"}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900">
              {item.user_name}
            </p>
            <span className="text-xs text-zinc-400">
              {item.position} · {item.company}
            </span>
            {item.is_featured && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-600">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            )}
            <span
              className={clsx(
                "px-2 py-0.5 rounded-md text-xs font-medium",
                item.is_approved
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700",
              )}
            >
              {item.is_approved ? "Approved" : "Pending"}
            </span>
          </div>
          {!expanded && (
            <p className="text-sm text-zinc-500 mt-1 truncate">
              {item.feedback}
            </p>
          )}
        </div>
        <div className="shrink-0 text-zinc-400 mt-0.5">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-50">
          <div className="bg-zinc-50 rounded-xl p-4 mt-3">
            <p className="text-sm text-zinc-700 leading-relaxed italic">
              "{item.feedback}"
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => toggle("is_approved")}
              disabled={isPending}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50",
                item.is_approved
                  ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  : "bg-green-600 text-white hover:bg-green-700",
              )}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {item.is_approved ? "Unapprove" : "Approve"}
            </button>

            <button
              onClick={() => toggle("is_featured")}
              disabled={isPending}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50",
                item.is_featured
                  ? "bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {item.is_featured ? "Unfeature" : "Feature"}
            </button>

            <button
              onClick={() => onDelete(item.id)}
              className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface InboxClientProps {
  initialContacts: PaginatedContacts | null;
  initialFeedback: PaginatedFeedback | null;
  initialStats: InboxStats | null;
  accessToken: string;
}

export default function InboxClient({
  initialContacts,
  initialFeedback,
  initialStats,
  accessToken,
}: InboxClientProps) {
  const [tab, setTab] = useState<"contacts" | "feedback">("contacts");

  // Contacts state
  const [contacts, setContacts] = useState(initialContacts?.results ?? []);
  const [contactsTotal, setContactsTotal] = useState(
    initialContacts?.count ?? 0,
  );
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsTotalPages, setContactsTotalPages] = useState(
    initialContacts?.total_pages ?? 1,
  );
  const [contactSearch, setContactSearch] = useState("");
  const [contactStatus, setContactStatus] = useState("");
  const [contactCategory, setContactCategory] = useState("");

  // Feedback state
  const [feedback, setFeedback] = useState(initialFeedback?.results ?? []);
  const [feedbackTotal, setFeedbackTotal] = useState(
    initialFeedback?.count ?? 0,
  );
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackTotalPages, setFeedbackTotalPages] = useState(
    initialFeedback?.total_pages ?? 1,
  );
  const [feedbackFilter, setFeedbackFilter] = useState("");

  const [isPending, startTransition] = useTransition();

  const fetchContacts = (
    page = 1,
    search = contactSearch,
    status = contactStatus,
    category = contactCategory,
  ) => {
    startTransition(async () => {
      const params: Record<string, string> = {
        page_size: "20",
        page: String(page),
      };
      if (search) params.search = search;
      if (status) params.status = status;
      if (category) params.category = category;
      const qs = new URLSearchParams(params).toString();
      const result = await apiFetch<PaginatedContacts>(
        `/api/admin/inbox/contacts/?${qs}`,
        {},
        accessToken,
      ).catch(() => null);
      if (result) {
        setContacts(result.results);
        setContactsTotal(result.count);
        setContactsPage(result.page);
        setContactsTotalPages(result.total_pages);
      }
    });
  };

  const fetchFeedback = (page = 1, filter = feedbackFilter) => {
    startTransition(async () => {
      const params: Record<string, string> = {
        page_size: "20",
        page: String(page),
      };
      if (filter === "approved") params.is_approved = "true";
      if (filter === "pending") params.is_approved = "false";
      if (filter === "featured") params.is_featured = "true";
      const qs = new URLSearchParams(params).toString();
      const result = await apiFetch<PaginatedFeedback>(
        `/api/admin/inbox/feedback/?${qs}`,
        {},
        accessToken,
      ).catch(() => null);
      if (result) {
        setFeedback(result.results);
        setFeedbackTotal(result.count);
        setFeedbackPage(result.page);
        setFeedbackTotalPages(result.total_pages);
      }
    });
  };

  const handleContactUpdate = (updated: ContactMessage) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleContactDelete = (id: number) => {
    startTransition(async () => {
      await deleteContactAction(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setContactsTotal((p) => p - 1);
    });
  };

  const handleFeedbackUpdate = (updated: Feedback) => {
    setFeedback((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleFeedbackDelete = (id: number) => {
    startTransition(async () => {
      await deleteFeedbackAction(id);
      setFeedback((prev) => prev.filter((f) => f.id !== id));
      setFeedbackTotal((p) => p - 1);
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Inbox</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Messages and feedback management
        </p>
      </div>

      <StatsStrip stats={initialStats} tab={tab} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-zinc-100 p-1.5">
        {(
          [
            {
              id: "contacts",
              label: `Messages (${contactsTotal})`,
              icon: MessageSquare,
            },
            {
              id: "feedback",
              label: `Feedback (${feedbackTotal})`,
              icon: Star,
            },
          ] as const
        ).map((t) => (
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

      {/* ── Contacts tab ── */}
      {tab === "contacts" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchContacts(1, contactSearch);
              }}
              className="relative flex-1 max-w-sm"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search name, email, ticket…"
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300 placeholder:text-zinc-400"
              />
            </form>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-zinc-400 shrink-0" />
              <select
                value={contactStatus}
                onChange={(e) => {
                  setContactStatus(e.target.value);
                  fetchContacts(
                    1,
                    contactSearch,
                    e.target.value,
                    contactCategory,
                  );
                }}
                className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={contactCategory}
                onChange={(e) => {
                  setContactCategory(e.target.value);
                  fetchContacts(
                    1,
                    contactSearch,
                    contactStatus,
                    e.target.value,
                  );
                }}
                className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
              >
                <option value="">All categories</option>
                <option value="enquiry">Enquiry</option>
                <option value="support">Support</option>
                <option value="feedback">Feedback</option>
                <option value="report">Report</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          )}

          {contacts.length === 0 && !isPending ? (
            <div className="bg-white rounded-2xl border border-zinc-100 p-12 flex flex-col items-center text-center gap-3">
              <Inbox className="w-8 h-8 text-zinc-200" />
              <p className="text-sm text-zinc-500">No messages found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((c) => (
                <ContactCard
                  key={c.id}
                  message={c}
                  onUpdate={handleContactUpdate}
                  onDelete={handleContactDelete}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {contactsTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Page {contactsPage} of {contactsTotalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchContacts(contactsPage - 1)}
                  disabled={contactsPage <= 1 || isPending}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchContacts(contactsPage + 1)}
                  disabled={contactsPage >= contactsTotalPages || isPending}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Feedback tab ── */}
      {tab === "feedback" && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <select
              value={feedbackFilter}
              onChange={(e) => {
                setFeedbackFilter(e.target.value);
                fetchFeedback(1, e.target.value);
              }}
              className="text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-300 text-zinc-700"
            >
              <option value="">All feedback</option>
              <option value="pending">Pending approval</option>
              <option value="approved">Approved</option>
              <option value="featured">Featured</option>
            </select>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          )}

          {feedback.length === 0 && !isPending ? (
            <div className="bg-white rounded-2xl border border-zinc-100 p-12 flex flex-col items-center text-center gap-3">
              <Star className="w-8 h-8 text-zinc-200" />
              <p className="text-sm text-zinc-500">No feedback found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((f) => (
                <FeedbackCard
                  key={f.id}
                  item={f}
                  onUpdate={handleFeedbackUpdate}
                  onDelete={handleFeedbackDelete}
                />
              ))}
            </div>
          )}

          {feedbackTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Page {feedbackPage} of {feedbackTotalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchFeedback(feedbackPage - 1)}
                  disabled={feedbackPage <= 1 || isPending}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchFeedback(feedbackPage + 1)}
                  disabled={feedbackPage >= feedbackTotalPages || isPending}
                  className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
