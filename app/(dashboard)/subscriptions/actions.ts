"use server";
// app/(dashboard)/subscriptions/actions.ts
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Plan, Subscription, EnterpriseQuote } from "./types";

// ── Plans ─────────────────────────────────────────────────────────────────────

export async function createPlanAction(payload: {
  name: string;
  tier: string;
  interval: string;
  price: number;
  duration_days: number;
  paystack_plan_code?: string;
  is_active?: boolean;
}) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Plan>(
    "/api/admin/subscriptions/plans/",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/subscriptions");
  return result;
}

export async function updatePlanAction(
  id: number,
  payload: Partial<{
    name: string;
    tier: string;
    interval: string;
    price: number;
    duration_days: number;
    paystack_plan_code: string | null;
    is_active: boolean;
  }>,
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Plan>(
    `/api/admin/subscriptions/plans/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/subscriptions");
  return result;
}

export async function deletePlanAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(
    `/api/admin/subscriptions/plans/${id}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath("/subscriptions");
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export async function activateSubscriptionAction(
  id: number,
  duration_days?: number,
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{
    detail: string;
    status: string;
    expiry_date: string;
    days_remaining: number;
  }>(
    `/api/admin/subscriptions/${id}/activate/`,
    {
      method: "POST",
      body: JSON.stringify(duration_days ? { duration_days } : {}),
    },
    accessToken,
  );
  revalidatePath("/subscriptions");
  return result;
}

export async function cancelSubscriptionAction(id: number) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{ detail: string; status: string }>(
    `/api/admin/subscriptions/${id}/cancel/`,
    { method: "POST" },
    accessToken,
  );
  revalidatePath("/subscriptions");
  return result;
}

// ── Enterprise quotes ─────────────────────────────────────────────────────────

export async function updateQuoteAction(
  id: number,
  payload: {
    status?: string;
    quoted_price?: number;
    duration_days?: number;
    payment_link?: string;
    admin_notes?: string;
  },
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<EnterpriseQuote>(
    `/api/admin/subscriptions/quotes/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/subscriptions");
  return result;
}

export async function activateQuoteAction(id: number, userId: number) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{
    detail: string;
    expiry_date: string;
    days_remaining: number;
  }>(
    `/api/admin/subscriptions/quotes/${id}/activate/`,
    { method: "POST", body: JSON.stringify({ user_id: userId }) },
    accessToken,
  );
  revalidatePath("/subscriptions");
  return result;
}
