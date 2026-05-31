// lib/auth.ts

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch } from "./api";
import { AuthTokens, AdminUser } from "./types";

const COOKIE_ACCESS = "sp_admin_access";
const COOKIE_REFRESH = "sp_admin_refresh";
const COOKIE_USER = "sp_admin_user";

// ── Login ─────────────────────────────────────────────────────────────────────

export async function loginAction(email: string, password: string) {
  const data = await apiFetch<AuthTokens>("/accounts/login/", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const jar = await cookies();

  jar.set(COOKIE_ACCESS, data.access, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  jar.set(COOKIE_REFRESH, data.refresh, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  jar.set(
    COOKIE_USER,
    JSON.stringify({
      ...data.user,
      staff_level: data.staff_level,
    }),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  return data;
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(COOKIE_ACCESS);
  jar.delete(COOKIE_REFRESH);
  jar.delete(COOKIE_USER);
  redirect("/login");
}

// ── Get current session ───────────────────────────────────────────────────────

export async function getSession(): Promise<{
  user: AdminUser;
  accessToken: string;
} | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_ACCESS)?.value;
  const raw = jar.get(COOKIE_USER)?.value;

  if (!token || !raw) return null;

  try {
    const user = JSON.parse(raw) as AdminUser;
    return { user, accessToken: token };
  } catch {
    return null;
  }
}
