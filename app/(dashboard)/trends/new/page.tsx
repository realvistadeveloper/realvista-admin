// app/(dashboard)/trends/new/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import TrendEditor from "../trend-editor";
import type { Category } from "../types";

export default async function NewTrendPage() {
  const { accessToken } = await requireSession();

  const categories = await apiFetch<Category[]>(
    "/api/admin/trends/categories/",
    {},
    accessToken,
  ).catch(() => []);

  return (
    <TrendEditor
      mode="create"
      categories={categories}
      accessToken={accessToken}
    />
  );
}
