"use client";
// components/agents/AgentDrawer.tsx

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  Agent,
  AgentVerification,
  AgentRating,
  MarketProperty,
  PaginatedResponse,
} from "@/lib/types";
import {
  X,
  ShieldCheck,
  ShieldX,
  Star,
  Building2,
  UserCog,
  Check,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
  Award,
  Phone,
  MapPin,
  FileText,
  Eye,
  Image,
  UserX,
  UserCheck,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { clsx } from "clsx";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: number;
  name: string;
  email: string;
  access_level: number;
}

interface Props {
  agent: Agent;
  accessToken: string;
  staffLevel: number;
  onClose: () => void;
  onUpdated: (a: Agent) => void;
  onDeleted: () => void;
}

type Tab = "profile" | "verification" | "ratings" | "properties" | "staff";

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm text-zinc-800 break-words">
        {value ?? <span className="text-zinc-300">—</span>}
      </p>
    </div>
  );
}

function TabBtn({
  id,
  active,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  id: Tab;
  active: boolean;
  icon: React.ElementType;
  label: string;
  badge?: number;
  onClick: (t: Tab) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition whitespace-nowrap",
        active
          ? "bg-brand-50 text-brand-700"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800",
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {badge != null && badge > 0 && (
        <span
          className={clsx(
            "w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold",
            active
              ? "bg-brand-200 text-brand-800"
              : "bg-zinc-200 text-zinc-600",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgentDrawer({
  agent,
  accessToken,
  staffLevel,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isSuperAdmin = staffLevel >= 5;

  // Profile edit state
  const [editForm, setEditForm] = useState({
    agency_name: agent.agency_name ?? "",
    agency_address: agent.agency_address ?? "",
    phone_number: agent.phone_number ?? "",
    whatsapp_number: agent.whatsapp_number ?? "",
    experience_years: agent.experience_years,
    preferred_contact_mode: agent.preferred_contact_mode,
    bio: agent.bio ?? "",
    verified: agent.verified,
    featured: agent.featured,
  });

  // Lazy-loaded tab data
  const [verification, setVerification] = useState<
    AgentVerification | null | "none"
  >(null);
  const [ratings, setRatings] = useState<AgentRating[]>([]);
  const [properties, setProperties] = useState<MarketProperty[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<number | "">(
    agent.admin?.id ?? "",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const notify = (msg: string, ok = true) => {
    if (ok) setSuccess(msg);
    else setError(msg);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3500);
  };

  // Load tab data when switching
  useEffect(() => {
    if (tab === "verification" && verification === null) {
      apiFetch<AgentVerification>(
        `/admin-api/agents/${agent.id}/verification/`,
        {},
        accessToken,
      )
        .then(setVerification)
        .catch(() => setVerification("none"));
    }
    if (tab === "ratings" && ratings.length === 0) {
      apiFetch<PaginatedResponse<AgentRating>>(
        `/admin-api/agents/${agent.id}/ratings/`,
        {},
        accessToken,
      )
        .then((res) => setRatings(res.results))
        .catch(() => {});
    }
    if (tab === "properties" && properties.length === 0) {
      apiFetch<PaginatedResponse<MarketProperty>>(
        `/admin-api/properties/?owner_id=${agent.user.id}`,
        {},
        accessToken,
      )
        .then((res) => setProperties(res.results))
        .catch(() => {});
    }
    if (tab === "staff" && staffList.length === 0 && isSuperAdmin) {
      apiFetch<StaffMember[]>("/admin-api/agents/staff/", {}, accessToken)
        .then(setStaffList)
        .catch(() => {});
    }
  }, [tab]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const saveProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await apiFetch<Agent>(
        `/admin-api/agents/${agent.id}/`,
        { method: "PATCH", body: JSON.stringify(editForm) },
        accessToken,
      );
      onUpdated(updated);
      notify("Agent profile saved.");
    } catch (e: any) {
      notify(e.message ?? "Save failed", false);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerified = () =>
    setEditForm((f) => ({ ...f, verified: !f.verified }));
  const toggleFeatured = () =>
    setEditForm((f) => ({ ...f, featured: !f.featured }));

  const reviewVerification = async (approved: boolean, reason = "") => {
    setLoading(true);
    setError(null);
    try {
      const v = await apiFetch<AgentVerification>(
        `/admin-api/agents/${agent.id}/verification/`,
        {
          method: "PATCH",
          body: JSON.stringify({ approved, rejection_reason: reason }),
        },
        accessToken,
      );
      setVerification(v);
      notify(approved ? "Agent approved." : "Agent rejected.");
    } catch (e: any) {
      notify(e.message ?? "Review failed", false);
    } finally {
      setLoading(false);
    }
  };

  const assignStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(
        `/admin-api/agents/${agent.id}/assign-admin/`,
        {
          method: "POST",
          body: JSON.stringify({ staff_user_id: selectedStaffId || null }),
        },
        accessToken,
      );
      notify(selectedStaffId ? "Staff assigned." : "Staff unassigned.");
      // Reload agent
      const updated = await apiFetch<Agent>(
        `/admin-api/agents/${agent.id}/`,
        {},
        accessToken,
      );
      onUpdated(updated);
    } catch (e: any) {
      notify(e.message ?? "Assign failed", false);
    } finally {
      setLoading(false);
    }
  };

  const deleteAgent = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(
        `/admin-api/agents/${agent.id}/`,
        { method: "DELETE" },
        accessToken,
      );
      onDeleted();
    } catch (e: any) {
      notify(e.message ?? "Delete failed", false);
      setLoading(false);
    }
  };

  const toggleAgentActive = async () => {
    try {
      await apiFetch(
        `/admin-api/users/${agent.user.id}/toggle-status/`,
        { method: "POST" },
        accessToken,
      );
      const updated = await apiFetch<Agent>(
        `/admin-api/agents/${agent.id}/`,
        {},
        accessToken,
      );
      onUpdated(updated);
      notify(`Agent ${agent.user.is_active ? "deactivated" : "activated"}.`);
    } catch (e: any) {
      notify(e.message ?? "Toggle failed", false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            {agent.avatar ? (
              <img
                src={agent.avatar}
                className="w-11 h-11 rounded-full object-cover shrink-0"
                alt=""
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-sm font-bold text-brand-700 shrink-0">
                {agent.user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-zinc-900">
                  {agent.user.name}
                </h2>
                {agent.verified && (
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                )}
                {agent.featured && (
                  <Award className="w-4 h-4 text-purple-500" />
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {agent.user.email} · Agent #{agent.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-100 overflow-x-auto shrink-0">
          <TabBtn
            id="profile"
            active={tab === "profile"}
            icon={UserCog}
            label="Profile"
            onClick={setTab}
          />
          <TabBtn
            id="verification"
            active={tab === "verification"}
            icon={ShieldCheck}
            label="Verification"
            onClick={setTab}
          />
          <TabBtn
            id="ratings"
            active={tab === "ratings"}
            icon={Star}
            label="Ratings"
            badge={agent.rating_count}
            onClick={setTab}
          />
          <TabBtn
            id="properties"
            active={tab === "properties"}
            icon={Building2}
            label="Properties"
            onClick={setTab}
          />
          {isSuperAdmin && (
            <TabBtn
              id="staff"
              active={tab === "staff"}
              icon={UserCog}
              label="Assign staff"
              onClick={setTab}
            />
          )}
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div
            className={clsx(
              "mx-5 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm shrink-0",
              error
                ? "bg-red-50 border border-red-100 text-red-700"
                : "bg-green-50 border border-green-100 text-green-700",
            )}
          >
            {error ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <Check className="w-4 h-4 shrink-0" />
            )}
            {error ?? success}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* ── PROFILE TAB ── */}
          {tab === "profile" && (
            <div className="px-6 py-5 space-y-5">
              {/* Quick toggles */}
              <div className="flex gap-3">
                {[
                  {
                    label: "Verified",
                    active: editForm.verified,
                    toggle: toggleVerified,
                    activeClass: "bg-green-50 border-green-200 text-green-700",
                    inactiveClass: "bg-zinc-50 border-zinc-200 text-zinc-600",
                  },
                  {
                    label: "Featured",
                    active: editForm.featured,
                    toggle: toggleFeatured,
                    activeClass:
                      "bg-purple-50 border-purple-200 text-purple-700",
                    inactiveClass: "bg-zinc-50 border-zinc-200 text-zinc-600",
                  },
                ].map(
                  ({ label, active, toggle, activeClass, inactiveClass }) => (
                    <button
                      key={label}
                      onClick={toggle}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition",
                        active ? activeClass : inactiveClass,
                      )}
                    >
                      {active ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                      {label}
                    </button>
                  ),
                )}

                <button
                  onClick={toggleAgentActive}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition ml-auto",
                    agent.user.is_active
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
                  )}
                >
                  {agent.user.is_active ? (
                    <>
                      <UserX className="w-4 h-4" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Activate
                    </>
                  )}
                </button>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    key: "agency_name",
                    label: "Agency name",
                    placeholder: "Realty Co.",
                  },
                  { key: "phone_number", label: "Phone", placeholder: "+234…" },
                  {
                    key: "whatsapp_number",
                    label: "WhatsApp",
                    placeholder: "+234…",
                  },
                  {
                    key: "experience_years",
                    label: "Years exp.",
                    placeholder: "5",
                    type: "number",
                  },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">
                      {label}
                    </label>
                    <input
                      type={type ?? "text"}
                      value={(editForm as any)[key]}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          [key]:
                            type === "number"
                              ? parseInt(e.target.value) || 0
                              : e.target.value,
                        }))
                      }
                      placeholder={placeholder}
                      className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Agency address
                </label>
                <input
                  value={editForm.agency_address}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      agency_address: e.target.value,
                    }))
                  }
                  className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="123 Realty St, Lagos"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Preferred contact
                </label>
                <select
                  value={editForm.preferred_contact_mode}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      preferred_contact_mode: e.target.value as any,
                    }))
                  }
                  className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                >
                  {["phone", "whatsapp", "email"].map((v) => (
                    <option key={v} value={v} className="capitalize">
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600 resize-none"
                  placeholder="Brief agent biography…"
                />
              </div>

              {/* Danger zone */}
              <div className="pt-2 border-t border-zinc-100">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Delete agent
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                    <p className="text-sm text-red-700 font-medium">
                      Delete {agent.user.name}'s agent profile?
                    </p>
                    <p className="text-xs text-red-500">
                      This deactivates their account. Pass ?hard=true to
                      permanently delete (super-admin only).
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={deleteAgent}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 rounded-xl border text-sm text-zinc-700 hover:bg-zinc-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── VERIFICATION TAB ── */}
          {tab === "verification" && (
            <div className="px-6 py-5 space-y-4">
              {verification === null && (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                </div>
              )}
              {verification === "none" && (
                <div className="text-center py-12 text-sm text-zinc-400">
                  No verification documents submitted.
                </div>
              )}
              {verification && verification !== "none" && (
                <>
                  <div className="flex items-center gap-3">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                        verification.approved
                          ? "bg-green-50 text-green-700"
                          : verification.reviewed
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700",
                      )}
                    >
                      {verification.approved ? (
                        <>
                          <ShieldCheck className="w-4 h-4" /> Approved
                        </>
                      ) : verification.reviewed ? (
                        <>
                          <ShieldX className="w-4 h-4" /> Rejected
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" /> Pending review
                        </>
                      )}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Submitted{" "}
                      {new Date(verification.submitted_at).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </span>
                  </div>

                  {/* Documents */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "ID Card", url: verification.id_card },
                      { label: "Photo", url: verification.photo },
                      {
                        label: "Business Reg.",
                        url: verification.business_registration,
                      },
                    ].map(
                      ({ label, url }) =>
                        url && (
                          <a
                            key={label}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-zinc-200 hover:border-brand-300 hover:bg-brand-50 transition"
                          >
                            <div className="w-full h-24 bg-zinc-100 rounded-lg overflow-hidden">
                              <img
                                src={url}
                                alt={label}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium text-zinc-600 group-hover:text-brand-700">
                              {label}
                            </span>
                          </a>
                        ),
                    )}
                  </div>

                  {verification.rejection_reason && (
                    <div className="bg-red-50 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-red-600 mb-1">
                        Rejection reason
                      </p>
                      <p className="text-sm text-red-700">
                        {verification.rejection_reason}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {!verification.approved && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => reviewVerification(true)}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 transition"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" /> Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt(
                            "Enter rejection reason (optional):",
                          );
                          reviewVerification(false, reason ?? "");
                        }}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        <ShieldX className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── RATINGS TAB ── */}
          {tab === "ratings" && (
            <div className="px-6 py-5 space-y-3">
              {ratings.length === 0 ? (
                <p className="text-center py-12 text-sm text-zinc-400">
                  No ratings yet.
                </p>
              ) : (
                <>
                  {/* Summary */}
                  <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3 mb-4">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-xl font-bold text-zinc-900 tabular-nums">
                      {agent.rating_avg?.toFixed(1)}
                    </span>
                    <span className="text-sm text-zinc-500">
                      from {agent.rating_count} rating
                      {agent.rating_count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {ratings.map((r) => (
                    <div
                      key={r.id}
                      className="border border-zinc-100 rounded-xl p-4 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-zinc-800">
                          {r.user_email}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={clsx(
                                "w-3 h-3",
                                n <= r.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-zinc-200",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      {r.review && (
                        <p className="text-xs text-zinc-500">{r.review}</p>
                      )}
                      <p className="text-[11px] text-zinc-300">
                        {new Date(r.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── PROPERTIES TAB ── */}
          {tab === "properties" && (
            <div className="px-6 py-5 space-y-3">
              {properties.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    No properties listed by this agent.
                  </p>
                  <a
                    href={`/dashboard/properties/new?owner_id=${agent.user.id}`}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-brand-800 text-white text-sm font-medium hover:bg-brand-700 transition"
                  >
                    Upload property for this agent
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex justify-end mb-2">
                    <a
                      href={`/dashboard/properties/new?owner_id=${agent.user.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-800 text-white text-sm font-medium hover:bg-brand-700 transition"
                    >
                      + Upload property
                    </a>
                  </div>

                  {properties.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 border border-zinc-100 rounded-xl p-3 hover:bg-zinc-50 transition"
                    >
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {p.images && p.images[0]?.image ? (
                          <img
                            src={p.images[0].image}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-zinc-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {p.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {p.city}, {p.state} · {p.currency}{" "}
                          {parseFloat(p.price).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          "shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium",
                          p.status === "published"
                            ? "bg-green-50 text-green-700"
                            : p.status === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-zinc-100 text-zinc-500",
                        )}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── ASSIGN STAFF TAB (super-admin only) ── */}
          {tab === "staff" && isSuperAdmin && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-sm font-medium text-zinc-700 mb-1">
                  Current assignment
                </p>
                {agent.admin ? (
                  <div className="flex items-center gap-3 bg-zinc-50 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                      {agent.admin.email[0].toUpperCase()}
                    </div>
                    <p className="text-sm text-zinc-700">{agent.admin.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-red-400 bg-red-50 rounded-xl px-4 py-3">
                    Unassigned — no staff member is managing this agent.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Assign staff member
                </label>
                {staffList.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading staff…
                  </div>
                ) : (
                  <select
                    value={selectedStaffId}
                    onChange={(e) =>
                      setSelectedStaffId(
                        e.target.value ? parseInt(e.target.value) : "",
                      )
                    }
                    className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white"
                  >
                    <option value="">— Unassigned —</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email}) · Level {s.access_level}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={assignStaff}
                disabled={loading || staffList.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50 transition"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserCog className="w-4 h-4" /> Save assignment
                  </>
                )}
              </button>

              {/* Staff roster info */}
              {staffList.length > 0 && (
                <div className="border border-zinc-100 rounded-xl overflow-hidden">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                    Staff roster
                  </p>
                  {staffList.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-50 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-700">
                        {s.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">
                          {s.email}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-full text-[11px] font-semibold",
                          s.access_level >= 5
                            ? "bg-red-50 text-red-700"
                            : s.access_level >= 3
                              ? "bg-amber-50 text-amber-700"
                              : "bg-zinc-100 text-zinc-600",
                        )}
                      >
                        L{s.access_level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — save button only on profile tab */}
        {tab === "profile" && (
          <div className="px-6 py-4 border-t border-zinc-100 shrink-0">
            <button
              onClick={saveProfile}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save profile
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
