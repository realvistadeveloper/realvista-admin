// app/(dashboard)/layout.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken } = await requireSession();

  // Only agents have an Agent PK — non-agent staff get null and the
  // "My Page" link in TopBar stays hidden.
  const me = await apiFetch<{ agent_id: number | null }>(
    "/api/users/me/",
    {},
    accessToken,
  ).catch(() => null);

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar user={user} agentId={me?.agent_id ?? null} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
