// app/(dashboard)/referrals/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import ReferralsClient from "./referrals-client";
import type { PaginatedReferrals, ReferralStats } from "./types";

async function fetchReferrals(token: string, params: Record<string, string>) {
  try {
    const qs = new URLSearchParams({ page_size: "20", ...params }).toString();
    return await apiFetch<PaginatedReferrals>(
      `/api/admin/referrals/?${qs}`,
      {},
      token,
    );
  } catch {
    return null;
  }
}

async function fetchStats(token: string) {
  try {
    return await apiFetch<ReferralStats>(
      "/api/admin/referrals/stats/",
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

export default async function ReferralsPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const params = await searchParams;

  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;
  if (params.has_suspicious) queryParams.has_suspicious = params.has_suspicious;
  if (params.page) queryParams.page = params.page;

  const [data, stats] = await Promise.all([
    fetchReferrals(session.accessToken, queryParams),
    fetchStats(session.accessToken),
  ]);

  return (
    <ReferralsClient
      initialData={data}
      initialStats={stats}
      initialParams={params}
      accessToken={session.accessToken}
    />
  );
}
