// app/(dashboard)/notifications/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import NotificationsPage from "./client";
import type {
  NotificationStats,
  PushNotification,
  EmailSetting,
} from "./types";

export default async function Page() {
  const session = await requireSession();
  const t = session.accessToken;

  const [stats, pushHistory, emailSettings] = await Promise.all([
    apiFetch<NotificationStats>("/api/admin/notifications/stats/", {}, t).catch(
      () => null,
    ),
    apiFetch<{ results: PushNotification[] }>(
      "/api/admin/notifications/push/?page_size=20",
      {},
      t,
    )
      .then((d) => d.results)
      .catch(() => []),
    apiFetch<{ results: EmailSetting[] }>(
      "/api/admin/notifications/email-settings/?page_size=50",
      {},
      t,
    )
      .then((d) => d.results)
      .catch(() => []),
  ]);

  return (
    <NotificationsPage
      stats={stats}
      pushHistory={pushHistory}
      emailSettings={emailSettings}
    />
  );
}
