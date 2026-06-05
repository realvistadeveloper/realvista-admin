"use server";

// app/(dashboard)/users/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

// ── Toggle active ─────────────────────────────────────────────────────────────

export async function toggleUserActiveAction(userId: number) {
  const { accessToken } = await requireAccessLevel(5);

  await apiFetch(
    `/api/admin/all-users/${userId}/toggle-active/`,
    { method: "POST" },
    accessToken,
  );

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
}

// ── Toggle agent ──────────────────────────────────────────────────────────────

export async function toggleUserAgentAction(userId: number) {
  const { accessToken } = await requireAccessLevel(5);

  const result = await apiFetch<{ is_agent: boolean; detail: string }>(
    `/api/admin/all-users/${userId}/toggle-agent/`,
    { method: "POST" },
    accessToken,
  );

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");

  return result;
}

// ── Update user ───────────────────────────────────────────────────────────────

export async function updateUserAction(
  userId: number,
  payload: {
    last_name?: string;
    first_name?: string;
    is_active?: boolean;
    is_email_verified?: boolean;
    is_phone_verified?: boolean;
    is_identity_verified?: boolean;
  },
) {
  const { accessToken } = await requireAccessLevel(5);

  const updated = await apiFetch(
    `/api/admin/all-users/${userId}/`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");

  return updated;
}

// ── Create user ───────────────────────────────────────────────────────────────

export async function createUserAction(payload: {
  name: string;
  first_name?: string;
  email: string;
  is_agent?: boolean;
  is_active?: boolean;
  password?: string;
}) {
  const { accessToken } = await requireAccessLevel(5);

  const user = await apiFetch(
    `/api/admin/all-users/`,
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );

  revalidatePath("/users");
  return user;
}

// ── Delete user ───────────────────────────────────────────────────────────────

export async function deleteUserAction(userId: number, soft = true) {
  const { accessToken } = await requireAccessLevel(5);

  await apiFetch(
    `/api/admin/all-users/${userId}/?soft=${soft}`,
    { method: "DELETE" },
    accessToken,
  );

  revalidatePath("/users");
  redirect("/users");
}
