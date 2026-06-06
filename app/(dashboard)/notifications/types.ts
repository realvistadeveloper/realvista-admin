// app/(dashboard)/notifications/types.ts
export interface Device {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  token: string;
  created_at: string;
}
export interface EmailSetting {
  id: number;
  user: number | null;
  user_email: string;
  email: string | null;
  receive_email_notifications: boolean;
  created_at: string;
}
export interface PushNotification {
  id: number;
  title: string;
  body: string;
  data: Record<string, unknown>;
  target: "all" | "user" | "topic";
  target_user: number | null;
  target_user_email: string | null;
  topic: string;
  status: "draft" | "sent" | "failed";
  sent_count: number;
  failed_count: number;
  created_by: number | null;
  created_by_name: string | null;
  sent_at: string | null;
  created_at: string;
}
export interface NotificationStats {
  devices: number;
  email: { opted_in: number; opted_out: number };
  push: { sent: number; failed: number };
}
