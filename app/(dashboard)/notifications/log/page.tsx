// app/(dashboard)/notifications/log/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import NotificationLogPage from "./client";
import type { NotificationLogEntry, PaginatedNotificationLog } from "./types";

export default async function Page() {
  const { accessToken } = await requireSession();

  const initialEntries: NotificationLogEntry[] = await apiFetch<
    PaginatedNotificationLog
  >("/api/admin/notifications/log/?page_size=20", {}, accessToken)
    .then((d) => d.results)
    .catch(() => []);

  return <NotificationLogPage initialEntries={initialEntries} />;
}
