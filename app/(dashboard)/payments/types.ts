// app/(dashboard)/payments/types.ts

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type PaymentGateway = "paystack";

export interface Payment {
  id: number;
  reference: string;
  paystack_reference: string | null;
  paystack_transaction_id: string | null;
  authorization_code: string | null;
  user: number;
  user_name: string;
  user_email: string;
  plan: number | null;
  plan_name: string | null;
  amount: number; // kobo
  amount_naira: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  channel: string | null;
  ip_address: string | null;
  metadata: Record<string, unknown>;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPayments {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Payment[];
}

export interface PaymentStats {
  total_transactions: number;
  by_status: Record<PaymentStatus, number>;
  revenue: {
    total_kobo: number;
    total_naira: number;
    refunded_kobo: number;
    refunded_naira: number;
    net_kobo: number;
    net_naira: number;
    last_30d_naira: number;
    prev_30d_naira: number;
    change_pct_30d: number | null;
  };
  by_channel: {
    channel: string;
    count: number;
    total_naira: number;
  }[];
}
