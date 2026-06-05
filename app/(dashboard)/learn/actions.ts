"use server";

// app/(dashboard)/learn/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { LearnResource } from "./types";

export async function createLearnAction(payload: {
  title: string;
  description: string;
  category: string;
  youtube_url: string;
  duration?: string;
}) {
  const { accessToken } = await requireSession();
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined && v !== "") clean[k] = v;
  }
  const result = await apiFetch<LearnResource>(
    "/api/admin/learn/",
    { method: "POST", body: JSON.stringify(clean) },
    accessToken,
  );
  revalidatePath("/learn");
  return result;
}

export async function updateLearnAction(
  id: number,
  payload: {
    title?: string;
    description?: string;
    category?: string;
    youtube_url?: string;
    duration?: string | null;
  },
) {
  const { accessToken } = await requireSession();
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) clean[k] = v;
  }
  const result = await apiFetch<LearnResource>(
    `/api/admin/learn/${id}/`,
    { method: "PATCH", body: JSON.stringify(clean) },
    accessToken,
  );
  revalidatePath(`/learn/${id}`);
  revalidatePath("/learn");
  return result;
}

export async function deleteLearnAction(id: number) {
  const { accessToken } = await requireSession();
  await apiFetch(`/api/admin/learn/${id}/`, { method: "DELETE" }, accessToken);
  revalidatePath("/learn");
  redirect("/learn");
}
