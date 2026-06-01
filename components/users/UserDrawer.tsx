"use client";

// components/users/UserDrawer.tsx

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AppUser } from "@/lib/types";
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  Key,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { clsx } from "clsx";

interface Props {
  user: AppUser;
  accessToken: string;
  onClose: () => void;
  onUpdated: (updated: AppUser) => void;
  onDeleted: () => void;
}

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
      <p className="text-sm text-zinc-800">
        {value ?? <span className="text-zinc-300">—</span>}
      </p>
    </div>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        active ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500",
      )}
    >
      {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function UserDrawer({
  user,
  accessToken,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const patch = async (payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await apiFetch<AppUser>(
        `/admin-api/users/${user.id}/`,
        { method: "PATCH", body: JSON.stringify(payload) },
        accessToken,
      );
      onUpdated(updated);
    } catch (e: any) {
      setError(e.message ?? "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = () => patch({ is_active: !user.is_active });

  const handleVerifyEmail = () => patch({ is_email_verified: true });

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch(
        `/admin-api/users/${user.id}/reset-password/`,
        { method: "POST", body: JSON.stringify({ new_password: newPassword }) },
        accessToken,
      );
      setShowReset(false);
      setNewPassword("");
    } catch (e: any) {
      setError(e.message ?? "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(
        `/admin-api/users/${user.id}/`,
        { method: "DELETE" },
        accessToken,
      );
      onDeleted();
    } catch (e: any) {
      setError(e.message ?? "Delete failed");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-sm font-bold text-brand-700 shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 leading-none">
                {user.name}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">ID #{user.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status pills */}
          <div className="px-6 py-4 flex flex-wrap gap-2 border-b border-zinc-50">
            <StatusPill active={user.is_active} label="Active" />
            <StatusPill
              active={user.is_email_verified}
              label="Email verified"
            />
            <StatusPill
              active={user.is_phone_verified}
              label="Phone verified"
            />
            <StatusPill
              active={user.is_identity_verified}
              label="Identity verified"
            />
            {user.is_agent && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                Agent
              </span>
            )}
            {user.is_staff && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                Staff
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Core info */}
          <div className="px-6 py-5 space-y-4 border-b border-zinc-50">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Account
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full name" value={user.name} />
              <Field label="First name" value={user.first_name} />
              <Field label="Email" value={user.email} />
              <Field label="Provider" value={user.auth_provider} />
              <Field
                label="Joined"
                value={new Date(user.date_joined).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              />
              <Field label="Referral code" value={user.referral_code} />
              <Field label="Referrer" value={user.referrer} />
              <Field label="Referred users" value={user.referred_users_count} />
              <Field
                label="Referral earnings"
                value={`₦${parseFloat(user.total_referral_earnings).toLocaleString()}`}
              />
            </div>
          </div>

          {/* Profile (collapsible) */}
          {user.profile && (
            <div className="border-b border-zinc-50">
              <button
                onClick={() => setShowProfile((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-zinc-50 transition"
              >
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Profile
                </span>
                {showProfile ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>
              {showProfile && (
                <div className="px-6 pb-5 grid grid-cols-2 gap-4">
                  <Field label="Phone" value={user.profile.phone_number} />
                  <Field
                    label="WhatsApp"
                    value={user.profile.whatsapp_number}
                  />
                  <Field
                    label="Country"
                    value={user.profile.country_of_residence}
                  />
                  <Field label="State" value={user.profile.state} />
                  <Field label="City" value={user.profile.city} />
                  <Field label="Street" value={user.profile.street} />
                  <Field label="Postal" value={user.profile.postal_code} />
                  <Field label="DOB" value={user.profile.birth_date} />
                </div>
              )}
            </div>
          )}

          {/* Reset password */}
          <div className="px-6 py-4 border-b border-zinc-50">
            <button
              onClick={() => setShowReset((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition"
            >
              <Key className="w-4 h-4" />
              Reset password
              {showReset ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {showReset && (
              <div className="mt-3 flex gap-2">
                <input
                  type="password"
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1 text-sm rounded-xl border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="px-3 py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Danger zone
            </p>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                <Trash2 className="w-4 h-4" />
                Deactivate account
              </button>
            ) : (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                <p className="text-sm text-red-700 font-medium">
                  Deactivate {user.name}?
                </p>
                <p className="text-xs text-red-500">
                  This will set the account to inactive. The user won't be able
                  to log in.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowDelete(false)}
                    className="flex-1 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-zinc-100 flex gap-2">
          {!user.is_email_verified && (
            <button
              onClick={handleVerifyEmail}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 disabled:opacity-50 transition"
            >
              <Mail className="w-4 h-4" />
              Verify email
            </button>
          )}
          <button
            onClick={handleToggleActive}
            disabled={loading}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition",
              user.is_active
                ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
            )}
          >
            {user.is_active ? (
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
      </aside>
    </>
  );
}
