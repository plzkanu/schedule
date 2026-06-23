"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  variant?: "default" | "mobile";
}

export function LogoutButton({ variant = "default" }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  if (variant === "mobile") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-brand-navy disabled:opacity-60"
        aria-label="로그아웃"
      >
        <LogOut className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoading}
      className={cn("border-slate-200")}
    >
      {isLoading ? "로그아웃 중..." : "로그아웃"}
    </Button>
  );
}
