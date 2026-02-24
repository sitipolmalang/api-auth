import { getApiBaseUrl, getFrontendUrl } from "@/lib/env";

export type SessionCheckResult = {
  isValid: boolean;
  shouldClearCookie: boolean;
};

export type AdminCheckResult =
  | { kind: "admin" }
  | { kind: "non_admin" }
  | { kind: "unauthorized"; shouldClearCookie: boolean }
  | { kind: "error" };

export async function checkSession(cookieHeader: string | undefined): Promise<SessionCheckResult> {
  if (!cookieHeader) {
    return { isValid: false, shouldClearCookie: false };
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/session`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
        Origin: getFrontendUrl(),
      },
      cache: "no-store",
    });

    if (response.status === 204) {
      return { isValid: true, shouldClearCookie: false };
    }

    return { isValid: false, shouldClearCookie: true };
  } catch {
    return { isValid: false, shouldClearCookie: false };
  }
}

export async function hasValidSession(cookieHeader: string | undefined): Promise<boolean> {
  const result = await checkSession(cookieHeader);
  return result.isValid;
}

export async function checkAdminRole(cookieHeader: string | undefined): Promise<AdminCheckResult> {
  if (!cookieHeader) {
    return { kind: "unauthorized", shouldClearCookie: false };
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/me`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
        Origin: getFrontendUrl(),
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { kind: "unauthorized", shouldClearCookie: true };
    }

    if (!response.ok) {
      return { kind: "error" };
    }

    const me = (await response.json()) as { role?: string };

    return me.role === "admin" ? { kind: "admin" } : { kind: "non_admin" };
  } catch {
    return { kind: "error" };
  }
}
