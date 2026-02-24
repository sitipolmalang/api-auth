"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCsrfHeaders } from "@/lib/csrf";
export default function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await getCsrfHeaders();

      const logoutResponse = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!logoutResponse.ok) {
        throw new Error(`Logout failed with status ${logoutResponse.status}`);
      }

      const revalidateResponse = await fetch("/api/auth/session/revalidate", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!revalidateResponse.ok) {
        throw new Error(`Revalidate failed with status ${revalidateResponse.status}`);
      }
    } catch (error) {
      console.error("Logout failed", error);
      window.alert("Logout gagal. Silakan coba lagi.");
      return;
    } finally {
      setIsLoading(false);
    }

    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={`rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {isLoading ? "Logging out..." : "Logout"}
    </button>
  );
}
