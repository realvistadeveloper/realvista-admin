// app/(dashboard)/trends/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import TrendsTable from "./trends-table";
import type { PaginatedTrends, TrendStats, Category } from "./types";

async function fetchTrends(token: string, params: Record<string, string>) {
  try {
    const qs = new URLSearchParams({ page_size: "20", ...params }).toString();
    return await apiFetch<PaginatedTrends>(
      `/api/admin/trends/?${qs}`,
      {},
      token,
    );
  } catch {
    return null;
  }
}

async function fetchStats(token: string) {
  try {
    return await apiFetch<TrendStats>("/api/admin/trends/stats/", {}, token);
  } catch {
    return null;
  }
}

async function fetchCategories(token: string) {
  try {
    return await apiFetch<Category[]>(
      "/api/admin/trends/categories/",
      {},
      token,
    );
  } catch {
    return [];
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function TrendsPage({ searchParams }: PageProps) {
  const { accessToken } = await requireSession();
  const params = await searchParams;

  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;
  if (params.category) queryParams.category = params.category;
  if (params.publish) queryParams.publish = params.publish;
  if (params.page) queryParams.page = params.page;

  const [data, stats, categories] = await Promise.all([
    fetchTrends(accessToken, queryParams),
    fetchStats(accessToken),
    fetchCategories(accessToken),
  ]);

  return (
    <TrendsTable
      initialData={data}
      initialStats={stats}
      categories={categories ?? []}
      initialParams={params}
      accessToken={accessToken}
    />
  );
}
