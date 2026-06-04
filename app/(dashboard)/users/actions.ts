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
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    accessToken,
  );

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");

  return updated;
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
