"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

interface WeeklyWorkNotificationBadgeProps {
  variant?: "sidebar" | "inline";
}

export function WeeklyWorkNotificationBadge({
  variant = "sidebar",
}: WeeklyWorkNotificationBadgeProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCount() {
      try {
        const response = await fetch("/api/weekly-work/notifications/unread-count");
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { count?: number };
        if (active) {
          setCount(data.count ?? 0);
        }
      } catch {
        // ignore
      }
    }

    void loadCount();
    const timer = window.setInterval(() => void loadCount(), 60_000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (count <= 0) {
    return null;
  }

  const badgeClass =
    variant === "sidebar"
      ? "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white ring-2 ring-brand-navy"
      : "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white";

  return (
    <Link
      href="/weekly-work"
      className="inline-flex items-center"
      title="읽지 않은 주간업무 알림"
      aria-label={`읽지 않은 주간업무 알림 ${count}건`}
    >
      <span className={badgeClass}>{count > 99 ? "99+" : count}</span>
    </Link>
  );
}

export function formatCommentDate(value: string) {
  return format(new Date(value), "yyyy-MM-dd HH:mm");
}
