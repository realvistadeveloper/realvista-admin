// app/(dashboard)/inbox/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import InboxClient from "./inbox-client";
import type { PaginatedContacts, PaginatedFeedback, InboxStats } from "./types";

export default async function InboxPage() {
  const session = await requireSession();

  const [contacts, feedback, stats] = await Promise.all([
    apiFetch<PaginatedContacts>(
      "/api/admin/contacts/?page_size=20",
      {},
      session.accessToken,
    ).catch(() => null),
    apiFetch<PaginatedFeedback>(
      "/api/admin/feedback/?page_size=20",
      {},
      session.accessToken,
    ).catch(() => null),
    apiFetch<InboxStats>("/api/admin/stats/", {}, session.accessToken).catch(
      () => null,
    ),
  ]);

  return (
    <InboxClient
      initialContacts={contacts}
      initialFeedback={feedback}
      initialStats={stats}
      accessToken={session.accessToken}
    />
  );
}
