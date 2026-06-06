"use client";

// app/(dashboard)/properties/properties-wrapper.tsx
// Owns the tab state and renders either the market table or portfolio table.
// PropertiesTable and PortfolioTable are untouched.

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import PropertiesTable from "./properties-table";
import PortfolioTable from "./portfolio-table";
import type { PaginatedProperties, PropertyStats } from "./types";
import type { PaginatedPortfolio, PortfolioStats } from "./portfolio-types";

interface Props {
  initialData: PaginatedProperties | null;
  initialStats: PropertyStats | null;
  initialParams: Record<string, string>;
  accessToken: string;
  initialTab: "market" | "portfolio";
  portfolioData: PaginatedPortfolio | null;
  portfolioStats: PortfolioStats | null;
}

export default function PropertiesWrapper({
  initialData,
  initialStats,
  initialParams,
  accessToken,
  initialTab,
  portfolioData,
  portfolioStats,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeTab, setActiveTab] = useState<"market" | "portfolio">(
    initialTab,
  );

  const switchTab = (tab: "market" | "portfolio") => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const marketCount = initialData?.count ?? 0;
  const portfolioCount = portfolioData?.count ?? 0;

  return (
    <div className="space-y-5">
      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-1 bg-white rounded-2xl border border-zinc-100 p-1.5">
        <button
          onClick={() => switchTab("market")}
          className={[
            "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-1",
            activeTab === "market"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50",
          ].join(" ")}
        >
          Market listings
          <span
            className={[
              "text-xs px-1.5 py-0.5 rounded-md tabular-nums",
              activeTab === "market"
                ? "bg-white/20 text-white"
                : "bg-zinc-100 text-zinc-500",
            ].join(" ")}
          >
            {marketCount.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => switchTab("portfolio")}
          className={[
            "flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-1",
            activeTab === "portfolio"
              ? "bg-zinc-900 text-white"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50",
          ].join(" ")}
        >
          Portfolio properties
          <span
            className={[
              "text-xs px-1.5 py-0.5 rounded-md tabular-nums",
              activeTab === "portfolio"
                ? "bg-white/20 text-white"
                : "bg-zinc-100 text-zinc-500",
            ].join(" ")}
          >
            {portfolioCount.toLocaleString()}
          </span>
        </button>
      </div>

      {/* ── Tab panels ── */}
      {activeTab === "market" && (
        <PropertiesTable
          initialData={initialData}
          initialStats={initialStats}
          initialParams={initialParams}
          accessToken={accessToken}
        />
      )}

      {activeTab === "portfolio" && (
        <PortfolioTable
          initialData={portfolioData}
          initialStats={portfolioStats}
          accessToken={accessToken}
        />
      )}
    </div>
  );
}
