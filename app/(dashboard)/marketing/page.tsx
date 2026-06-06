// app/(dashboard)/marketing/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import MarketingClient from "./marketing-client";
import type {
  PaginatedLeads,
  PaginatedNewsletters,
  MarketingStats,
} from "./types";

export default async function MarketingPage() {
  const session = await requireSession();
  const t = session.accessToken;

  const [leads, newsletters, stats] = await Promise.all([
    apiFetch<PaginatedLeads>(
      "/api/admin/marketing/leads/?page_size=50",
      {},
      t,
    ).catch(() => null),
    apiFetch<PaginatedNewsletters>(
      "/api/admin/marketing/newsletters/?page_size=20",
      {},
      t,
    ).catch(() => null),
    apiFetch<MarketingStats>("/api/admin/marketing/stats/", {}, t).catch(
      () => null,
    ),
  ]);

  return (
    <MarketingClient
      initialLeads={leads}
      initialNewsletters={newsletters}
      initialStats={stats}
    />
  );
}
