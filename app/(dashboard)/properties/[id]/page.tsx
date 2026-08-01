// app/(dashboard)/properties/[id]/page.tsx
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch, isAuthError } from "@/lib/api";
import { notFound, redirect } from "next/navigation";
import PropertyDetailClient from "./property-detail-client";
import type { MarketProperty } from "../types";

async function fetchProperty(
  token: string,
  id: string,
): Promise<MarketProperty | null> {
  try {
    return await apiFetch<MarketProperty>(
      `/api/admin/properties/${id}/`,
      {},
      token,
    );
  } catch (err) {
    if (isAuthError(err)) redirect("/login?reason=session_expired");
    return null;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { accessToken } = await requireAccessLevel(3);
  const { id } = await params;
  const property = await fetchProperty(accessToken, id);
  if (!property) notFound();
  return <PropertyDetailClient property={property} accessToken={accessToken} />;
}
