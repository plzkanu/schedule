"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectDeleteButtonProps {
  projectId: string;
  projectName: string;
}

export function ProjectDeleteButton({
  projectId,
  projectName,
}: ProjectDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `"${projectName}" 프로젝트를 삭제하시겠습니까?\n연결된 태스크도 함께 삭제됩니다.`,
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "삭제에 실패했습니다.");
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch {
      setError("삭제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-200/80 bg-red-50/50 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-red-900">위험 구역</h3>
          <p className="mt-1 text-sm text-red-700/80">
            프로젝트를 삭제하면 연결된 모든 태스크와 활동 이력이 함께
            제거됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-4"
          >
            {isDeleting ? "삭제 중..." : "프로젝트 삭제"}
          </Button>
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
