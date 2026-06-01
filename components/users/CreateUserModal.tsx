"use client";

// components/users/CreateUserModal.tsx

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AppUser } from "@/lib/types";
import { X, Loader2, Eye, EyeOff } from "lucide-react";

interface Props {
  accessToken: string;
  onClose: () => void;
  onCreated: (user: AppUser) => void;
}

export default function CreateUserModal({
  accessToken,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    first_name: "",
    email: "",
    password: "",
    phone_number: "",
    is_staff: false,
    is_agent: false,
    send_welcome_email: true,
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await apiFetch<AppUser>(
        "/admin-api/users/",
        { method: "POST", body: JSON.stringify(form) },
        accessToken,
      );
      onCreated(user);
    } catch (e: any) {
      setError(e.message ?? "Failed to create user");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">
            Create new user
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                Full name *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1.5">
                First name
              </label>
              <input
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="John"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Email address *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <input
                required
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">
              Phone number
            </label>
            <input
              type="tel"
              value={form.phone_number}
              onChange={(e) => set("phone_number", e.target.value)}
              className="w-full text-sm rounded-xl border border-zinc-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600"
              placeholder="+234 …"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-1">
            {[
              {
                key: "is_staff",
                label: "Staff member",
                desc: "Can access the admin panel",
              },
              {
                key: "is_agent",
                label: "Agent",
                desc: "Creates an agent profile",
              },
              {
                key: "send_welcome_email",
                label: "Send welcome email",
                desc: "Notifies user of their account",
              },
            ].map(({ key, label, desc }) => (
              <label
                key={key}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={(e) => set(key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full bg-zinc-200 peer-checked:bg-brand-600 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-800">{label}</p>
                  <p className="text-xs text-zinc-400">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-800 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating…
              </>
            ) : (
              "Create user"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
