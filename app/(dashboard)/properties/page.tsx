// app/(dashboard)/properties/page.tsx
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import PropertiesTable from "./properties-table";
import type { PaginatedProperties, PropertyStats } from "./types";

async function fetchProperties(
  token: string,
  params: Record<string, string>,
): Promise<PaginatedProperties | null> {
  try {
    const qs = new URLSearchParams({ page_size: "20", ...params }).toString();
    return await apiFetch<PaginatedProperties>(
      `/api/admin/properties/?${qs}`,
      {},
      token,
    );
  } catch {
    return null;
  }
}

async function fetchStats(token: string): Promise<PropertyStats | null> {
  try {
    return await apiFetch<PropertyStats>(
      "/api/admin/properties/stats/",
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

export default async function PropertiesPage({ searchParams }: PageProps) {
  const { accessToken } = await requireAccessLevel(3);
  const params = await searchParams;

  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;
  if (params.status) queryParams.status = params.status;
  if (params.property_type) queryParams.property_type = params.property_type;
  if (params.listing_purpose)
    queryParams.listing_purpose = params.listing_purpose;
  if (params.page) queryParams.page = params.page;

  const [data, stats] = await Promise.all([
    fetchProperties(accessToken, queryParams),
    fetchStats(accessToken),
  ]);

  return (
    <PropertiesTable
      initialData={data}
      initialStats={stats}
      initialParams={params}
      accessToken={accessToken}
    />
  );
}
