// app/(dashboard)/promotions/[id]/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import PromotionDetailClient from "./promotion-detail-client";
import type { Promotion } from "../types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PromotionDetailPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;
  const promotion = await apiFetch<Promotion>(
    `/api/admin/promotions/${id}/`,
    {},
    session.accessToken,
  ).catch(() => null);

  if (!promotion) notFound();

  return (
    <PromotionDetailClient
      promotion={promotion}
      accessToken={session.accessToken}
    />
  );
}
