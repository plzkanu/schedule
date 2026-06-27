"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserFormDialog } from "@/components/user-form-dialog";
import { ROLE_LABELS } from "@/lib/role-labels";
import { formatUserDisplayLabel } from "@/lib/user-display";
import type { UserPublic } from "@/lib/types";

interface UserManagementPanelProps {
  initialUsers: UserPublic[];
  currentUserId: string;
}

export function UserManagementPanel({
  initialUsers,
  currentUserId,
}: UserManagementPanelProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserPublic>();
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openCreateDialog() {
    setDialogMode("create");
    setEditingUser(undefined);
    setDialogOpen(true);
    setError("");
  }

  function openEditDialog(user: UserPublic) {
    setDialogMode("edit");
    setEditingUser(user);
    setDialogOpen(true);
    setError("");
  }

  function handleSuccess(user: UserPublic) {
    if (dialogMode === "create") {
      setUsers((prev) => [...prev, user].sort((a, b) => a.id.localeCompare(b.id)));
    } else {
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? user : item)),
      );
    }
    router.refresh();
  }

  async function handleDelete(user: UserPublic) {
    if (user.id === currentUserId) {
      setError("본인 계정은 삭제할 수 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      `"${formatUserDisplayLabel(user.name, user.department)}" 사용자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(user.id);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }

      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      router.refresh();
    } catch {
      setError("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={openCreateDialog}
          className="bg-brand-navy hover:bg-brand-navy-dark shadow-sm"
        >
          + 사용자 등록
        </Button>
      </div>

      <div className="overflow-x-auto surface-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>아이디</TableHead>
              <TableHead>이름</TableHead>
              <TableHead>이메일</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>부서</TableHead>
              <TableHead className="w-36">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-slate-500"
                >
                  등록된 사용자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const isDeleting = deletingId === user.id;

                return (
                  <TableRow key={user.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-sm text-slate-700">
                      {user.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.name}
                      {isCurrentUser ? (
                        <Badge variant="outline" className="ml-2">
                          본인
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{ROLE_LABELS[user.role]}</TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(user)}
                          disabled={isDeleting}
                        >
                          수정
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user)}
                          disabled={isCurrentUser || isDeleting}
                        >
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-slate-500">
        사용자 정보는 Supabase <code className="rounded bg-slate-100 px-1">it_users</code>{" "}
        테이블에 저장됩니다. 본인 계정은 삭제할 수 없으며, 관리자가 한 명뿐일 때는
        해당 관리자를 삭제하거나 역할을 변경할 수 없습니다.
      </p>

      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        user={editingUser}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
