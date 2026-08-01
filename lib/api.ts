// lib/api.ts

import { refreshAccessToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const buildHeaders = (bearer?: string): Record<string, string> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    return headers;
  };

  let res = await fetch(url, { ...options, headers: buildHeaders(token) });

  // If an authenticated request comes back 401, the access token has likely
  // expired. Exchange the refresh cookie for a new one and retry the call once.
  // Gating on `token` means unauthenticated calls (login, the refresh endpoint
  // itself) skip this branch, so there is no recursion and a bad-credentials
  // 401 still surfaces its real message.
  if (res.status === 401 && token) {
    let newToken: string | null = null;
    try {
      newToken = await refreshAccessToken();
    } catch {
      newToken = null;
    }

    if (newToken) {
      res = await fetch(url, { ...options, headers: buildHeaders(newToken) });
    } else {
      // Refresh failed — the session is truly gone. On the client, navigate to
      // login now; on the server, throw so the caller can redirect().
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=session_expired";
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body?.error ||
      body?.detail ||
      body?.message ||
      (() => {
        const fieldErrors = Object.entries(body)
          .filter(([, v]) => v)
          .map(
            ([field, msgs]) =>
              `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
          )
          .join(" | ");
        return fieldErrors || null;
      })() ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

/**
 * True when an error thrown by apiFetch looks like an auth failure that should
 * send the user back to the login screen (rather than showing an empty page).
 */
export function isAuthError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /session expired/i.test(msg) || msg.includes("401");
}
