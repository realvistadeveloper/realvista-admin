// app/(dashboard)/properties/new/page.tsx
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import NewPropertyClient from "./new-property-client";

interface PageProps {
  searchParams: Promise<{ owner_id?: string }>;
}

// Fetch basic user info to pre-fill owner when coming from an agent page
async function fetchOwner(token: string, ownerId: string) {
  try {
    return await apiFetch<{
      id: number;
      name: string;
      email: string;
      is_agent: boolean;
    }>(`/api/admin/all-users/${ownerId}/`, {}, token);
  } catch {
    return null;
  }
}

export default async function NewPropertyPage({ searchParams }: PageProps) {
  const { accessToken } = await requireAccessLevel(3);
  const { owner_id } = await searchParams;

  const preselectedOwner = owner_id
    ? await fetchOwner(accessToken, owner_id)
    : null;

  return (
    <NewPropertyClient
      preselectedOwner={preselectedOwner}
      accessToken={accessToken}
    />
  );
}
