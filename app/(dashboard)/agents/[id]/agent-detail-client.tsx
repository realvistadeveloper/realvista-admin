"use client";

// app/(dashboard)/agents/[id]/agent-detail-client.tsx
import { useState, useTransition } from "react";
import Link from "next/link";
import type { Agent, AgentVerification } from "../types";
import {
  updateAgentAction,
  toggleAgentVerifiedAction,
  toggleAgentFeaturedAction,
  reviewVerificationAction,
  assignAdminAction,
} from "../actions";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  Building2,
  Phone,
  Mail,
  Globe,
  Loader2,
  Check,
  X,
  Pencil,
  ShieldCheck,
  ShieldAlert,
  FileText,
  UserCheck,
  MessageSquare,
  ExternalLink,
  TriangleAlert,
  Sparkles,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "profile" | "properties" | "verification" | "ratings";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: UserCheck },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "verification", label: "Verification", icon: ShieldCheck },
  { id: "ratings", label: "Ratings", icon: Star },
];

// ── Shared helpers ────────────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  const base =
    "w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={clsx(base, "resize-none")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
        <Icon className="w-3.5 h-3.5 text-zinc-300" /> {label}
      </div>
      <span className="text-sm text-zinc-800 truncate text-right">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgentDetailClient({
  agent: initialAgent,
  accessToken,
  adminLevel,
}: {
  agent: Agent;
  accessToken: string;
  adminLevel: number;
}) {
  const [agent, setAgent] = useState(initialAgent);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleVerified = () => {
    startTransition(async () => {
      try {
        const r = await toggleAgentVerifiedAction(agent.id);
        setAgent((a) => ({ ...a, verified: r.verified }));
        showFeedback("success", r.detail);
      } catch {
        showFeedback("error", "Failed to update.");
      }
    });
  };

  const handleToggleFeatured = () => {
    startTransition(async () => {
      try {
        const r = await toggleAgentFeaturedAction(agent.id);
        setAgent((a) => ({ ...a, featured: r.featured }));
        showFeedback("success", r.detail);
      } catch {
        showFeedback("error", "Failed to update.");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to agents
      </Link>

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

      {/* ── Header card ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
              <UserCheck className="w-7 h-7 text-zinc-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold text-zinc-900">
                  {agent.user.name || "—"}
                </h1>
                {agent.verified && (
                  <BadgeCheck className="w-4 h-4 text-green-500" />
                )}
                {agent.featured && (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <p className="text-sm text-zinc-400">{agent.user.email}</p>
              {agent.agency_name && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  {agent.agency_name}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                    agent.verified
                      ? "bg-green-50 text-green-700"
                      : "bg-zinc-100 text-zinc-500",
                  )}
                >
                  <BadgeCheck className="w-3 h-3" />
                  {agent.verified ? "Verified" : "Unverified"}
                </span>
                {agent.featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-600">
                    <Sparkles className="w-3 h-3" /> Featured
                  </span>
                )}
                {agent.average_rating && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-50 text-zinc-600">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {agent.average_rating} ({agent.rating_count})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {adminLevel >= 3 && (
              <button
                onClick={handleToggleVerified}
                disabled={isPending}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl transition-colors disabled:opacity-60",
                  agent.verified
                    ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    : "bg-green-600 text-white hover:bg-green-700",
                )}
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <BadgeCheck className="w-3.5 h-3.5" />
                )}
                {agent.verified ? "Unverify" : "Verify"}
              </button>
            )}
            <button
              onClick={handleToggleFeatured}
              disabled={isPending}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl transition-colors disabled:opacity-60",
                agent.featured
                  ? "bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {agent.featured ? "Unfeature" : "Feature"}
            </button>
          </div>
        </div>

        {/* Assigned admin */}
        <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <UserCheck className="w-3.5 h-3.5" />
            {agent.admin ? (
              <>
                Managed by{" "}
                <span className="font-medium text-zinc-600 ml-1">
                  {agent.admin.name}
                </span>
              </>
            ) : (
              <span className="text-red-400 italic">No admin assigned</span>
            )}
          </div>
          {adminLevel >= 3 && (
            <button
              onClick={() => setActiveTab("profile")}
              className="text-xs text-blue-600 hover:underline"
            >
              Reassign
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-zinc-100 p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-1 justify-center",
              activeTab === tab.id
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50",
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
            {/* Verification dot indicator */}
            {tab.id === "verification" &&
              agent.has_verification &&
              !agent.verification?.reviewed && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              )}
          </button>
        ))}
      </div>

      {/* ── Tab panels ── */}
      {activeTab === "profile" && (
        <ProfileTab
          agent={agent}
          adminLevel={adminLevel}
          accessToken={accessToken}
          onUpdate={(updated) => setAgent(updated)}
          onFeedback={showFeedback}
        />
      )}
      {activeTab === "properties" && (
        <PropertiesTab
          agentUserId={agent.user.id}
          agentId={agent.id}
          accessToken={accessToken}
        />
      )}
      {activeTab === "verification" && (
        <VerificationTab
          agent={agent}
          adminLevel={adminLevel}
          onUpdate={(updated) =>
            setAgent((a) => ({
              ...a,
              verified: updated.agent_verified ?? a.verified,
            }))
          }
          onFeedback={showFeedback}
        />
      )}
      {activeTab === "ratings" && <RatingsTab agent={agent} />}
    </div>
  );
}

// ── Tab: Profile ──────────────────────────────────────────────────────────────

function ProfileTab({
  agent,
  adminLevel,
  accessToken,
  onUpdate,
  onFeedback,
}: {
  agent: Agent;
  adminLevel: number;
  accessToken: string;
  onUpdate: (a: Agent) => void;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const [form, setForm] = useState({
    agency_name: agent.agency_name ?? "",
    agency_address: agent.agency_address ?? "",
    phone_number: agent.phone_number ?? "",
    whatsapp_number: agent.whatsapp_number ?? "",
    experience_years: String(agent.experience_years ?? 0),
    preferred_contact_mode: agent.preferred_contact_mode ?? "phone",
    bio: agent.bio ?? "",
  });
  const [saving, startSave] = useTransition();
  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    startSave(async () => {
      try {
        const updated = await updateAgentAction(agent.id, {
          ...form,
          experience_years: parseInt(form.experience_years) || 0,
          agency_name: form.agency_name || null,
          agency_address: form.agency_address || null,
          phone_number: form.phone_number || null,
          whatsapp_number: form.whatsapp_number || null,
          bio: form.bio || null,
        });
        onUpdate(updated);
        onFeedback("success", "Profile updated.");
      } catch {
        onFeedback("error", "Failed to save.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Profile edit */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Agent profile
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
            Save changes
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EditableField
            label="Agency name"
            value={form.agency_name}
            onChange={set("agency_name")}
          />
          <EditableField
            label="Phone number"
            value={form.phone_number}
            onChange={set("phone_number")}
            type="tel"
          />
          <EditableField
            label="WhatsApp"
            value={form.whatsapp_number}
            onChange={set("whatsapp_number")}
            type="tel"
          />
          <EditableField
            label="Experience (years)"
            value={form.experience_years}
            onChange={set("experience_years")}
            type="number"
          />
          <SelectField
            label="Preferred contact"
            value={form.preferred_contact_mode}
            onChange={set("preferred_contact_mode")}
            options={[
              { value: "phone", label: "Phone" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "email", label: "Email" },
            ]}
          />
          <div className="sm:col-span-2">
            <EditableField
              label="Agency address"
              value={form.agency_address}
              onChange={set("agency_address")}
              multiline
            />
          </div>
          <div className="sm:col-span-2">
            <EditableField
              label="Bio"
              value={form.bio}
              onChange={set("bio")}
              multiline
            />
          </div>
        </div>
      </div>

      {/* User account summary */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          User account
        </p>
        <InfoRow icon={Mail} label="Email" value={agent.user.email} />
        <InfoRow
          icon={UserCheck}
          label="Active"
          value={agent.user.is_active ? "Yes" : "No"}
        />
        <InfoRow
          icon={BadgeCheck}
          label="Email verified"
          value={agent.user.is_email_verified ? "Yes" : "No"}
        />
        <div className="pt-2">
          <Link
            href={`/users/${agent.user.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Manage user account
          </Link>
        </div>
      </div>

      {/* Assign admin — level 3+ only */}
      {adminLevel >= 3 && (
        <AssignAdminCard
          agent={agent}
          accessToken={accessToken}
          onFeedback={onFeedback}
        />
      )}
    </div>
  );
}

// ── Tab: Properties ───────────────────────────────────────────────────────────

type PropertyRow = {
  id: number;
  title: string;
  status: string;
  city: string;
  state: string;
  price: string;
  currency: string;
  listed_date: string;
};

function PropertiesTab({
  agentUserId,
  agentId,
  accessToken,
}: {
  agentUserId: number;
  agentId: number;
  accessToken: string;
}) {
  const [properties, setProperties] = useState<{
    count: number;
    results: PropertyRow[];
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";
      const res = await fetch(
        `${base}/api/admin/properties/?owner_id=${agentUserId}&page_size=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProperties(data);
      setLoaded(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-500",
    pending: "bg-amber-50 text-amber-700",
    published: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-600",
  };

  if (!loaded) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-10 flex flex-col items-center gap-3 text-center">
        <Building2 className="w-8 h-8 text-zinc-200" />
        <p className="text-sm font-medium text-zinc-700">Agent properties</p>
        <p className="text-xs text-zinc-400">
          Load to view, manage, or add new listings for this agent.
        </p>
        <div className="flex gap-2 mt-1">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Load properties
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">
            Failed to load. Try again.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with count + add button */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">
          {properties?.count ?? 0} propert
          {(properties?.count ?? 0) === 1 ? "y" : "ies"}
        </p>
        <Link
          href={`/properties/new?owner_id=${agentUserId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add property
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
        {properties?.results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Building2 className="w-8 h-8 text-zinc-200" />
            <p className="text-sm text-zinc-500">No properties yet</p>
            <Link
              href={`/properties/new?owner_id=${agentUserId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add first property
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                  Location
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {(properties?.results ?? []).map((prop) => (
                <tr
                  key={prop.id}
                  className="hover:bg-zinc-50/60 transition-colors group"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-800 truncate max-w-[200px]">
                      {prop.title}
                    </p>
                    <p className="text-xs text-zinc-400 tabular-nums">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: prop.currency,
                        maximumFractionDigits: 0,
                      }).format(parseFloat(prop.price))}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-xs text-zinc-400">
                    {prop.city}, {prop.state}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={clsx(
                        "px-2 py-0.5 rounded-md text-xs font-medium capitalize",
                        STATUS_COLORS[prop.status] ??
                          "bg-zinc-100 text-zinc-500",
                      )}
                    >
                      {prop.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/properties/${prop.id}`}
                      className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 opacity-0 group-hover:opacity-100 transition-colors"
                    >
                      Manage <ExternalLink className="w-3 h-3" />
                    </Link>
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

// ── Tab: Verification ─────────────────────────────────────────────────────────

function VerificationTab({
  agent,
  adminLevel,
  onUpdate,
  onFeedback,
}: {
  agent: Agent;
  adminLevel: number;
  onUpdate: (r: { agent_verified: boolean }) => void;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const v = agent.verification;
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [saving, startSave] = useTransition();

  const handleReview = (approved: boolean) => {
    startSave(async () => {
      try {
        const r = await reviewVerificationAction(
          agent.id,
          approved,
          rejectionReason,
        );
        onUpdate({ agent_verified: r.approved });
        onFeedback("success", r.detail);
        setShowRejectInput(false);
        setRejectionReason("");
      } catch {
        onFeedback("error", "Failed to submit review.");
      }
    });
  };

  if (!v) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-10 flex flex-col items-center gap-3 text-center">
        <FileText className="w-8 h-8 text-zinc-200" />
        <p className="text-sm font-medium text-zinc-700">
          No documents submitted
        </p>
        <p className="text-xs text-zinc-400">
          The agent has not submitted verification documents yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Review status */}
      <div
        className={clsx(
          "rounded-2xl border p-4 flex items-center gap-3",
          v.approved
            ? "bg-green-50 border-green-100"
            : v.reviewed
              ? "bg-red-50 border-red-100"
              : "bg-amber-50 border-amber-100",
        )}
      >
        {v.approved ? (
          <>
            <BadgeCheck className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700">
                Verification approved
              </p>
            </div>
          </>
        ) : v.reviewed ? (
          <>
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-600">
                Verification rejected
              </p>
              {v.rejection_reason && (
                <p className="text-xs text-red-500 mt-0.5">
                  {v.rejection_reason}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Pending review
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Submitted {new Date(v.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Documents
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "ID Card", url: v.id_card },
            { label: "Photo", url: v.photo },
            { label: "Business registration", url: v.business_registration },
          ].map(({ label, url }) => (
            <div key={label} className="space-y-2">
              <p className="text-xs font-medium text-zinc-500">{label}</p>
              {url ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50">
                  <img
                    src={url}
                    alt={label}
                    className="w-full h-32 object-cover"
                  />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group"
                  >
                    <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              ) : (
                <div className="h-32 rounded-xl border-2 border-dashed border-zinc-100 flex items-center justify-center">
                  <p className="text-xs text-zinc-300">Not submitted</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Review actions — level 3+ only */}
      {adminLevel >= 3 && !v.approved && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Review decision
          </p>
          {showRejectInput ? (
            <div className="space-y-3">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection…"
                rows={3}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-300"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReview(false)}
                  disabled={!rejectionReason.trim() || saving}
                  className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleReview(true)}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100"
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Ratings ──────────────────────────────────────────────────────────────

function RatingsTab({ agent }: { agent: Agent }) {
  const ratings = agent.ratings ?? [];

  if (ratings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-10 flex flex-col items-center gap-3 text-center">
        <Star className="w-8 h-8 text-zinc-200" />
        <p className="text-sm font-medium text-zinc-700">No ratings yet</p>
        <p className="text-xs text-zinc-400">
          Ratings will appear here once users review this agent.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-zinc-900">
            {agent.average_rating?.toFixed(1) ?? "—"}
          </p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={clsx(
                  "w-3.5 h-3.5",
                  n <= Math.round(agent.average_rating ?? 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-zinc-200",
                )}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {agent.rating_count} reviews
          </p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => {
            const count = ratings.filter((r) => r.rating === n).length;
            const pct = ratings.length ? (count / ratings.length) * 100 : 0;
            return (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 w-3 text-right">
                  {n}
                </span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 w-4">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review list */}
      <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-50">
        {ratings.map((rating) => (
          <div key={rating.id} className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-800">
                  {rating.reviewer_name}
                </p>
                <p className="text-xs text-zinc-400">{rating.reviewer_email}</p>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={clsx(
                      "w-3.5 h-3.5",
                      n <= rating.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-zinc-200",
                    )}
                  />
                ))}
              </div>
            </div>
            {rating.review && (
              <p className="text-sm text-zinc-600 leading-relaxed">
                {rating.review}
              </p>
            )}
            <p className="text-xs text-zinc-400">
              {new Date(rating.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AssignAdminCard ───────────────────────────────────────────────────────────

function AssignAdminCard({
  agent,
  accessToken,
  onFeedback,
}: {
  agent: Agent;
  accessToken: string;
  onFeedback: (type: "success" | "error", msg: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<
    { id: number; name: string; email: string; role: string | null }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [assigning, startAssign] = useTransition();
  const [currentAdmin, setCurrentAdmin] = useState(agent.admin);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";
      const res = await fetch(
        `${base}/api/admin/users/?search=${encodeURIComponent(q)}&page_size=8`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(
        data.results?.map(
          (u: {
            id: number;
            name: string;
            email: string;
            role: string | null;
          }) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
          }),
        ) ?? [],
      );
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAssign = (
    adminId: number,
    adminName: string,
    adminEmail: string,
    adminRole: string | null,
  ) => {
    startAssign(async () => {
      try {
        await assignAdminAction(agent.id, adminId);
        setCurrentAdmin({
          id: adminId,
          name: adminName,
          email: adminEmail,
          role: adminRole,
          access_level: null,
        });
        setSearch("");
        setResults([]);
        onFeedback("success", `Assigned to ${adminName}.`);
      } catch {
        onFeedback("error", "Failed to assign admin.");
      }
    });
  };

  const handleUnassign = () => {
    startAssign(async () => {
      try {
        await assignAdminAction(agent.id, null);
        setCurrentAdmin(null);
        onFeedback("success", "Admin unassigned.");
      } catch {
        onFeedback("error", "Failed to unassign.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        Assigned admin
      </p>

      {/* Current assignment */}
      {currentAdmin ? (
        <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-brand-700">
                {currentAdmin.name?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-800 truncate">
                {currentAdmin.name}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {currentAdmin.email}
                {currentAdmin.role &&
                  ` · ${currentAdmin.role.replace(/_/g, " ")}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleUnassign}
            disabled={assigning}
            className="text-xs text-red-500 hover:text-red-700 shrink-0 disabled:opacity-50"
          >
            {assigning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Unassign"
            )}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-400 italic px-1">No admin assigned</p>
      )}

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search admin by name or email…"
            className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 animate-spin" />
          )}
        </div>

        {results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {results.map((admin) => (
              <button
                key={admin.id}
                onClick={() =>
                  handleAssign(admin.id, admin.name, admin.email, admin.role)
                }
                disabled={assigning}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0 disabled:opacity-50"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-zinc-500">
                    {admin.name?.[0]?.toUpperCase() ?? "A"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 truncate">
                    {admin.name}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {admin.email}
                    {admin.role && ` · ${admin.role.replace(/_/g, " ")}`}
                  </p>
                </div>
                {assigning && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
