// app/(dashboard)/trends/[id]/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import TrendEditor from "../trend-editor";
import type { Trend, Category } from "../types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTrendPage({ params }: PageProps) {
  const { accessToken } = await requireSession();
  const { id } = await params;

  const [trend, categories] = await Promise.all([
    apiFetch<Trend>(`/api/admin/trends/${id}/`, {}, accessToken).catch(
      () => null,
    ),
    apiFetch<Category[]>(
      "/api/admin/trends/categories/",
      {},
      accessToken,
    ).catch(() => []),
  ]);

  if (!trend) notFound();

  return (
    <TrendEditor
      mode="edit"
      trend={trend}
      categories={categories}
      accessToken={accessToken}
    />
  );
}
