"use client";
// app/(dashboard)/marketing/marketing-client.tsx
import { useState, useTransition } from "react";
import {
  createLeadAction,
  updateLeadStatusAction,
  deleteLeadAction,
  createNewsletterAction,
  updateNewsletterAction,
  sendNewsletterAction,
  deleteNewsletterAction,
} from "./actions";
import type {
  Lead,
  Newsletter,
  PaginatedLeads,
  PaginatedNewsletters,
  MarketingStats,
  LeadStatus,
} from "./types";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  Users,
  Mail,
  Plus,
  Loader2,
  Check,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  FileText,
  TrendingUp,
  ArrowRight,
  TriangleAlert,
  Edit2,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700",
  contacted: "bg-amber-50 text-amber-700",
  qualified: "bg-purple-50 text-purple-700",
  converted: "bg-green-50 text-green-700",
  lost: "bg-zinc-100 text-zinc-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const inputCls = (err?: string) =>
  clsx(
    "w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300",
    err ? "border-red-300 bg-red-50" : "border-zinc-200 bg-white",
  );

// ── Stats strip ───────────────────────────────────────────────────────────────
function StatsStrip({ stats }: { stats: MarketingStats | null }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          label: "Total leads",
          value: stats.leads.total,
          color: "text-zinc-600",
        },
        {
          label: "Qualified",
          value: stats.leads.by_status.qualified,
          color: "text-purple-600",
        },
        {
          label: "Converted",
          value: stats.leads.by_status.converted,
          color: "text-green-600",
        },
        {
          label: "Emails sent",
          value: stats.newsletters.total_emails_sent,
          color: "text-blue-600",
        },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-zinc-100 px-4 py-3"
        >
          <p className={clsx("text-xl font-bold tabular-nums", color)}>
            {value?.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Lead card ─────────────────────────────────────────────────────────────────
function LeadCard({
  lead: init,
  onUpdate,
  onDelete,
}: {
  lead: Lead;
  onUpdate: (l: Lead) => void;
  onDelete: (id: number) => void;
}) {
  const [lead, setLead] = useState(init);
  const [expanded, setExpanded] = useState(false);
  const [moving, setMoving] = useState(false);
  const [note, setNote] = useState("");
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmMove = () => {
    if (!pendingStatus) return;
    startTransition(async () => {
      const updated = await updateLeadStatusAction(
        lead.id,
        pendingStatus,
        note,
      );
      setLead(updated);
      onUpdate(updated);
      setMoving(false);
      setPendingStatus(null);
      setNote("");
    });
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border overflow-hidden",
        lead.status === "new" ? "border-blue-100" : "border-zinc-100",
      )}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-4 px-5 py-4 hover:bg-zinc-50/60 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-zinc-900">
              {lead.full_name}
            </p>
            {lead.company_name && (
              <span className="text-xs text-zinc-400">{lead.company_name}</span>
            )}
            <span
              className={clsx(
                "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                STATUS_COLORS[lead.status],
              )}
            >
              {lead.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {lead.email} · {lead.phone_number} · {formatDate(lead.created_at)}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-50">
          {lead.notes && (
            <div className="bg-zinc-50 rounded-xl p-3 mt-3">
              <p className="text-xs text-zinc-600 whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}

          {/* Status pipeline */}
          {lead.allowed_transitions.length > 0 && !moving && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400">Move to:</span>
              {lead.allowed_transitions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPendingStatus(s);
                    setMoving(true);
                  }}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                    STATUS_COLORS[s],
                    "border-current/20",
                  )}
                >
                  <ArrowRight className="w-3 h-3 inline mr-1" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {moving && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">
                Moving to <strong>{pendingStatus}</strong>
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Add a note (optional)…"
                className="w-full text-xs border border-zinc-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMoving(false);
                    setPendingStatus(null);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs border border-zinc-200 rounded-lg text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMove}
                  disabled={isPending}
                  className="flex-1 px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-lg disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}{" "}
                  Confirm
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => onDelete(lead.id)}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete lead
          </button>
        </div>
      )}
    </div>
  );
}

// ── Newsletter editor ─────────────────────────────────────────────────────────
function NewsletterEditor({
  newsletter: init,
  onUpdate,
  onDelete,
  onSent,
}: {
  newsletter: Newsletter;
  onUpdate: (n: Newsletter) => void;
  onDelete: (id: number) => void;
  onSent: (result: { sent: number; failed: number }) => void;
}) {
  const [nl, setNl] = useState(init);
  const [editing, setEditing] = useState(false);
  const [subject, setSubject] = useState(nl.subject);
  const [body, setBody] = useState(nl.body);
  const [recipType, setRecipType] = useState(nl.recipient_type);
  const [showSend, setShowSend] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  const handleSave = () => {
    startTransition(async () => {
      const updated = await updateNewsletterAction(nl.id, {
        subject,
        body,
        recipient_type: recipType,
      });
      setNl(updated);
      onUpdate(updated);
      setEditing(false);
    });
  };

  const handleSend = () => {
    startTransition(async () => {
      try {
        const result = await sendNewsletterAction(nl.id);
        setNl((p) => ({ ...p, status: "sent" }));
        onSent(result);
        setShowSend(false);
        setFeedback(`Sent to ${result.sent} recipients.`);
        setTimeout(() => setFeedback(""), 5000);
      } catch (err: unknown) {
        setFeedback(err instanceof Error ? err.message : "Send failed.");
      }
    });
  };

  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border overflow-hidden",
        nl.status === "sent" ? "border-green-100" : "border-zinc-100",
      )}
    >
      <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900 truncate max-w-[300px]">
              {nl.subject}
            </p>
            <span
              className={clsx(
                "px-2 py-0.5 rounded-md text-xs font-medium",
                nl.status === "sent"
                  ? "bg-green-50 text-green-700"
                  : "bg-zinc-100 text-zinc-500",
              )}
            >
              {nl.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {nl.recipient_type.replace(/_/g, " ")} · {formatDate(nl.created_at)}
            {nl.status === "sent" && ` · ${nl.sent_count} sent`}
          </p>
        </div>
        {nl.status !== "sent" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing((p) => !p)}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-lg"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowSend(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-900 text-white rounded-xl hover:bg-zinc-700"
            >
              <Send className="w-3 h-3" /> Send
            </button>
            <button
              onClick={() => onDelete(nl.id)}
              className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className="mx-5 mb-4 px-3 py-2 bg-green-50 text-green-700 text-xs rounded-lg">
          {feedback}
        </div>
      )}

      {editing && (
        <div className="px-5 pb-5 space-y-4 border-t border-zinc-50 pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputCls()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">
              Recipients
            </label>
            <select
              value={recipType}
              onChange={(e) => setRecipType(e.target.value)}
              className={inputCls()}
            >
              <option value="opted_in">Opted-in subscribers</option>
              <option value="users">All registered users</option>
              <option value="leads">Leads only</option>
              <option value="all">Everyone (users + leads)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Body</label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              minHeight={200}
              placeholder="Email body…"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}{" "}
              Save
            </button>
          </div>
        </div>
      )}

      {showSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Send newsletter?</p>
                <p className="text-sm text-zinc-400">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm bg-zinc-50 rounded-xl px-4 py-3 text-zinc-700 truncate font-medium">
              {nl.subject}
            </p>
            <p className="text-xs text-zinc-500">
              Recipients:{" "}
              <strong>{nl.recipient_type.replace(/_/g, " ")}</strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSend(false)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}{" "}
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MarketingClient({
  initialLeads,
  initialNewsletters,
  initialStats,
}: {
  initialLeads: PaginatedLeads | null;
  initialNewsletters: PaginatedNewsletters | null;
  initialStats: MarketingStats | null;
}) {
  const [tab, setTab] = useState<"leads" | "newsletters">("leads");
  const [leads, setLeads] = useState(initialLeads?.results ?? []);
  const [newsletters, setNewsletters] = useState(
    initialNewsletters?.results ?? [],
  );
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [showCreateNL, setShowCreateNL] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create lead form
  const [lName, setLName] = useState("");
  const [lEmail, setLEmail] = useState("");
  const [lPhone, setLPhone] = useState("");
  const [lComp, setLComp] = useState("");
  const [lSrc, setLSrc] = useState("website");
  const [lErrors, setLErrors] = useState<Record<string, string>>({});

  // Create newsletter form
  const [nSubject, setNSubject] = useState("");
  const [nBody, setNBody] = useState("");
  const [nType, setNType] = useState("opted_in");
  const [nErrors, setNErrors] = useState<Record<string, string>>({});

  const handleCreateLead = () => {
    const e: Record<string, string> = {};
    if (!lName.trim()) e.lName = "Name is required.";
    if (!lEmail.trim()) e.lEmail = "Email is required.";
    if (!lPhone.trim()) e.lPhone = "Phone is required.";
    setLErrors(e);
    if (Object.keys(e).length) return;
    startTransition(async () => {
      const created = await createLeadAction({
        full_name: lName.trim(),
        email: lEmail.trim(),
        phone_number: lPhone.trim(),
        company_name: lComp.trim() || undefined,
        source: lSrc,
      });
      setLeads((p) => [created, ...p]);
      setShowCreateLead(false);
      setLName("");
      setLEmail("");
      setLPhone("");
      setLComp("");
    });
  };

  const handleCreateNewsletter = () => {
    const e: Record<string, string> = {};
    if (!nSubject.trim()) e.nSubject = "Subject is required.";
    if (!nBody.trim() || nBody === "<p></p>") e.nBody = "Body is required.";
    setNErrors(e);
    if (Object.keys(e).length) return;
    startTransition(async () => {
      const created = await createNewsletterAction({
        subject: nSubject.trim(),
        body: nBody,
        recipient_type: nType,
      });
      setNewsletters((p) => [created, ...p]);
      setShowCreateNL(false);
      setNSubject("");
      setNBody("");
      setNType("opted_in");
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">Marketing</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          Lead pipeline and email campaigns
        </p>
      </div>

      <StatsStrip stats={initialStats} />

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-zinc-100 p-1.5">
        {(
          [
            { id: "leads", label: `Leads (${leads.length})`, icon: Users },
            {
              id: "newsletters",
              label: `Newsletters (${newsletters.length})`,
              icon: Mail,
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

      {/* ── Leads tab ── */}
      {tab === "leads" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateLead((p) => !p)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700"
            >
              <Plus className="w-4 h-4" /> Add lead
            </button>
          </div>

          {showCreateLead && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                New lead
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Full name *
                  </label>
                  <input
                    value={lName}
                    onChange={(e) => setLName(e.target.value)}
                    className={inputCls(lErrors.lName)}
                  />
                  {lErrors.lName && (
                    <p className="text-xs text-red-500">{lErrors.lName}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Email *
                  </label>
                  <input
                    value={lEmail}
                    onChange={(e) => setLEmail(e.target.value)}
                    type="email"
                    className={inputCls(lErrors.lEmail)}
                  />
                  {lErrors.lEmail && (
                    <p className="text-xs text-red-500">{lErrors.lEmail}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Phone *
                  </label>
                  <input
                    value={lPhone}
                    onChange={(e) => setLPhone(e.target.value)}
                    className={inputCls(lErrors.lPhone)}
                  />
                  {lErrors.lPhone && (
                    <p className="text-xs text-red-500">{lErrors.lPhone}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Company
                  </label>
                  <input
                    value={lComp}
                    onChange={(e) => setLComp(e.target.value)}
                    className={inputCls()}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-zinc-500">
                    Source
                  </label>
                  <select
                    value={lSrc}
                    onChange={(e) => setLSrc(e.target.value)}
                    className={inputCls()}
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateLead(false)}
                  className="px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLead}
                  disabled={isPending}
                  className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl disabled:opacity-60 flex items-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}{" "}
                  Create
                </button>
              </div>
            </div>
          )}

          {leads.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center text-sm text-zinc-400">
              No leads yet.
            </div>
          ) : (
            leads.map((l) => (
              <LeadCard
                key={l.id}
                lead={l}
                onUpdate={(u) =>
                  setLeads((p) => p.map((x) => (x.id === u.id ? u : x)))
                }
                onDelete={(id) => {
                  startTransition(async () => {
                    await deleteLeadAction(id);
                    setLeads((p) => p.filter((x) => x.id !== id));
                  });
                }}
              />
            ))
          )}
        </div>
      )}

      {/* ── Newsletters tab ── */}
      {tab === "newsletters" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateNL((p) => !p)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-700"
            >
              <Plus className="w-4 h-4" /> New newsletter
            </button>
          </div>

          {showCreateNL && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                New newsletter
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-500">
                  Subject *
                </label>
                <input
                  value={nSubject}
                  onChange={(e) => setNSubject(e.target.value)}
                  className={inputCls(nErrors.nSubject)}
                />
                {nErrors.nSubject && (
                  <p className="text-xs text-red-500">{nErrors.nSubject}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-500">
                  Recipients
                </label>
                <select
                  value={nType}
                  onChange={(e) => setNType(e.target.value)}
                  className={inputCls()}
                >
                  <option value="opted_in">Opted-in subscribers</option>
                  <option value="users">All registered users</option>
                  <option value="leads">Leads only</option>
                  <option value="all">Everyone</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-500">
                  Body *
                </label>
                <RichTextEditor
                  value={nBody}
                  onChange={setNBody}
                  minHeight={200}
                  placeholder="Email body…"
                />
                {nErrors.nBody && (
                  <p className="text-xs text-red-500">{nErrors.nBody}</p>
                )}
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowCreateNL(false)}
                  className="px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewsletter}
                  disabled={isPending}
                  className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl disabled:opacity-60 flex items-center gap-2"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}{" "}
                  Create draft
                </button>
              </div>
            </div>
          )}

          {newsletters.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center text-sm text-zinc-400">
              No newsletters yet.
            </div>
          ) : (
            newsletters.map((n) => (
              <NewsletterEditor
                key={n.id}
                newsletter={n}
                onUpdate={(u) =>
                  setNewsletters((p) => p.map((x) => (x.id === u.id ? u : x)))
                }
                onDelete={(id) => {
                  startTransition(async () => {
                    await deleteNewsletterAction(id);
                    setNewsletters((p) => p.filter((x) => x.id !== id));
                  });
                }}
                onSent={() => {}}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
