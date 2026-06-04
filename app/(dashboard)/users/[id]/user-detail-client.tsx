"use client";

// app/(dashboard)/users/[id]/user-detail-client.tsx
import { useState, useTransition } from "react";
import Link from "next/link";
import type { UserDetail } from "./page";
import {
  toggleUserActiveAction,
  updateUserAction,
  deleteUserAction,
} from "../actions";
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  Fingerprint,
  UserCircle,
  Calendar,
  BadgeCheck,
  Loader2,
  Pencil,
  Trash2,
  PowerOff,
  Power,
  Check,
  X,
  TriangleAlert,
} from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function UserTypeBadge({ type }: { type: UserDetail["user_type"] }) {
  const map = {
    user: "bg-zinc-100 text-zinc-600",
    agent: "bg-blue-50 text-blue-700",
    admin: "bg-violet-50 text-violet-700",
  };
  return (
    <span
      className={clsx(
        "px-2.5 py-1 rounded-lg text-xs font-semibold capitalize",
        map[type],
      )}
    >
      {type}
    </span>
  );
}

function VerificationRow({
  icon: Icon,
  label,
  verified,
}: {
  icon: React.ElementType;
  label: string;
  verified: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
      <div className="flex items-center gap-2.5 text-sm text-zinc-600">
        <Icon className="w-4 h-4 text-zinc-400" />
        {label}
      </div>
      {verified ? (
        <span className="flex items-center gap-1 text-xs font-medium text-green-700">
          <Check className="w-3.5 h-3.5" /> Verified
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-medium text-zinc-400">
          <X className="w-3.5 h-3.5" /> Not verified
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UserDetailClient({ user }: { user: UserDetail }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Edit form state
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [firstName, setFirstName] = useState(user.first_name ?? "");

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        await toggleUserActiveAction(user.id);
        setFeedback({
          type: "success",
          msg: `User ${user.is_active ? "deactivated" : "activated"}.`,
        });
      } catch {
        setFeedback({ type: "error", msg: "Failed to update status." });
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateUserAction(user.id, {
          last_name: lastName,
          first_name: firstName,
        });
        setIsEditing(false);
        setFeedback({ type: "success", msg: "User updated successfully." });
      } catch {
        setFeedback({ type: "error", msg: "Failed to save changes." });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteUserAction(user.id);
        // redirect happens inside the action
      } catch {
        setFeedback({ type: "error", msg: "Failed to delete user." });
        setShowDelete(false);
      }
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Back ── */}
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      {/* ── Feedback banner ── */}
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
              <UserCircle className="w-8 h-8 text-zinc-400" />
            </div>
            <div>
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="text-lg font-semibold bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300 w-64"
                  />
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="text-sm bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-zinc-300 w-64"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-lg font-semibold text-zinc-900">
                    {user.last_name || "—"}
                  </h1>
                  {user.first_name && (
                    <p className="text-sm text-zinc-400">{user.first_name}</p>
                  )}
                </>
              )}
              <div className="flex items-center gap-2 mt-2">
                <UserTypeBadge type={user.user_type} />
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                    user.is_active
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600",
                  )}
                >
                  <span
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full",
                      user.is_active ? "bg-green-500" : "bg-red-400",
                    )}
                  />
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors"
                  title="Edit user"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleActive}
                  disabled={isPending}
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors disabled:opacity-50"
                  title={user.is_active ? "Deactivate user" : "Activate user"}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : user.is_active ? (
                    <PowerOff className="w-4 h-4" />
                  ) : (
                    <Power className="w-4 h-4 text-green-500" />
                  )}
                </button>
                {!user.is_staff && (
                  <button
                    onClick={() => setShowDelete(true)}
                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Details grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Account info */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Account
          </p>
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <InfoRow
            icon={Calendar}
            label="Joined"
            value={formatDate(user.date_joined)}
          />
          <InfoRow
            icon={BadgeCheck}
            label="Auth provider"
            value={user.auth_provider}
            capitalize
          />
          {user.referral_code && (
            <InfoRow
              icon={Fingerprint}
              label="Referral code"
              value={user.referral_code}
              mono
            />
          )}
          {parseFloat(user.total_referral_earnings) > 0 && (
            <InfoRow
              icon={BadgeCheck}
              label="Referral earnings"
              value={`$${user.total_referral_earnings}`}
            />
          )}
        </div>

        {/* Verification */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Verification
          </p>
          <VerificationRow
            icon={Mail}
            label="Email"
            verified={user.is_email_verified}
          />
          <VerificationRow
            icon={Phone}
            label="Phone"
            verified={user.is_phone_verified}
          />
          <VerificationRow
            icon={ShieldCheck}
            label="Identity"
            verified={user.is_identity_verified}
          />
        </div>

        {/* Profile */}
        {user.profile && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Profile
            </p>
            {user.profile.phone_number && (
              <InfoRow
                icon={Phone}
                label="Phone"
                value={user.profile.phone_number}
              />
            )}
            {user.profile.country_of_residence && (
              <InfoRow
                icon={UserCircle}
                label="Country"
                value={user.profile.country_of_residence}
              />
            )}
            {user.profile.city && (
              <InfoRow
                icon={UserCircle}
                label="City"
                value={user.profile.city}
              />
            )}
            {user.profile.birth_date && (
              <InfoRow
                icon={Calendar}
                label="Birth date"
                value={formatDate(user.profile.birth_date)}
              />
            )}
          </div>
        )}

        {/* Admin profile */}
        {user.admin_profile && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Admin profile
            </p>
            <InfoRow
              icon={ShieldCheck}
              label="Role"
              value={user.admin_profile.role.replace(/_/g, " ")}
              capitalize
            />
            <InfoRow
              icon={BadgeCheck}
              label="Access level"
              value={String(user.admin_profile.access_level)}
            />
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TriangleAlert className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Delete user?</p>
                <p className="text-sm text-zinc-400">
                  This will deactivate the account.
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-600 bg-zinc-50 rounded-xl px-4 py-3">
              <span className="font-medium">{user.email}</span> will be
              soft-deleted and can be restored later if needed.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  capitalize,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  capitalize?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
        <Icon className="w-3.5 h-3.5 text-zinc-300" />
        {label}
      </div>
      <span
        className={clsx(
          "text-sm text-zinc-800 truncate text-right",
          capitalize && "capitalize",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </span>
    </div>
  );
}
