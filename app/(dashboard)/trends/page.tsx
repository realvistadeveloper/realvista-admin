// app/(dashboard)/trends/page.tsx
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { apiFetch, isAuthError } from "@/lib/api";
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
  } catch (err) {
    // Send the user to re-auth on a dead session instead of rendering an empty
    // "No articles found." table; log other failures so they're diagnosable.
    if (isAuthError(err)) redirect("/login?reason=session_expired");
    console.error("[trends] list fetch failed:", err);
    return null;
  }
}

async function fetchStats(token: string) {
  try {
    return await apiFetch<TrendStats>("/api/admin/trends/stats/", {}, token);
  } catch (err) {
    if (isAuthError(err)) redirect("/login?reason=session_expired");
    console.error("[trends] stats fetch failed:", err);
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
  } catch (err) {
    if (isAuthError(err)) redirect("/login?reason=session_expired");
    console.error("[trends] categories fetch failed:", err);
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
