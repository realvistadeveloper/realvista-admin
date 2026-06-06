// app/(dashboard)/properties/page.tsx
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import PropertiesWrapper from "./properties-wrapper";
import type { PaginatedProperties, PropertyStats } from "./types";
import type { PaginatedPortfolio, PortfolioStats } from "./portfolio-types";

async function fetchMarket(token: string, params: Record<string, string>) {
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

async function fetchMarketStats(token: string) {
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

async function fetchPortfolio(token: string, params: Record<string, string>) {
  try {
    const qs = new URLSearchParams({ page_size: "20", ...params }).toString();
    return await apiFetch<PaginatedPortfolio>(
      `/api/admin/portfolio/?${qs}`,
      {},
      token,
    );
  } catch {
    return null;
  }
}

async function fetchPortfolioStats(token: string) {
  try {
    return await apiFetch<PortfolioStats>(
      "/api/admin/portfolio/stats/",
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
  const session = await requireAccessLevel(3);
  const params = await searchParams;

  const activeTab = params.tab === "portfolio" ? "portfolio" : "market";

  const marketParams: Record<string, string> = {};
  if (params.search) marketParams.search = params.search;
  if (params.status) marketParams.status = params.status;
  if (params.property_type) marketParams.property_type = params.property_type;
  if (params.listing_purpose)
    marketParams.listing_purpose = params.listing_purpose;
  if (params.page && activeTab === "market") marketParams.page = params.page;

  const portfolioParams: Record<string, string> = {};
  if (params.psearch) portfolioParams.search = params.psearch;
  if (params.pstatus) portfolioParams.status = params.pstatus;
  if (params.ptype) portfolioParams.property_type = params.ptype;
  if (params.page && activeTab === "portfolio")
    portfolioParams.page = params.page;

  const [marketData, marketStats, portfolioData, portfolioStats] =
    await Promise.all([
      fetchMarket(session.accessToken, marketParams),
      fetchMarketStats(session.accessToken),
      fetchPortfolio(session.accessToken, portfolioParams),
      fetchPortfolioStats(session.accessToken),
    ]);

  return (
    <PropertiesWrapper
      initialData={marketData}
      initialStats={marketStats}
      initialParams={params}
      accessToken={session.accessToken}
      initialTab={activeTab}
      portfolioData={portfolioData}
      portfolioStats={portfolioStats}
    />
  );
}
