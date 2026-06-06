"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "./api";
import type { AdminUser, AuthTokens } from "@/lib/types";

// ── Cookie keys ───────────────────────────────────────────────────────────────

const COOKIE_ACCESS = "rv_admin_access";
const COOKIE_REFRESH = "rv_admin_refresh";
const COOKIE_USER = "rv_admin_user";

const IS_PROD = process.env.NODE_ENV === "production";

const COOKIE_BASE = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: "lax" as const,
  path: "/",
};

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(
  email: string,
  password: string,
  redirectTo: string = "/overview",
) {
  const data = await apiFetch<AuthTokens>("/api/admin/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const jar = await cookies();

  jar.set(COOKIE_ACCESS, data.access, {
    ...COOKIE_BASE,
    maxAge: 60 * 30, // 30 min — matches ACCESS_TOKEN_LIFETIME
  });

  jar.set(COOKIE_REFRESH, data.refresh, {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 24 * 7, // 7 days — matches REFRESH_TOKEN_LIFETIME
  });

  // Store the full user object as-is — role/access_level/permissions are
  // already flat on data.user from the backend's AdminIdentitySerializer
  jar.set(COOKIE_USER, JSON.stringify(data.user), {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 24 * 7,
  });

  const destination =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/overview";

  redirect(destination);
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const jar = await cookies();
  const accessToken = jar.get(COOKIE_ACCESS)?.value;
  const refreshToken = jar.get(COOKIE_REFRESH)?.value;

  // Best-effort: blacklist the refresh token server-side so it cannot
  // be rotated into a new access token even if extracted from the cookie
  if (accessToken && refreshToken) {
    apiFetch(
      "/api/admin/auth/logout/",
      { method: "POST", body: JSON.stringify({ refresh: refreshToken }) },
      accessToken,
    ).catch(() => {});
  }

  jar.delete(COOKIE_ACCESS);
  jar.delete(COOKIE_REFRESH);
  jar.delete(COOKIE_USER);

  redirect("/login");
}

// ── Get session ───────────────────────────────────────────────────────────────

export async function getSession(): Promise<{
  user: AdminUser;
  accessToken: string;
} | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_ACCESS)?.value;
    const raw = jar.get(COOKIE_USER)?.value;

    if (!token || !raw) return null;

    const user = JSON.parse(raw) as AdminUser;
    return { user, accessToken: token };
  } catch {
    return null;
  }
}

// ── Require session ───────────────────────────────────────────────────────────

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// ── Require minimum access level ─────────────────────────────────────────────

export async function requireAccessLevel(minLevel: number) {
  const session = await requireSession();

  if ((session.user.access_level ?? 0) < minLevel) {
    redirect("/overview?error=insufficient_access");
  }

  return session;
}

// ── Require specific role ─────────────────────────────────────────────────────

export async function requireRole(...roles: AdminUser["role"][]) {
  const session = await requireSession();

  if (!session.user.role || !roles.includes(session.user.role)) {
    redirect("/overview?error=insufficient_access");
  }

  return session;
}

// ── Refresh access token ──────────────────────────────────────────────────────

/**
 * Called by middleware or Server Actions when a request fails with 401.
 * Exchanges the refresh cookie for a new access token and updates the cookie.
 * Returns the new access token string, or null if refresh failed (force logout).
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const jar = await cookies();
    const refreshToken = jar.get(COOKIE_REFRESH)?.value;

    if (!refreshToken) return null;

    const data = await apiFetch<{ access: string; refresh?: string }>(
      "/api/admin/auth/token/refresh/",
      { method: "POST", body: JSON.stringify({ refresh: refreshToken }) },
    );

    jar.set(COOKIE_ACCESS, data.access, {
      ...COOKIE_BASE,
      maxAge: 60 * 30,
    });

    // If ROTATE_REFRESH_TOKENS=True the backend returns a new refresh token
    if (data.refresh) {
      jar.set(COOKIE_REFRESH, data.refresh, {
        ...COOKIE_BASE,
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return data.access;
  } catch {
    return null;
  }
}
