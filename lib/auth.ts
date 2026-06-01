// lib/auth.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "./api";
import type { AdminUser, AuthTokens } from "./types";

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
  redirectTo: string = "/dashboard",
) {
  const data = await apiFetch<AuthTokens>("/admin-api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const jar = await cookies();

  jar.set(COOKIE_ACCESS, data.access, { ...COOKIE_BASE, maxAge: 60 * 30 });
  jar.set(COOKIE_REFRESH, data.refresh, {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 24 * 7,
  });
  jar.set(
    COOKIE_USER,
    JSON.stringify({ ...data.user, staff_level: data.staff_level }),
    {
      ...COOKIE_BASE,
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  const destination =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  redirect(destination);
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const jar = await cookies();
  const accessToken = jar.get(COOKIE_ACCESS)?.value;
  const refreshToken = jar.get(COOKIE_REFRESH)?.value;

  // Best-effort: blacklist the refresh token server-side
  if (accessToken && refreshToken) {
    apiFetch(
      "/admin-api/auth/logout/",
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
  if ((session.user.staff_level ?? 0) < minLevel) {
    redirect("/dashboard?error=insufficient_access");
  }
  return session;
}
