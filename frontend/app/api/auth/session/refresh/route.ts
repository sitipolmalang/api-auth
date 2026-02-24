import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieNames } from "@/lib/env";

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export async function POST(request: NextRequest) {
  const sessionCookieNames = getSessionCookieNames();
  const hasSession = sessionCookieNames.some((name) => Boolean(request.cookies.get(name)?.value));
  const cookieHeader = request.headers.get("cookie") ?? "";
  const xsrfToken = request.cookies.get("XSRF-TOKEN")?.value;

  if (!hasSession) {
    return NextResponse.json({ message: "No active session" }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
        Origin: request.nextUrl.origin,
        "X-XSRF-TOKEN": xsrfToken ? decodeURIComponent(xsrfToken) : "",
        "X-CSRF-Guard": "1",
      },
      cache: "no-store",
    });

    return NextResponse.json(
      { message: upstream.ok ? "Session refreshed" : "Refresh failed" },
      { status: upstream.status },
    );
  } catch {
    return NextResponse.json({ message: "Refresh upstream error" }, { status: 502 });
  }
}
