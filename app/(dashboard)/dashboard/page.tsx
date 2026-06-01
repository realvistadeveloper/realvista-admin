// app/(dashboard)/dashboard/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { UserStats, AgentStats, PropertyStats } from "@/lib/types";
import StatCard from "@/components/ui/StatCard";
import {
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  ShieldAlert,
  Eye,
  Bookmark,
  MessageSquare,
} from "lucide-react";

async function fetchStats(token: string) {
  const [users, agents, properties] = await Promise.allSettled([
    apiFetch<UserStats>("/admin-api/users/stats/", {}, token),
    apiFetch<AgentStats>("/admin-api/agents/stats/", {}, token),
    apiFetch<PropertyStats>("/admin-api/properties/stats/", {}, token),
  ]);

  return {
    users: users.status === "fulfilled" ? users.value : null,
    agents: agents.status === "fulfilled" ? agents.value : null,
    properties: properties.status === "fulfilled" ? properties.value : null,
  };
}

export default async function DashboardPage() {
  const { accessToken } = await requireSession();
  const { users, agents, properties } = await fetchStats(accessToken);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <section>
        <SectionHeading icon={Users} title="Users" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <StatCard label="Total users" value={users?.total} icon={Users} />
          <StatCard
            label="Active"
            value={users?.active}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Inactive"
            value={users?.inactive}
            icon={ShieldAlert}
            color="red"
          />
          <StatCard
            label="Email verified"
            value={users?.email_verified}
            icon={UserCheck}
            color="blue"
          />
        </div>
      </section>

      <section>
        <SectionHeading icon={UserCheck} title="Agents" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Total agents"
            value={agents?.total_agents}
            icon={UserCheck}
          />
          <StatCard
            label="Verified"
            value={agents?.verified}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Pending review"
            value={agents?.pending_verification_review}
            icon={ShieldAlert}
            color="amber"
          />
          <StatCard
            label="Unassigned"
            value={agents?.unassigned_to_staff}
            icon={Users}
            color="red"
          />
        </div>
      </section>

      <section>
        <SectionHeading icon={Building2} title="Properties" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            label="Total listings"
            value={properties?.total}
            icon={Building2}
          />
          <StatCard
            label="Published"
            value={properties?.by_status?.published}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Pending review"
            value={properties?.by_status?.pending}
            icon={ShieldAlert}
            color="amber"
          />
          <StatCard
            label="Rejected"
            value={properties?.by_status?.rejected}
            icon={ShieldAlert}
            color="red"
          />
        </div>

        {properties?.by_property_type && (
          <div className="mt-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-sm font-semibold text-zinc-700 mb-4">
              By property type
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
              {Object.entries(properties.by_property_type)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 capitalize">
                      {type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-zinc-800">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <StatCard
            label="Total views"
            value={properties?.total_views}
            icon={Eye}
            color="blue"
          />
          <StatCard
            label="Total inquiries"
            value={properties?.total_inquiries}
            icon={MessageSquare}
            color="purple"
          />
          <StatCard
            label="Total bookmarks"
            value={properties?.total_bookmarks}
            icon={Bookmark}
            color="amber"
          />
        </div>
      </section>
    </div>
  );
}

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
