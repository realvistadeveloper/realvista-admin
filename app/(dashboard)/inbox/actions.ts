"use server";

// app/(dashboard)/inbox/actions.ts
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { ContactMessage, Feedback } from "./types";

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function updateContactAction(
  id: number,
  payload: {
    notes?: string;
    assigned_to?: number | null;
  },
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<ContactMessage>(
    `/api/admin/contact/contacts/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/inbox");
  return result;
}

export async function updateContactStatusAction(
  id: number,
  status: string,
  notes?: string,
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<ContactMessage>(
    `/api/admin/contact/contacts/${id}/status/`,
    { method: "PATCH", body: JSON.stringify({ status, notes: notes ?? "" }) },
    accessToken,
  );
  revalidatePath("/inbox");
  return result;
}

export async function deleteContactAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(
    `/api/admin/contact/contacts/${id}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath("/inbox");
}

// ── Feedback ──────────────────────────────────────────────────────────────────

export async function updateFeedbackAction(
  id: number,
  payload: {
    is_approved?: boolean;
    is_featured?: boolean;
  },
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Feedback>(
    `/api/admin/contact/feedback/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/inbox");
  return result;
}

export async function deleteFeedbackAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(
    `/api/admin/contact/feedback/${id}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath("/inbox");
}
