"use client";

// app/(dashboard)/users/[id]/user-detail-client.tsx
import { useState, useTransition } from "react";
import Link from "next/link";
import type { UserDetail } from "./page";
import {
  toggleUserActiveAction,
  toggleUserAgentAction,
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
  BriefcaseBusiness,
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

// ── VerificationRow ───────────────────────────────────────────────────────────

function VerificationRow({
  icon: Icon,
  label,
  verified,
  editable,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  verified: boolean;
  editable?: boolean;
  onToggle?: (value: boolean) => void;
}) {
  const [localVerified, setLocalVerified] = useState(verified);
  const [saving, startSave] = useTransition();

  const handleToggle = () => {
    if (!onToggle) return;
    const next = !localVerified;
    setLocalVerified(next);
    startSave(async () => {
      try {
        await onToggle(next);
      } catch {
        setLocalVerified(localVerified); // revert on error
      }
    });
  };

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-zinc-50 last:border-0">
      <div className="flex items-center gap-2.5 text-sm text-zinc-600">
        <Icon className="w-4 h-4 text-zinc-400" />
        {label}
      </div>
      {editable ? (
        <button
          onClick={handleToggle}
          disabled={saving}
          className={clsx(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50",
            localVerified ? "bg-green-500" : "bg-zinc-200",
          )}
        >
          <span
            className={clsx(
              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              localVerified ? "translate-x-4" : "translate-x-1",
            )}
          />
        </button>
      ) : localVerified ? (
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

// ── EditField ─────────────────────────────────────────────────────────────────

function EditField({
  icon: Icon,
  label,
  value,
  onChange,
  inputType = "text",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputType?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-zinc-500 shrink-0">
        <Icon className="w-3.5 h-3.5 text-zinc-300" />
        {label}
      </div>
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm text-right bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-zinc-300 min-w-0"
      />
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

// ── Main component ────────────────────────────────────────────────────────────

export default function UserDetailClient({ user }: { user: UserDetail }) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAgentConfirm, setShowAgentConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Optimistic local state
  const [isAgent, setIsAgent] = useState(user.is_agent);
  const [isActive, setIsActive] = useState(user.is_active);

  // Edit form state — all editable fields
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [emailVal, setEmailVal] = useState(user.email ?? "");
  const [phoneVal, setPhoneVal] = useState(user.profile?.phone_number ?? "");

  // ── Derived ──────────────────────────────────────────────────────────────

  const userType: UserDetail["user_type"] = user.is_staff
    ? "admin"
    : isAgent
      ? "agent"
      : "user";

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        await toggleUserActiveAction(user.id);
        setIsActive((prev) => !prev);
        setFeedback({
          type: "success",
          msg: `User ${isActive ? "deactivated" : "activated"}.`,
        });
      } catch {
        setFeedback({ type: "error", msg: "Failed to update status." });
      }
    });
  };

  const handleToggleAgent = () => {
    startTransition(async () => {
      try {
        const result = await toggleUserAgentAction(user.id);
        setIsAgent(result.is_agent);
        setShowAgentConfirm(false);
        setFeedback({ type: "success", msg: result.detail });
      } catch {
        setFeedback({ type: "error", msg: "Failed to update agent status." });
        setShowAgentConfirm(false);
      }
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const payload = {
          last_name: lastName,
          first_name: firstName,
          email: emailVal,
          phone_number: phoneVal || null,
        } as unknown as Parameters<typeof updateUserAction>[1];

        await updateUserAction(user.id, payload);
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
      } catch {
        setFeedback({ type: "error", msg: "Failed to delete user." });
        setShowDelete(false);
      }
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to users
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
                <UserTypeBadge type={userType} />
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                    isActive
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600",
                  )}
                >
                  <span
                    className={clsx(
                      "w-1.5 h-1.5 rounded-full",
                      isActive ? "bg-green-500" : "bg-red-400",
                    )}
                  />
                  {isActive ? "Active" : "Inactive"}
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

                {/* Toggle agent */}
                {!user.is_staff && (
                  <button
                    onClick={() => setShowAgentConfirm(true)}
                    disabled={isPending}
                    className={clsx(
                      "p-2 rounded-xl transition-colors disabled:opacity-50",
                      isAgent
                        ? "text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        : "text-zinc-400 hover:text-blue-500 hover:bg-blue-50",
                    )}
                    title={isAgent ? "Remove agent status" : "Make agent"}
                  >
                    <BriefcaseBusiness className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleToggleActive}
                  disabled={isPending}
                  className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 rounded-xl transition-colors disabled:opacity-50"
                  title={isActive ? "Deactivate" : "Activate"}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isActive ? (
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
        {/* Account */}
        <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Account
          </p>
          {isEditing ? (
            <EditField
              icon={Mail}
              label="Email"
              value={emailVal}
              onChange={setEmailVal}
              inputType="email"
            />
          ) : (
            <InfoRow icon={Mail} label="Email" value={user.email} />
          )}
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
            editable={isEditing}
            onToggle={(v) =>
              updateUserAction(user.id, { is_email_verified: v })
            }
          />
          <VerificationRow
            icon={Phone}
            label="Phone"
            verified={user.is_phone_verified}
            editable={isEditing}
            onToggle={(v) =>
              updateUserAction(user.id, { is_phone_verified: v })
            }
          />
          <VerificationRow
            icon={ShieldCheck}
            label="Identity"
            verified={user.is_identity_verified}
            editable={isEditing}
            onToggle={(v) =>
              updateUserAction(user.id, { is_identity_verified: v })
            }
          />
        </div>

        {/* Profile */}
        {user.profile && (
          <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Profile
            </p>
            {isEditing ? (
              <EditField
                icon={Phone}
                label="Phone"
                value={phoneVal}
                onChange={setPhoneVal}
                inputType="tel"
              />
            ) : (
              user.profile.phone_number && (
                <InfoRow
                  icon={Phone}
                  label="Phone"
                  value={user.profile.phone_number}
                />
              )
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

      {/* ── Agent confirm modal ── */}
      {showAgentConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-zinc-100 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BriefcaseBusiness className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-zinc-900">
                  {isAgent
                    ? "Remove agent status?"
                    : "Make this user an agent?"}
                </p>
                <p className="text-sm text-zinc-400">
                  {isAgent
                    ? "The agent profile will be preserved but deactivated."
                    : "An agent profile will be created automatically."}
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-600 bg-zinc-50 rounded-xl px-4 py-3 font-medium">
              {user.email}
            </p>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowAgentConfirm(false)}
                className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleAgent}
                disabled={isPending}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isAgent ? "Remove" : "Make agent"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
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
            <p className="text-sm text-zinc-600 bg-zinc-50 rounded-xl px-4 py-3 font-medium">
              {user.email}
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
