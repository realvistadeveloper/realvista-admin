"use server";
// app/(dashboard)/payments/actions.ts
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export async function refundPaymentAction(id: number, notes?: string) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{
    detail: string;
    status: string;
    reference: string;
  }>(
    `/api/admin/payments/${id}/refund/`,
    { method: "POST", body: JSON.stringify({ notes: notes ?? "" }) },
    accessToken,
  );
  revalidatePath("/payments");
  return result;
}
