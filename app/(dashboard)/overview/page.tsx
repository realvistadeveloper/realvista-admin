// app/(dashboard)/overview/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import StatCard from "@/components/ui/StatCard";
import {
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  ShieldAlert,
  MailCheck,
  UserX,
  BadgeCheck,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlatformUserStats {
  total_users: number;
  by_type: {
    users: number;
    agents: number;
    admins: number;
  };
  by_status: {
    active: number;
    inactive: number;
  };
  by_verification: {
    verified: number;
    unverified: number;
  };
}

// ── Data fetching ─────────────────────────────────────────────────────────────

// http://127.0.0.1:8001/api/admin/all-users/stats/

async function fetchUserStats(
  token: string,
): Promise<PlatformUserStats | null> {
  try {
    return await apiFetch<PlatformUserStats>(
      "/api/admin/all-users/stats/",
      {},
      token,
    );
  } catch {
    return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { accessToken } = await requireSession();
  const users = await fetchUserStats(accessToken);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Users ── */}
      <section>
        <SectionHeading icon={Users} title="Users" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Total users"
            value={users?.total_users}
            icon={Users}
          />
          <StatCard
            label="Active"
            value={users?.by_status.active}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Inactive"
            value={users?.by_status.inactive}
            icon={UserX}
            color="red"
          />
          <StatCard
            label="Email verified"
            value={users?.by_verification.verified}
            icon={MailCheck}
            color="blue"
          />
        </div>

        {/* User type breakdown */}
        {users?.by_type && (
          <div className="mt-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-sm font-semibold text-zinc-700 mb-4">
              By account type
            </p>
            <div className="grid grid-cols-3 gap-4">
              <TypeBreakdownItem
                label="Regular users"
                value={users.by_type.users}
                total={users.total_users}
              />
              <TypeBreakdownItem
                label="Agents"
                value={users.by_type.agents}
                total={users.total_users}
              />
              <TypeBreakdownItem
                label="Admins"
                value={users.by_type.admins}
                total={users.total_users}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Agents — coming soon ── */}
      <section>
        <SectionHeading icon={UserCheck} title="Agents" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Total agents"
            value={users?.by_type.agents}
            icon={UserCheck}
          />
          <StatCard
            label="Verified"
            value={undefined}
            icon={BadgeCheck}
            color="green"
            placeholder="Coming soon"
          />
          <StatCard
            label="Pending review"
            value={undefined}
            icon={ShieldAlert}
            color="amber"
            placeholder="Coming soon"
          />
          <StatCard
            label="Unassigned"
            value={undefined}
            icon={Users}
            color="red"
            placeholder="Coming soon"
          />
        </div>
      </section>

      {/* ── Properties — coming soon ── */}
      <section>
        <SectionHeading icon={Building2} title="Properties" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Total listings"
            value={undefined}
            icon={Building2}
            placeholder="Coming soon"
          />
          <StatCard
            label="Published"
            value={undefined}
            icon={TrendingUp}
            color="green"
            placeholder="Coming soon"
          />
          <StatCard
            label="Pending review"
            value={undefined}
            icon={ShieldAlert}
            color="amber"
            placeholder="Coming soon"
          />
          <StatCard
            label="Rejected"
            value={undefined}
            icon={ShieldAlert}
            color="red"
            placeholder="Coming soon"
          />
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-zinc-400" />
      <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
        {title}
      </h2>
    </div>
  );
}

function TypeBreakdownItem({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-xs font-semibold text-zinc-800">{value}</span>
      </div>
      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400">{pct}%</span>
    </div>
  );
}
