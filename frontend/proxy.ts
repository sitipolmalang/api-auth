import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookieNames } from "@/lib/env";

export async function proxy(request: NextRequest) {
  const sessionCookieNames = getSessionCookieNames();
  const hasSessionCookie = sessionCookieNames.some(
    (cookieName) => Boolean(request.cookies.get(cookieName)?.value),
  );
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isTemplatesRoute = pathname.startsWith("/templates");
  const isLoginRoute = pathname === "/login";
  const isProtectedRoute = isDashboardRoute || isTemplatesRoute;

  if (!hasSessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL("/401", request.url));
  }

  if (!hasSessionCookie) {
    return NextResponse.next();
  }

  if (isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard/users", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/templates/:path*", "/dashboard/:path*"],
};
