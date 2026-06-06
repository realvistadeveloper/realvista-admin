"use server";

// app/(dashboard)/referrals/actions.ts
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { ReferralEarning } from "./types";

export async function markEarningPaidAction(earningId: number, notes?: string) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<ReferralEarning>(
    `/api/admin/referrals/earnings/${earningId}/mark-paid/`,
    { method: "PATCH", body: JSON.stringify({ notes: notes ?? "" }) },
    accessToken,
  );
  revalidatePath("/referrals");
  return result;
}

export async function cancelEarningAction(earningId: number, notes?: string) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<ReferralEarning>(
    `/api/admin/referrals/earnings/${earningId}/cancel/`,
    { method: "PATCH", body: JSON.stringify({ notes: notes ?? "" }) },
    accessToken,
  );
  revalidatePath("/referrals");
  return result;
}
