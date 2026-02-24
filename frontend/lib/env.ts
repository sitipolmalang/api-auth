export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

export function getFrontendUrl() {
  return process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:3000";
}

export function getSessionCookieName() {
  return process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ?? "laravel-session";
}

export function getSessionCookieNames() {
  const primary = getSessionCookieName();
  const candidates = [primary];

  if (primary.includes("-")) {
    candidates.push(primary.replace(/-/g, "_"));
  } else if (primary.includes("_")) {
    candidates.push(primary.replace(/_/g, "-"));
  }

  return Array.from(new Set(candidates));
}
