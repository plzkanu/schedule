"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!userId.trim() || !password.trim()) {
      setError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim(),
          password,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }

      const from = searchParams.get("from");
      const safeFrom =
        from &&
        (from.startsWith("/dashboard") ||
          from.startsWith("/projects") ||
          from.startsWith("/admin"))
          ? from
          : "/dashboard";

      router.push(safeFrom);
      router.refresh();
    } catch {
      setError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="surface-card px-8 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-brand-navy">로그인</h1>
          <p className="mt-2 text-sm text-slate-500">
            사내 계정으로 시스템에 접속합니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="userId">아이디</Label>
            <Input
              id="userId"
              type="text"
              autoComplete="username"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="hskim"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="h-11"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full bg-brand-navy text-base font-semibold hover:bg-brand-navy-dark"
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
