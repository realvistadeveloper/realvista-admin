// app/(dashboard)/users/page.tsx
import { requireAccessLevel } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import UsersTable from "./users-table";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlatformUser {
  id: number;
  name: string;
  first_name: string | null;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_agent: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  auth_provider: string;
  date_joined: string;
  user_type: "user" | "agent" | "admin";
  role: string | null;
}

export interface PaginatedUsers {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: PlatformUser[];
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchUsers(
  token: string,
  params: Record<string, string>,
): Promise<PaginatedUsers | null> {
  try {
    const qs = new URLSearchParams(params).toString();
    return await apiFetch<PaginatedUsers>(
      `/api/admin/all-users/${qs ? `?${qs}` : ""}`,
      {},
      token,
    );
  } catch {
    return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { accessToken } = await requireAccessLevel(5);
  const params = await searchParams;

  // Forward all search params to the backend
  const queryParams: Record<string, string> = {};
  if (params.search) queryParams.search = params.search;
  if (params.user_type) queryParams.user_type = params.user_type;
  if (params.is_active) queryParams.is_active = params.is_active;
  if (params.page) queryParams.page = params.page;
  queryParams.page_size = "20";

  const data = await fetchUsers(accessToken, queryParams);

  return (
    <UsersTable
      initialData={data}
      initialParams={params}
      accessToken={accessToken}
    />
  );
}
