// app/(dashboard)/referrals/types.ts

export type EarningStatus = "pending" | "paid" | "cancelled";

export interface ReferralUser {
  id: number;
  name: string;
  email: string;
  is_agent: boolean;
  is_active: boolean;
  device_id: string | null;
  install_id: string | null;
}

export interface ReferralEarning {
  id: number;
  referral: number;
  referrer: number;
  referrer_email: string;
  referrer_name: string;
  referred_user: number;
  referred_user_email: string;
  referred_user_name: string;
  payment_amount: string;
  reward_amount: string;
  reward_percent: string;
  status: EarningStatus;
  paid_out_at: string | null;
  notes: string;
  is_suspicious: boolean;
  suspicious_reason: string;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: number;
  referrer: number;
  referrer_name: string;
  referrer_email: string;
  referred_user: number;
  referred_user_name: string;
  referred_user_email: string;
  total_earned: string;
  earnings_count: number;
  has_suspicious: boolean;
  earnings?: ReferralEarning[];
  created_at: string;
}

export interface PaginatedReferrals {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Referral[];
}

export interface PaginatedEarnings {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: ReferralEarning[];
}

export interface ReferralStats {
  total_referrals: number;
  total_earnings: number;
  by_status: {
    pending: number;
    paid: number;
    cancelled: number;
  };
  suspicious_count: number;
  total_paid_amount: string;
  total_pending_amount: string;
  top_referrers: {
    id: number;
    name: string;
    email: string;
    count: number;
  }[];
}

export interface UserReferralSummary {
  user: ReferralUser;
  total_referrals: number;
  total_earned: string;
  pending_earnings: string;
  suspicious_count: number;
  referrals: Referral[];
}
