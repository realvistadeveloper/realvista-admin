// app/(dashboard)/notifications/log/types.ts

export type NotificationType =
  | "system"
  | "listing"
  | "subscription"
  | "referral"
  | "payment"
  | "appointment";

export interface NotificationLogEntry {
  id: number;
  user: number;
  user_email: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedNotificationLog {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: NotificationLogEntry[];
}

export type NotificationTarget = "all" | "agents" | "premium" | "user";

export interface UserSearchResult {
  id: number;
  name: string;
  email: string;
}
