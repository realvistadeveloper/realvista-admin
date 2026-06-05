"use server";

// app/(dashboard)/agents/actions.ts
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Agent } from "./types";

// ── Update profile ────────────────────────────────────────────────────────────

export async function updateAgentAction(
  agentId: number,
  payload: {
    agency_name?: string | null;
    agency_address?: string | null;
    phone_number?: string | null;
    whatsapp_number?: string | null;
    experience_years?: number;
    preferred_contact_mode?: string;
    bio?: string | null;
  },
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Agent>(
    `/api/admin/agents/${agentId}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/agents/${agentId}`);
  return result;
}

// ── Toggle verified ───────────────────────────────────────────────────────────

export async function toggleAgentVerifiedAction(agentId: number) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{ verified: boolean; detail: string }>(
    `/api/admin/agents/${agentId}/toggle-verified/`,
    { method: "POST" },
    accessToken,
  );
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/agents");
  return result;
}

// ── Toggle featured ───────────────────────────────────────────────────────────

export async function toggleAgentFeaturedAction(agentId: number) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{ featured: boolean; detail: string }>(
    `/api/admin/agents/${agentId}/toggle-featured/`,
    { method: "POST" },
    accessToken,
  );
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/agents");
  return result;
}

// ── Review verification ───────────────────────────────────────────────────────

export async function reviewVerificationAction(
  agentId: number,
  approved: boolean,
  rejection_reason?: string,
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{ approved: boolean; detail: string }>(
    `/api/admin/agents/${agentId}/verification/`,
    { method: "PATCH", body: JSON.stringify({ approved, rejection_reason }) },
    accessToken,
  );
  revalidatePath(`/agents/${agentId}`);
  return result;
}

// ── Assign admin ──────────────────────────────────────────────────────────────

export async function assignAdminAction(
  agentId: number,
  adminId: number | null,
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch(
    `/api/admin/agents/${agentId}/assign/`,
    { method: "PATCH", body: JSON.stringify({ admin_id: adminId }) },
    accessToken,
  );
  revalidatePath(`/agents/${agentId}`);
  revalidatePath("/agents");
  return result;
}
