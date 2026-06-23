"use client";

import { format } from "date-fns";
import { AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueStatusBadge } from "@/components/issue-status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import type { ProjectIssue } from "@/lib/issue-types";
import { cn } from "@/lib/utils";

interface ProjectIssueListProps {
  issues: ProjectIssue[];
  userNames: Record<string, string>;
  canWrite: boolean;
  onAddIssue: () => void;
  onEditIssue: (issueId: string) => void;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

function isOpenIssue(issue: ProjectIssue) {
  return issue.status !== "해결";
}

export function ProjectIssueList({
  issues,
  userNames,
  canWrite,
  onAddIssue,
  onEditIssue,
}: ProjectIssueListProps) {
  const openCount = issues.filter(isOpenIssue).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">프로젝트 이슈</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            전체 {issues.length}건 · 미해결 {openCount}건
          </p>
        </div>
        {canWrite ? (
          <Button
            type="button"
            size="sm"
            onClick={onAddIssue}
            className="bg-brand-navy hover:bg-brand-navy-dark"
          >
            <Plus className="mr-2 h-4 w-4" />
            이슈 등록
          </Button>
        ) : null}
      </div>

      {issues.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            등록된 이슈가 없습니다
          </p>
          <p className="mt-1 text-xs text-slate-400">
            프로젝트 진행 중 발생한 이슈를 기록해 보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => (canWrite ? onEditIssue(issue.id) : undefined)}
              disabled={!canWrite}
              className={cn(
                "surface-card w-full p-4 text-left transition",
                canWrite && "hover:shadow-card-hover hover:ring-1 hover:ring-brand-cyan/20",
                isOpenIssue(issue) && issue.severity === "상" && "ring-1 ring-red-100",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <IssueStatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.severity} />
                  </div>
                  <h3 className="mt-2 font-semibold text-slate-900">
                    {issue.title}
                  </h3>
                  {issue.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {issue.description}
                    </p>
                  ) : null}
                  {issue.resolution && issue.status === "해결" ? (
                    <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      해결: {issue.resolution}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-xs text-slate-500 sm:text-right">
                  <p>발생 {formatDateLabel(issue.occurred_date)}</p>
                  <p className="mt-1">
                    등록{" "}
                    {issue.reporter_id
                      ? (userNames[issue.reporter_id] ?? "미지정")
                      : "미지정"}
                  </p>
                  <p>
                    담당{" "}
                    {issue.assignee_id
                      ? (userNames[issue.assignee_id] ?? "미지정")
                      : "미지정"}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
