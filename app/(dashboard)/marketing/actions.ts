"use server";
// app/(dashboard)/marketing/actions.ts
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Lead, Newsletter } from "./types";

export async function createLeadAction(payload: {
  full_name: string;
  email: string;
  phone_number: string;
  company_name?: string;
  source?: string;
  notes?: string;
}) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Lead>(
    "/api/admin/marketing/leads/",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/marketing");
  return result;
}

export async function updateLeadAction(
  id: number,
  payload: Record<string, unknown>,
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Lead>(
    `/api/admin/marketing/leads/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/marketing");
  return result;
}

export async function updateLeadStatusAction(
  id: number,
  status: string,
  notes?: string,
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Lead>(
    `/api/admin/marketing/leads/${id}/status/`,
    { method: "PATCH", body: JSON.stringify({ status, notes: notes ?? "" }) },
    accessToken,
  );
  revalidatePath("/marketing");
  return result;
}

export async function deleteLeadAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(
    `/api/admin/marketing/leads/${id}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath("/marketing");
}

export async function createNewsletterAction(payload: {
  subject: string;
  body: string;
  recipient_type: string;
}) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Newsletter>(
    "/api/admin/marketing/newsletters/",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/marketing");
  return result;
}

export async function updateNewsletterAction(
  id: number,
  payload: {
    subject?: string;
    body?: string;
    recipient_type?: string;
  },
) {
  const { accessToken } = await requireSession();
  return await apiFetch<Newsletter>(
    `/api/admin/marketing/newsletters/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
}

export async function sendNewsletterAction(id: number) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{
    sent: number;
    failed: number;
    detail: string;
  }>(
    `/api/admin/marketing/newsletters/${id}/send/`,
    { method: "POST" },
    accessToken,
  );
  revalidatePath("/marketing");
  return result;
}

export async function deleteNewsletterAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(
    `/api/admin/marketing/newsletters/${id}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath("/marketing");
}
