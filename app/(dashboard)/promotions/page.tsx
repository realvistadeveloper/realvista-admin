// app/(dashboard)/promotions/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import PromotionsTable from "./promotions-table";
import type { PaginatedPromotions, PromotionStats } from "./types";

async function fetchPromotions(token: string, params: Record<string, string>) {
  try {
    const qs = new URLSearchParams({ page_size: "20", ...params }).toString();
    return await apiFetch<PaginatedPromotions>(
      `/api/admin/promotions/?${qs}`,
      {},
      token,
    );
  } catch {
    return null;
  }
}

async function fetchStats(token: string) {
  try {
    return await apiFetch<PromotionStats>(
      "/api/admin/promotions/stats/",
      {},
      token,
    );
  } catch {
    return null;
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function PromotionsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;

  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;
  if (params.promotion_type) queryParams.promotion_type = params.promotion_type;
  if (params.is_active) queryParams.is_active = params.is_active;
  if (params.page) queryParams.page = params.page;

  const [data, stats] = await Promise.all([
    fetchPromotions(session.accessToken, queryParams),
    fetchStats(session.accessToken),
  ]);

  return (
    <PromotionsTable
      initialData={data}
      initialStats={stats}
      initialParams={params}
      accessToken={session.accessToken}
    />
  );
}
