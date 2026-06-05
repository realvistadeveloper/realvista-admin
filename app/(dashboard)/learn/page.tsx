// app/(dashboard)/learn/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import LearnTable from "./learn-table";
import type { PaginatedLearn, LearnStats } from "./types";

async function fetchLearn(token: string, params: Record<string, string>) {
  try {
    const qs = new URLSearchParams({ page_size: "20", ...params }).toString();
    return await apiFetch<PaginatedLearn>(`/api/admin/learn/?${qs}`, {}, token);
  } catch {
    return null;
  }
}

async function fetchStats(token: string) {
  try {
    return await apiFetch<LearnStats>("/api/admin/learn/stats/", {}, token);
  } catch {
    return null;
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function LearnPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;

  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;
  if (params.category) queryParams.category = params.category;
  if (params.page) queryParams.page = params.page;

  const [data, stats] = await Promise.all([
    fetchLearn(session.accessToken, queryParams),
    fetchStats(session.accessToken),
  ]);

  return (
    <LearnTable
      initialData={data}
      initialStats={stats}
      initialParams={params}
      accessToken={session.accessToken}
    />
  );
}
