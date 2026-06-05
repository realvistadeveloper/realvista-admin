"use client";

// app/(dashboard)/users/create-user-modal.tsx
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "./actions";
import { X, Loader2, UserPlus, BriefcaseBusiness, User } from "lucide-react";
import { clsx } from "clsx";

interface CreateUserModalProps {
  onClose: () => void;
}

export default function CreateUserModal({ onClose }: CreateUserModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isAgent, setIsAgent] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!lastName.trim()) e.name = "Last name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
    if (password && password.length < 8)
      e.password = "Password must be at least 8 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setServerError("");

    startTransition(async () => {
      try {
        const user = (await createUserAction({
          name: lastName.trim(),
          first_name: firstName.trim() || undefined,
          email: email.trim().toLowerCase(),
          is_agent: isAgent,
          password: password || undefined,
        })) as { id: number };

        // Navigate to the new user's detail page
        router.push(`/users/${user.id}`);
        onClose();
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to create user. Please try again.";
        setServerError(msg);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900">Create user</p>
              <p className="text-xs text-zinc-400">New platform account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {serverError && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
              {serverError}
            </div>
          )}

          {/* Account type selector */}
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">
              Account type
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsAgent(false)}
                className={clsx(
                  "flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
                  !isAgent
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                )}
              >
                <User className="w-4 h-4" />
                Regular user
              </button>
              <button
                onClick={() => setIsAgent(true)}
                className={clsx(
                  "flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
                  isAgent
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
                )}
              >
                <BriefcaseBusiness className="w-4 h-4" />
                Agent
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">
              Full name <span className="text-red-400">*</span>
            </label>
            <input
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="Doe"
              className={clsx(
                "w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300",
                errors.name ? "border-red-300 bg-red-50" : "border-zinc-200",
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* First name */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">
              First name
            </label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: "" }));
              }}
              placeholder="john@example.com"
              className={clsx(
                "w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300",
                errors.email ? "border-red-300 bg-red-50" : "border-zinc-200",
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">
              Password
              <span className="ml-1.5 text-zinc-400 font-normal">
                (optional — user can set via reset flow)
              </span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: "" }));
              }}
              placeholder="Min. 8 characters"
              className={clsx(
                "w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-300",
                errors.password
                  ? "border-red-300 bg-red-50"
                  : "border-zinc-200",
              )}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-100">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2 text-sm border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className={clsx(
              "flex-1 px-4 py-2 text-sm rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60",
              isAgent
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-zinc-900 hover:bg-zinc-700 text-white",
            )}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Create {isAgent ? "agent" : "user"}
          </button>
        </div>
      </div>
    </div>
  );
}
