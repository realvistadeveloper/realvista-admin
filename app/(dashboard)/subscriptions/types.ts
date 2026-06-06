// app/(dashboard)/subscriptions/types.ts

export type PlanTier = "free" | "premium" | "enterprise";
export type PlanInterval = "monthly" | "yearly";
export type SubStatus = "active" | "inactive" | "expired" | "cancelled";
export type QuoteStatus =
  | "pending"
  | "quoted"
  | "paid"
  | "activated"
  | "rejected";

export interface Plan {
  id: number;
  name: string;
  tier: PlanTier;
  interval: PlanInterval;
  price: number; // kobo
  price_naira: number;
  duration_days: number;
  paystack_plan_code: string | null;
  is_active: boolean;
  is_free: boolean;
  yearly_savings_naira: number;
  subscriber_count: number;
  created_at: string;
}

export interface SubscriptionUser {
  id: number;
  name: string;
  email: string;
  is_premium: boolean;
  is_agent: boolean;
}

export interface Subscription {
  id: number;
  user: number | SubscriptionUser;
  user_name?: string;
  user_email?: string;
  plan: number | Plan | null;
  plan_name?: string | null;
  is_enterprise: boolean;
  enterprise_label: string;
  tier: PlanTier;
  status: SubStatus;
  is_active: boolean;
  days_remaining: number;
  start_date: string | null;
  expiry_date: string | null;
  paystack_subscription_code: string | null;
  paystack_email_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseQuote {
  id: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  org_name: string;
  org_type: string;
  org_size: number;
  message: string;
  status: QuoteStatus;
  quoted_price: number | null;
  quoted_price_naira: number | null;
  duration_days: number | null;
  payment_link: string;
  admin_notes: string;
  paystack_reference: string;
  user: number | null;
  user_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStats {
  subscriptions: {
    total: number;
    active: number;
    expired: number;
    cancelled: number;
    inactive: number;
    expiring_soon_7d: number;
    by_tier: Record<PlanTier, number>;
  };
  plans: {
    total: number;
    by_tier: Record<PlanTier, number>;
  };
  quotes: {
    total: number;
    pending: number;
    quoted: number;
    paid: number;
    activated: number;
  };
  revenue_kobo: number;
  revenue_naira: number;
}

export interface PaginatedSubscriptions {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Subscription[];
}

export interface PaginatedQuotes {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: EnterpriseQuote[];
}
