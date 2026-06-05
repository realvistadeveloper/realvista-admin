"use server";

// app/(dashboard)/trends/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { Trend, Category } from "./types";

// ── Trends ────────────────────────────────────────────────────────────────────

export async function createTrendAction(payload: {
  title: string;
  body: string;
  source: string;
  url?: string;
  category: number;
  publish?: boolean;
}) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Trend>(
    "/api/admin/trends/",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/trends");
  return result;
}

export async function updateTrendAction(
  id: number,
  payload: {
    title?: string;
    body?: string;
    source?: string;
    url?: string;
    category?: number;
  },
) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Trend>(
    `/api/admin/trends/${id}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath(`/trends/${id}`);
  revalidatePath("/trends");
  return result;
}

export async function togglePublishAction(id: number, publish: boolean) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{ publish: boolean; detail: string }>(
    `/api/admin/trends/${id}/publish/`,
    { method: "PATCH", body: JSON.stringify({ publish }) },
    accessToken,
  );
  revalidatePath(`/trends/${id}`);
  revalidatePath("/trends");
  return result;
}

export async function deleteTrendAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(`/api/admin/trends/${id}/`, { method: "DELETE" }, accessToken);
  revalidatePath("/trends");
  redirect("/trends");
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function createCategoryAction(name: string) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<Category>(
    "/api/admin/trends/categories/",
    { method: "POST", body: JSON.stringify({ name }) },
    accessToken,
  );
  revalidatePath("/trends");
  return result;
}

export async function updateCategoryAction(id: number, name: string) {
  const { accessToken } = await requireSession();
  return await apiFetch<Category>(
    `/api/admin/trends/categories/${id}/`,
    { method: "PATCH", body: JSON.stringify({ name }) },
    accessToken,
  );
}

export async function deleteCategoryAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(
    `/api/admin/trends/categories/${id}/`,
    { method: "DELETE" },
    accessToken,
  );
  revalidatePath("/trends");
}
