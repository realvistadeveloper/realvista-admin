// app/(dashboard)/overview/page.tsx
import { requireSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  Users,
  UserCheck,
  Building2,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  MailCheck,
  UserX,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  CreditCard,
  Wallet,
  MessageSquare,
  GitBranch,
  Tag,
  Eye,
  Inbox,
} from "lucide-react";

// ── API response shapes ───────────────────────────────────────────────────────
// Prefixed with "Api" to avoid any clash with JSX tag resolution.

type ApiUserStats = {
  total_users: number;
  by_type: { users: number; agents: number; admins: number };
  by_status: { active: number; inactive: number };
  by_verification: { verified: number; unverified: number };
};

type ApiAgentStats = {
  total: number;
  verified: number;
  unverified: number;
  featured: number;
  pending_verification: number;
  unassigned: number;
};

type ApiPropertyStats = {
  total: number;
  by_status: {
    draft: number;
    pending: number;
    published: number;
    rejected: number;
  };
  total_views: number;
  total_inquiries: number;
  total_bookmarks: number;
};

type ApiTrendStats = {
  total: number;
  published: number;
  draft: number;
  total_views: number;
};
type ApiLearnStats = {
  total: number;
  total_views: number;
  by_category: { category: string; label: string; count: number }[];
};

type ApiSubStats = {
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    cancelled: number;
    expiring_soon_7d: number;
    by_tier: Record<string, number>;
  };
  revenue_naira: number;
};

type ApiPaymentStats = {
  total_transactions: number;
  by_status: {
    pending: number;
    success: number;
    failed: number;
    refunded: number;
  };
  revenue: {
    net_naira: number;
    last_30d_naira: number;
    prev_30d_naira: number;
    change_pct_30d: number | null;
  };
};

type ApiReferralStats = {
  total_referrals: number;
  suspicious_count: number;
  total_paid_amount: string;
  total_pending_amount: string;
};

type ApiInboxStats = {
  contacts: {
    total: number;
    unassigned: number;
    by_status: Record<string, number>;
  };
  feedback: {
    total: number;
    pending: number;
    approved: number;
    featured: number;
  };
};

type ApiMarketingStats = {
  leads: { total: number; by_status: Record<string, number> };
  newsletters: {
    total: number;
    drafts: number;
    sent: number;
    total_emails_sent: number;
  };
};

// ── Sub-components ────────────────────────────────────────────────────────────
// Defined first so the compiler sees them before use in the page body.

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

type StatColor = "green" | "blue" | "red" | "amber" | "purple" | "zinc";

const COLOR_MAP: Record<
  StatColor,
  { icon: string; value: string; bg: string; border: string }
> = {
  green: {
    icon: "text-green-500",
    value: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-100",
  },
  blue: {
    icon: "text-blue-500",
    value: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  red: {
    icon: "text-red-500",
    value: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  amber: {
    icon: "text-amber-500",
    value: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  purple: {
    icon: "text-purple-500",
    value: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  zinc: {
    icon: "text-zinc-400",
    value: "text-zinc-700",
    bg: "bg-zinc-50",
    border: "border-zinc-100",
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  color = "zinc",
  rawValue = false,
  trend,
  trendLabel,
  danger = false,
  small = false,
  placeholder,
}: {
  label: string;
  value: number | string | undefined;
  icon: React.ElementType;
  color?: StatColor;
  rawValue?: boolean;
  trend?: number;
  trendLabel?: string;
  danger?: boolean;
  small?: boolean;
  placeholder?: string;
}) {
  const c = COLOR_MAP[color];
  const display =
    value !== undefined
      ? rawValue
        ? String(value)
        : Number(value).toLocaleString()
      : null;

  return (
    <div
      className={[
        "bg-white rounded-2xl border flex flex-col gap-3 relative overflow-hidden",
        c.border,
        small ? "p-3" : "p-4",
      ].join(" ")}
    >
      {danger && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      <div
        className={[
          "rounded-xl flex items-center justify-center",
          c.bg,
          small ? "w-7 h-7" : "w-8 h-8",
        ].join(" ")}
      >
        <Icon
          className={[small ? "w-3.5 h-3.5" : "w-4 h-4", c.icon].join(" ")}
        />
      </div>
      <div>
        {display !== null ? (
          <p
            className={[
              "font-bold tabular-nums leading-none",
              c.value,
              small ? "text-lg" : "text-2xl",
            ].join(" ")}
          >
            {display}
          </p>
        ) : (
          <p className="text-sm text-zinc-300 italic">{placeholder ?? "—"}</p>
        )}
        <p className="text-xs text-zinc-400 mt-1">{label}</p>
        {trend !== undefined && (
          <div
            className={[
              "flex items-center gap-1 mt-1 text-xs font-medium",
              trend >= 0 ? "text-green-600" : "text-red-500",
            ].join(" ")}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {trend >= 0 ? "+" : ""}
              {trend}%
            </span>
            {trendLabel && (
              <span className="text-zinc-400 font-normal ml-1">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BarBreakdown({
  label,
  value,
  total,
  color = "bg-zinc-400",
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-xs font-semibold text-zinc-800">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={["h-full rounded-full", color].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-400">{pct}%</span>
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 px-4 py-3 flex items-center gap-3">
      <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
      <div>
        <p className="text-lg font-bold text-zinc-900 tabular-nums">{value}</p>
        <p className="text-xs text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchAll(token: string) {
  const safe = <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);
  const [
    users,
    agents,
    properties,
    trends,
    learn,
    subs,
    payments,
    referrals,
    inbox,
    marketing,
  ] = await Promise.all([
    safe(apiFetch<ApiUserStats>("/api/admin/all-users/stats/", {}, token)),
    safe(apiFetch<ApiAgentStats>("/api/admin/agents/stats/", {}, token)),
    safe(apiFetch<ApiPropertyStats>("/api/admin/properties/stats/", {}, token)),
    safe(apiFetch<ApiTrendStats>("/api/admin/trends/stats/", {}, token)),
    safe(apiFetch<ApiLearnStats>("/api/admin/learn/stats/", {}, token)),
    safe(apiFetch<ApiSubStats>("/api/admin/subscriptions/stats/", {}, token)),
    safe(apiFetch<ApiPaymentStats>("/api/admin/payments/stats/", {}, token)),
    safe(apiFetch<ApiReferralStats>("/api/admin/referrals/stats/", {}, token)),
    safe(apiFetch<ApiInboxStats>("/api/admin/contacts/stats/", {}, token)),
    safe(apiFetch<ApiMarketingStats>("/api/admin/marketing/stats/", {}, token)),
  ]);
  return {
    users,
    agents,
    properties,
    trends,
    learn,
    subs,
    payments,
    referrals,
    inbox,
    marketing,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function OverviewPage() {
  const session = await requireSession();
  const d = await fetchAll(session.accessToken);

  const naira = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-zinc-900">Platform overview</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ── Revenue & Payments ── */}
      <Section icon={Wallet} title="Revenue & Payments">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Net revenue"
            value={d.payments ? naira(d.payments.revenue.net_naira) : undefined}
            icon={Wallet}
            color="green"
            rawValue
          />
          <StatCard
            label="Last 30 days"
            value={
              d.payments ? naira(d.payments.revenue.last_30d_naira) : undefined
            }
            icon={TrendingUp}
            color="blue"
            rawValue
            trend={d.payments?.revenue.change_pct_30d ?? undefined}
            trendLabel="vs prev 30d"
          />
          <StatCard
            label="Transactions"
            value={d.payments?.total_transactions}
            icon={CreditCard}
          />
          <StatCard
            label="Failed payments"
            value={d.payments?.by_status.failed}
            icon={ShieldAlert}
            color="red"
            danger={!!d.payments && d.payments.by_status.failed > 0}
          />
        </div>

        {d.payments && (
          <div className="mt-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-sm font-semibold text-zinc-700 mb-4">
              Transaction breakdown
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {(["success", "pending", "failed", "refunded"] as const).map(
                (s) => {
                  const barColors: Record<string, string> = {
                    success: "bg-green-500",
                    pending: "bg-amber-400",
                    failed: "bg-red-500",
                    refunded: "bg-zinc-300",
                  };
                  return (
                    <BarBreakdown
                      key={s}
                      label={s.charAt(0).toUpperCase() + s.slice(1)}
                      value={d.payments!.by_status[s]}
                      total={d.payments!.total_transactions}
                      color={barColors[s]}
                    />
                  );
                },
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ── Users ── */}
      <Section icon={Users} title="Users">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total users"
            value={d.users?.total_users}
            icon={Users}
          />
          <StatCard
            label="Active"
            value={d.users?.by_status.active}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Inactive"
            value={d.users?.by_status.inactive}
            icon={UserX}
            color="red"
          />
          <StatCard
            label="Email verified"
            value={d.users?.by_verification.verified}
            icon={MailCheck}
            color="blue"
          />
        </div>
        {d.users?.by_type && (
          <div className="mt-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-sm font-semibold text-zinc-700 mb-4">
              By account type
            </p>
            <div className="grid grid-cols-3 gap-6">
              <BarBreakdown
                label="Regular users"
                value={d.users.by_type.users}
                total={d.users.total_users}
                color="bg-zinc-400"
              />
              <BarBreakdown
                label="Agents"
                value={d.users.by_type.agents}
                total={d.users.total_users}
                color="bg-blue-500"
              />
              <BarBreakdown
                label="Admins"
                value={d.users.by_type.admins}
                total={d.users.total_users}
                color="bg-purple-500"
              />
            </div>
          </div>
        )}
      </Section>

      {/* ── Agents ── */}
      <Section icon={UserCheck} title="Agents">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total agents"
            value={d.agents?.total}
            icon={UserCheck}
          />
          <StatCard
            label="Verified"
            value={d.agents?.verified}
            icon={BadgeCheck}
            color="green"
          />
          <StatCard
            label="Pending review"
            value={d.agents?.pending_verification}
            icon={ShieldAlert}
            color="amber"
            danger={!!d.agents && d.agents.pending_verification > 0}
          />
          <StatCard
            label="Unassigned"
            value={d.agents?.unassigned}
            icon={Users}
            color="red"
            danger={!!d.agents && d.agents.unassigned > 0}
          />
        </div>
      </Section>

      {/* ── Properties ── */}
      <Section icon={Building2} title="Properties">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total listings"
            value={d.properties?.total}
            icon={Building2}
          />
          <StatCard
            label="Published"
            value={d.properties?.by_status.published}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Pending review"
            value={d.properties?.by_status.pending}
            icon={ShieldAlert}
            color="amber"
            danger={!!d.properties && d.properties.by_status.pending > 0}
          />
          <StatCard
            label="Rejected"
            value={d.properties?.by_status.rejected}
            icon={ShieldAlert}
            color="red"
          />
        </div>
        {d.properties && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <MetricTile
              label="Total views"
              value={d.properties.total_views.toLocaleString()}
              icon={Eye}
            />
            <MetricTile
              label="Total inquiries"
              value={d.properties.total_inquiries.toLocaleString()}
              icon={MessageSquare}
            />
            <MetricTile
              label="Bookmarked"
              value={d.properties.total_bookmarks.toLocaleString()}
              icon={BookOpen}
            />
          </div>
        )}
      </Section>

      {/* ── Subscriptions ── */}
      <Section icon={CreditCard} title="Subscriptions">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Active subs"
            value={d.subs?.subscriptions.active}
            icon={CreditCard}
            color="green"
          />
          <StatCard
            label="Expiring (7d)"
            value={d.subs?.subscriptions.expiring_soon_7d}
            icon={ShieldAlert}
            color="amber"
            danger={!!d.subs && d.subs.subscriptions.expiring_soon_7d > 0}
          />
          <StatCard
            label="Expired"
            value={d.subs?.subscriptions.expired}
            icon={UserX}
            color="red"
          />
          <StatCard
            label="Sub revenue"
            value={d.subs ? naira(d.subs.revenue_naira) : undefined}
            icon={Wallet}
            color="blue"
            rawValue
          />
        </div>
        {d.subs?.subscriptions.by_tier && (
          <div className="mt-4 bg-white rounded-2xl border border-zinc-100 p-5">
            <p className="text-sm font-semibold text-zinc-700 mb-4">
              Active subscribers by tier
            </p>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(d.subs.subscriptions.by_tier).map(
                ([tier, count]) => {
                  const tierColors: Record<string, string> = {
                    free: "bg-zinc-300",
                    premium: "bg-blue-500",
                    enterprise: "bg-purple-500",
                  };
                  return (
                    <BarBreakdown
                      key={tier}
                      label={tier.charAt(0).toUpperCase() + tier.slice(1)}
                      value={count}
                      total={d.subs!.subscriptions.active || 1}
                      color={tierColors[tier] ?? "bg-zinc-400"}
                    />
                  );
                },
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ── Content ── */}
      <Section icon={TrendingUp} title="Content">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Trend articles"
            value={d.trends?.total}
            icon={TrendingUp}
          />
          <StatCard
            label="Published"
            value={d.trends?.published}
            icon={MailCheck}
            color="green"
          />
          <StatCard
            label="Article views"
            value={d.trends?.total_views}
            icon={Eye}
            color="blue"
          />
          <StatCard
            label="Learn resources"
            value={d.learn?.total}
            icon={GraduationCap}
          />
        </div>
        {d.learn && d.learn.total_views > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <MetricTile
              label="Learn views"
              value={d.learn.total_views.toLocaleString()}
              icon={Eye}
            />
            {d.learn.by_category.slice(0, 2).map((c) => (
              <MetricTile
                key={c.category}
                label={c.label}
                value={String(c.count)}
                icon={GraduationCap}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── Referrals ── */}
      <Section icon={GitBranch} title="Referrals">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total referrals"
            value={d.referrals?.total_referrals}
            icon={GitBranch}
          />
          <StatCard
            label="Pending payout"
            value={
              d.referrals
                ? naira(parseFloat(d.referrals.total_pending_amount))
                : undefined
            }
            icon={Wallet}
            color="amber"
            rawValue
          />
          <StatCard
            label="Total paid"
            value={
              d.referrals
                ? naira(parseFloat(d.referrals.total_paid_amount))
                : undefined
            }
            icon={TrendingUp}
            color="green"
            rawValue
          />
          <StatCard
            label="Suspicious"
            value={d.referrals?.suspicious_count}
            icon={ShieldAlert}
            color="red"
            danger={!!d.referrals && d.referrals.suspicious_count > 0}
          />
        </div>
      </Section>

      {/* ── Inbox + Marketing ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Section icon={Inbox} title="Inbox">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Open messages"
              value={d.inbox?.contacts.by_status["open"]}
              icon={MessageSquare}
              color="blue"
              small
            />
            <StatCard
              label="Unassigned"
              value={d.inbox?.contacts.unassigned}
              icon={UserX}
              color="amber"
              danger={!!d.inbox && d.inbox.contacts.unassigned > 0}
              small
            />
            <StatCard
              label="Pending feedback"
              value={d.inbox?.feedback.pending}
              icon={ShieldAlert}
              color="amber"
              small
            />
            <StatCard
              label="Featured reviews"
              value={d.inbox?.feedback.featured}
              icon={BadgeCheck}
              color="green"
              small
            />
          </div>
        </Section>

        <Section icon={Tag} title="Marketing">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total leads"
              value={d.marketing?.leads.total}
              icon={Users}
              small
            />
            <StatCard
              label="Converted"
              value={d.marketing?.leads.by_status["converted"]}
              icon={BadgeCheck}
              color="green"
              small
            />
            <StatCard
              label="Newsletters"
              value={d.marketing?.newsletters.sent}
              icon={MailCheck}
              color="blue"
              small
            />
            <StatCard
              label="Emails sent"
              value={d.marketing?.newsletters.total_emails_sent}
              icon={TrendingUp}
              small
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
