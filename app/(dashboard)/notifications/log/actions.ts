"use server";
// app/(dashboard)/notifications/log/actions.ts
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  NotificationTarget,
  UserSearchResult,
  NotificationLogEntry,
} from "./types";

export async function sendNotificationAction(payload: {
  target: NotificationTarget;
  target_user?: number | null;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const { accessToken } = await requireSession();
  const result = await apiFetch<{ sent_count: number }>(
    "/api/admin/notifications/log/send/",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
  revalidatePath("/notifications/log");
  return result;
}

// Backs the "Specific User" search field — the real endpoint for browsing
// regular platform users is /api/admin/all-users/, not /api/admin/users/
// (that one lists admin/staff accounts, a different resource entirely).
export async function searchUsersAction(
  query: string,
): Promise<UserSearchResult[]> {
  if (!query.trim()) return [];
  const { accessToken } = await requireSession();
  try {
    const data = await apiFetch<{ results: UserSearchResult[] }>(
      `/api/admin/all-users/?search=${encodeURIComponent(query)}&page_size=8`,
      {},
      accessToken,
    );
    return data.results;
  } catch {
    return [];
  }
}

export async function fetchNotificationLogAction(): Promise<
  NotificationLogEntry[]
> {
  const { accessToken } = await requireSession();
  try {
    const data = await apiFetch<{ results: NotificationLogEntry[] }>(
      "/api/admin/notifications/log/?page_size=20",
      {},
      accessToken,
    );
    return data.results;
  } catch {
    return [];
  }
}
