"use server";

// app/(dashboard)/promotions/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Promotion, StopCondition } from "./types";

// ── Promotions ────────────────────────────────────────────────────────────────

export async function createPromotionAction(payload: {
  name: string;
  promotion_type: string;
  currency: string;
  reward_amount: string;
  is_active?: boolean;
}) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Promotion>(
    "/api/admin/promotions/",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/promotions");
  return result;
}

export async function updatePromotionAction(
  id: number,
  payload: {
    name?: string;
    promotion_type?: string;
    currency?: string;
    reward_amount?: string;
    is_active?: boolean;
  },
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Promotion>(
    `/api/admin/promotions/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/promotions/${id}`);
  revalidatePath("/promotions");
  return result;
}

export async function togglePromotionActiveAction(id: number) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{
    is_active: boolean;
    is_active_now: boolean;
    detail: string;
  }>(
    `/api/admin/promotions/${id}/toggle-active/`,
    { method: "POST" },
    accessToken,
  );
  revalidatePath(`/promotions/${id}`);
  revalidatePath("/promotions");
  return result;
}

export async function deletePromotionAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(
    `/api/admin/promotions/${id}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath("/promotions");
  redirect("/promotions");
}

// ── Stop conditions ───────────────────────────────────────────────────────────

export async function addConditionAction(
  promotionId: number,
  payload: {
    type: string;
    end_date?: string;
    total_budget?: string;
  },
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<StopCondition>(
    `/api/admin/promotions/${promotionId}/conditions/`,
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/promotions/${promotionId}`);
  return result;
}

export async function updateConditionAction(
  promotionId: number,
  conditionId: number,
  payload: {
    end_date?: string | null;
    total_budget?: string | null;
  },
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<StopCondition>(
    `/api/admin/promotions/${promotionId}/conditions/${conditionId}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/promotions/${promotionId}`);
  return result;
}

export async function deleteConditionAction(
  promotionId: number,
  conditionId: number,
) {
  const { accessToken } = await requireSession();
  await apiFetch(
    `/api/admin/promotions/${promotionId}/conditions/${conditionId}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath(`/promotions/${promotionId}`);
}
