// ── Auth ──────────────────────────────────────────────────────────────────────

export type AdminRole = "super_admin" | "moderator" | "content_manager";

export interface AdminUser {
  id: number;
  name: string;
  first_name: string | null;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  // Flattened from AdminProfile — stamped directly on the login response user object
  role: AdminRole | null;
  access_level: number; // 1–10; matches AdminProfile.access_level
  permissions: Record<string, unknown>;
}

/**
 * Shape returned by POST /api/admin/auth/login/
 * access_level lives inside user — not at the top level.
 */
export interface AuthTokens {
  access: string; // short-lived JWT (30 min)
  refresh: string; // rotating JWT   (7 days)
  user: AdminUser;
}
