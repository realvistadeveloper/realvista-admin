// app/(dashboard)/subscriptions/page.tsx
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import SubscriptionsClient from "./subscriptions-client";
import type {
  SubscriptionStats,
  Plan,
  PaginatedSubscriptions,
  PaginatedQuotes,
} from "./types";

export default async function SubscriptionsPage() {
  const session = await requireAccessLevel(5);
  const t = session.accessToken;

  const [stats, plans, subs, quotes] = await Promise.all([
    apiFetch<SubscriptionStats>("/api/admin/subscriptions/stats/", {}, t).catch(
      () => null,
    ),
    apiFetch<Plan[]>("/api/admin/subscriptions/plans/", {}, t).catch(() => []),
    apiFetch<PaginatedSubscriptions>(
      "/api/admin/subscriptions/?page_size=20",
      {},
      t,
    ).catch(() => null),
    apiFetch<PaginatedQuotes>(
      "/api/admin/subscriptions/quotes/?page_size=20",
      {},
      t,
    ).catch(() => null),
  ]);

  return (
    <SubscriptionsClient
      initialStats={stats}
      initialPlans={plans as Plan[]}
      initialSubs={subs}
      initialQuotes={quotes}
      accessToken={t}
    />
  );
}
