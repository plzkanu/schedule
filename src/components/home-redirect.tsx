"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function redirect() {
      try {
        const response = await fetch("/api/auth/me");
        if (cancelled) {
          return;
        }
        if (response.ok) {
          const data = (await response.json()) as { user?: unknown };
          router.replace(data.user ? "/dashboard" : "/login");
          return;
        }
      } catch {
        // fall through to login
      }
      if (!cancelled) {
        router.replace("/login");
      }
    }

    void redirect();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f4f8] text-sm text-slate-500">
      로딩 중...
    </div>
  );
}
