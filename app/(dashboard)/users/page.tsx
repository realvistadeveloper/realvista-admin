// app/(dashboard)/dashboard/users/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse, AppUser, UserStats } from "@/lib/types";
import UsersTable from "@/components/users/UsersTable";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { accessToken } = await requireSession();

  const [usersRes, statsRes] = await Promise.allSettled([
    apiFetch<PaginatedResponse<AppUser>>(
      "/admin-api/users/?page=1&page_size=20",
      {},
      accessToken,
    ),
    apiFetch<UserStats>("/admin-api/users/stats/", {}, accessToken),
  ]);

  const initialUsers = usersRes.status === "fulfilled" ? usersRes.value : null;
  const stats = statsRes.status === "fulfilled" ? statsRes.value : null;

  return (
    <UsersTable
      initialUsers={initialUsers}
      stats={stats}
      accessToken={accessToken}
    />
  );
}
