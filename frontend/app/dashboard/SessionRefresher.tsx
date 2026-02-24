"use client";

import { useEffect } from "react";
import { getCsrfHeaders } from "@/lib/csrf";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export default function SessionRefresher() {
  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const csrfHeaders = await getCsrfHeaders();

        await fetch("/api/auth/session/refresh", {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            ...csrfHeaders,
          },
        });
      } catch {
        // Ignore transient network failures; session check guard will handle invalid states.
      }
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  return null;
}
