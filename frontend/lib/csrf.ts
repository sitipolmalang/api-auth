"use client";

import { getApiBaseUrl } from "@/lib/env";

function readCookie(name: string): string | undefined {
  const item = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!item) {
    return undefined;
  }

  const value = item.slice(name.length + 1);
  return decodeURIComponent(value);
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
  await fetch(`${getApiBaseUrl()}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  const xsrfToken = readCookie("XSRF-TOKEN");

  if (!xsrfToken) {
    throw new Error("Missing XSRF-TOKEN cookie.");
  }

  return {
    "X-XSRF-TOKEN": xsrfToken,
    "X-CSRF-Guard": "1",
  };
}
