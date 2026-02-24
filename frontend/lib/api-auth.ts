import { getApiBaseUrl, getFrontendUrl } from "@/lib/env";

export type MeResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export type ActivityItem = {
  event: string;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
};

export type AdminOverview = {
  users_total: number;
  admins_total: number;
  auth_events_total: number;
  auth_events_today: number;
  auth_events_last_7_days: number;
  auth_events_last_30_days: number;
  auth_events_by_type: Record<string, number>;
};

type ApiResultOk<T> = { kind: "ok"; data: T };
type ApiResultUnauthorized = { kind: "unauthorized" };
type ApiResultForbidden = { kind: "forbidden" };
type ApiResultError = { kind: "error" };

export type ApiResult<T> =
  | ApiResultOk<T>
  | ApiResultUnauthorized
  | ApiResultForbidden
  | ApiResultError;

async function fetchAuthed<T>(path: string, cookieHeader: string): Promise<ApiResult<T>> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
      Origin: getFrontendUrl(),
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return { kind: "unauthorized" };
  }

  if (response.status === 403) {
    return { kind: "forbidden" };
  }

  if (!response.ok) {
    return { kind: "error" };
  }

  return { kind: "ok", data: (await response.json()) as T };
}

export function getMe(cookieHeader: string) {
  return fetchAuthed<MeResponse>("/api/me", cookieHeader);
}

export function getMyActivity(cookieHeader: string) {
  return fetchAuthed<ActivityItem[]>("/api/me/activity", cookieHeader);
}

export function getAdminOverview(cookieHeader: string) {
  return fetchAuthed<AdminOverview>("/api/admin/overview", cookieHeader);
}
