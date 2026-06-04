// app/(dashboard)/users/[id]/page.tsx
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { notFound } from "next/navigation";
import UserDetailClient from "./user-detail-client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserDetail {
  id: number;
  last_name: string;
  first_name: string | null;
  email: string;
  auth_provider: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_identity_verified: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_agent: boolean;
  date_joined: string;
  referral_code: string | null;
  total_referral_earnings: string;
  user_type: "user" | "agent" | "admin";
  role: string | null;
  admin_profile: {
    id: number;
    role: string;
    access_level: number;
    permissions: Record<string, unknown>;
  } | null;
  profile: {
    phone_number: string | null;
    whatsapp_number: string | null;
    country_of_residence: string | null;
    state: string | null;
    city: string | null;
    birth_date: string | null;
  } | null;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchUser(
  token: string,
  id: string,
): Promise<UserDetail | null> {
  try {
    return await apiFetch<UserDetail>(`/api/admin/all-users/${id}/`, {}, token);
  } catch {
    return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { accessToken } = await requireAccessLevel(5);
  const { id } = await params;

  const user = await fetchUser(accessToken, id);
  if (!user) notFound();

  return <UserDetailClient user={user} />;
}
