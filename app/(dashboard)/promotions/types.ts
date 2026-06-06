// app/(dashboard)/promotions/types.ts

export type PromotionType = "referral" | "other";
export type PromotionCurrency = "NGN" | "EUR" | "USD";
export type ConditionType = "time" | "budget";

export interface StopCondition {
  id: number;
  type: ConditionType;
  end_date: string | null;
  total_budget: string | null;
  spent_budget: string;
}

export interface PromotionEarning {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  referral: number | null;
  amount: string;
  is_reversed: boolean;
  created_at: string;
}

export interface Promotion {
  id: number;
  name: string;
  code: string;
  promotion_type: PromotionType;
  currency: PromotionCurrency;
  reward_amount: string;
  is_active: boolean;
  is_active_now: boolean;
  condition_count: number;
  total_earned: string;
  earnings_count: number;
  stop_conditions: StopCondition[];
  created_at: string;
}

export interface PaginatedPromotions {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Promotion[];
}

export interface PromotionStats {
  total_promotions: number;
  active_promotions: number;
  inactive_promotions: number;
  by_type: {
    referral: number;
    other: number;
  };
  total_earned: string;
  total_payouts: number;
  reversed_payouts: number;
  by_currency: { currency: string; total: string }[];
}
