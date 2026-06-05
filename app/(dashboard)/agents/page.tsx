// app/(dashboard)/agents/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import AgentsTable from "./agents-table";
import type { PaginatedAgents, AgentStats } from "./types";

async function fetchAgents(token: string, params: Record<string, string>) {
  try {
    const qs = new URLSearchParams({ page_size: "20", ...params }).toString();
    return await apiFetch<PaginatedAgents>(
      `/api/admin/agents/?${qs}`,
      {},
      token,
    );
  } catch {
    return null;
  }
}

async function fetchStats(token: string) {
  try {
    return await apiFetch<AgentStats>("/api/admin/agents/stats/", {}, token);
  } catch {
    return null;
  }
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function AgentsPage({ searchParams }: PageProps) {
  const { accessToken } = await requireSession();
  const params = await searchParams;

  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;
  if (params.verified) queryParams.verified = params.verified;
  if (params.has_verification)
    queryParams.has_verification = params.has_verification;
  if (params.page) queryParams.page = params.page;

  const [data, stats] = await Promise.all([
    fetchAgents(accessToken, queryParams),
    fetchStats(accessToken),
  ]);

  return (
    <AgentsTable
      initialData={data}
      initialStats={stats}
      initialParams={params}
      accessToken={accessToken}
    />
  );
}
