// app/(dashboard)/learn/[id]/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import LearnDetailClient from "./learn-detail-client";
import type { LearnResource } from "../types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LearnDetailPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;

  const resource = await apiFetch<LearnResource>(
    `/api/admin/learn/${id}/`,
    {},
    session.accessToken,
  ).catch(() => null);

  if (!resource) notFound();

  return <LearnDetailClient resource={resource} />;
}
