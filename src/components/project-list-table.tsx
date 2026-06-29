"use client";

import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, FolderKanban } from "lucide-react";
import { PriorityBadge } from "@/components/priority-badge";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { UserAvatar } from "@/components/user-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@/lib/project-types";
import { canManageUsers } from "@/lib/auth-permissions";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { OwnerProjectGroup } from "@/components/project-owner-section";

const OWNER_ACCENTS = [
  {
    stripe: "border-l-brand-cyan",
    header: "bg-gradient-to-r from-sky-50/90 to-slate-50/80",
    avatar: "bg-brand-navy text-white ring-brand-cyan/30",
  },
  {
    stripe: "border-l-violet-500",
    header: "bg-gradient-to-r from-violet-50/90 to-slate-50/80",
    avatar: "bg-violet-600 text-white ring-violet-300/40",
  },
  {
    stripe: "border-l-emerald-500",
    header: "bg-gradient-to-r from-emerald-50/90 to-slate-50/80",
    avatar: "bg-emerald-600 text-white ring-emerald-300/40",
  },
  {
    stripe: "border-l-amber-500",
    header: "bg-gradient-to-r from-amber-50/90 to-slate-50/80",
    avatar: "bg-amber-600 text-white ring-amber-300/40",
  },
  {
    stripe: "border-l-rose-500",
    header: "bg-gradient-to-r from-rose-50/90 to-slate-50/80",
    avatar: "bg-rose-600 text-white ring-rose-300/40",
  },
] as const;

const PROJECT_TABLE_COLUMNS = [
  { key: "name", label: "프로젝트", className: "w-[34%] min-w-[220px]" },
  { key: "status", label: "상태", className: "w-[11%] min-w-[88px]" },
  { key: "priority", label: "우선순위", className: "w-[11%] min-w-[88px]" },
  { key: "period", label: "기간", className: "w-[24%] min-w-[190px]" },
  { key: "progress", label: "진행률", className: "w-[20%] min-w-[150px]" },
] as const;

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

function getGroupStats(projects: Project[]) {
  const inProgress = projects.filter((project) => project.status === "진행중")
    .length;
  const delayed = projects.filter((project) => project.status === "지연").length;
  const avgProgress =
    projects.length === 0
      ? 0
      : Math.round(
          projects.reduce((sum, project) => sum + project.progress, 0) /
            projects.length,
        );

  return { inProgress, delayed, avgProgress };
}

function canEditOwnerAvatar(session: SessionUser, ownerId: string | null) {
  if (!ownerId) {
    return false;
  }
  return session.id === ownerId || canManageUsers(session);
}

interface ProjectListTableProps {
  groups: OwnerProjectGroup[];
  avatarMap: Record<string, string>;
  session: SessionUser;
  onAvatarChange: (userId: string, avatarUrl: string | null) => void;
}

function ProjectTableRow({ project }: { project: Project }) {
  return (
    <TableRow className="transition hover:bg-slate-50/80">
      <TableCell className="align-middle">
        <Link
          href={`/projects/${project.id}`}
          className="font-medium text-brand-navy hover:text-brand-cyan hover:underline"
        >
          {project.name}
        </Link>
        {project.department ? (
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {project.department}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="align-middle">
        <ProjectStatusBadge status={project.status} />
      </TableCell>
      <TableCell className="align-middle">
        <PriorityBadge priority={project.priority} />
      </TableCell>
      <TableCell className="whitespace-nowrap align-middle text-sm text-slate-600">
        {formatDateLabel(project.start_date)} ~ {formatDateLabel(project.end_date)}
      </TableCell>
      <TableCell className="align-middle">
        <ProgressBar value={project.progress} showLabel />
      </TableCell>
    </TableRow>
  );
}

export function ProjectListTable({
  groups,
  avatarMap,
  session,
  onAvatarChange,
}: ProjectListTableProps) {
  return (
    <div className="surface-card overflow-x-auto">
      <Table className="min-w-[900px] table-fixed">
        <colgroup>
          {PROJECT_TABLE_COLUMNS.map((column) => (
            <col key={column.key} className={column.className} />
          ))}
        </colgroup>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            {PROJECT_TABLE_COLUMNS.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        {groups.map((group, index) => {
          const accent = OWNER_ACCENTS[index % OWNER_ACCENTS.length];
          const stats = getGroupStats(group.projects);
          const sectionId = `owner-${group.ownerId ?? "unassigned"}`;

          return (
            <TableBody key={group.ownerId ?? "unassigned"} id={sectionId}>
              <TableRow
                className={cn(
                  "border-l-4 hover:bg-transparent",
                  accent.stripe,
                  accent.header,
                )}
              >
                <TableCell colSpan={PROJECT_TABLE_COLUMNS.length} className="p-0">
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      {group.ownerId ? (
                        <UserAvatar
                          userId={group.ownerId}
                          name={group.ownerLabel}
                          avatarUrl={avatarMap[group.ownerId]}
                          size="md"
                          fallbackClassName={accent.avatar}
                          editable={canEditOwnerAvatar(session, group.ownerId)}
                          onAvatarChange={(avatarUrl) =>
                            onAvatarChange(group.ownerId as string, avatarUrl)
                          }
                        />
                      ) : (
                        <UserAvatar
                          name={group.ownerLabel}
                          size="md"
                          fallbackClassName={accent.avatar}
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          담당자
                        </p>
                        <h3 className="truncate text-lg font-semibold text-slate-900">
                          {group.ownerLabel}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                        <FolderKanban className="h-3.5 w-3.5 text-brand-navy" />
                        프로젝트 {group.projects.length}건
                      </span>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                        진행중 {stats.inProgress}
                      </span>
                      {stats.delayed > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-100">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          지연 {stats.delayed}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        평균 진행률 {stats.avgProgress}%
                      </span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>

              {group.projects.map((project) => (
                <ProjectTableRow key={project.id} project={project} />
              ))}
            </TableBody>
          );
        })}
      </Table>
    </div>
  );
}
