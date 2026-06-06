"use server";
// app/(dashboard)/notifications/actions.ts
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { PushNotification, EmailSetting } from "./types";

export async function sendPushNotificationAction(payload: {
  title: string;
  body: string;
  target: string;
  target_user?: number | null;
  topic?: string;
  data?: Record<string, unknown>;
}) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<PushNotification>(
    "/api/admin/notifications/push/",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/notifications");
  return result;
}

export async function toggleEmailOptAction(id: number, value: boolean) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<EmailSetting>(
    `/api/admin/notifications/email-settings/${id}/`,
    {
      method: "PATCH",
      body: JSON.stringify({ receive_email_notifications: value }),
    },
    accessToken,
  );
  revalidatePath("/notifications");
  return result;
}
