"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS, ROLE_OPTIONS } from "@/lib/role-labels";
import type { UserPublic, UserRole } from "@/lib/types";

interface UserFormState {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  user?: UserPublic;
  onSuccess: (user: UserPublic) => void;
}

const EMPTY_FORM: UserFormState = {
  id: "",
  name: "",
  email: "",
  password: "",
  role: "member",
  department: "",
};

export function UserFormDialog({
  open,
  onOpenChange,
  mode,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && user) {
      setForm({
        id: user.id,
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        department: user.department,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError("");
  }, [open, mode, user]);

  function updateField<K extends keyof UserFormState>(
    key: K,
    value: UserFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const url =
        mode === "create"
          ? "/api/admin/users"
          : `/api/admin/users/${user!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const body =
        mode === "create"
          ? form
          : {
              name: form.name,
              email: form.email,
              role: form.role,
              department: form.department,
              ...(form.password ? { password: form.password } : {}),
            };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as {
        error?: string;
        user?: UserPublic;
      };

      if (!response.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      if (data.user) {
        onSuccess(data.user);
      }
      onOpenChange(false);
    } catch {
      setError("저장 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "사용자 등록" : "사용자 수정"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-id">아이디</Label>
            <Input
              id="user-id"
              value={form.id}
              onChange={(event) => updateField("id", event.target.value)}
              placeholder="예: hskim"
              disabled={mode === "edit"}
              required={mode === "create"}
            />
            {mode === "edit" ? (
              <p className="text-xs text-slate-500">아이디는 변경할 수 없습니다.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-name">이름</Label>
            <Input
              id="user-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">이메일</Label>
            <Input
              id="user-email"
              type="text"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="name@soosan.co.kr"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">
              비밀번호
              {mode === "edit" ? (
                <span className="ml-1 font-normal text-slate-500">
                  (변경 시에만 입력)
                </span>
              ) : null}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder={mode === "edit" ? "변경하지 않으면 비워 두세요" : ""}
              required={mode === "create"}
              minLength={mode === "create" ? 6 : undefined}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>역할</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  updateField("role", (value ?? "member") as UserRole)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-department">부서</Label>
              <Input
                id="user-department"
                value={form.department}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
                placeholder="IT팀"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-navy hover:bg-brand-navy-dark"
            >
              {isSubmitting ? "저장 중..." : mode === "create" ? "등록" : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
