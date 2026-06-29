"use client";

import { AlertTriangle, FolderKanban } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { UserAvatar } from "@/components/user-avatar";
import type { Project } from "@/lib/project-types";
import { cn } from "@/lib/utils";

export interface OwnerProjectGroup {
  ownerId: string | null;
  ownerLabel: string;
  projects: Project[];
}

const OWNER_ACCENTS = [
  {
    stripe: "border-l-brand-cyan",
    header: "bg-gradient-to-r from-sky-50/90 to-white",
    avatar: "bg-brand-navy text-white ring-brand-cyan/30",
  },
  {
    stripe: "border-l-violet-500",
    header: "bg-gradient-to-r from-violet-50/90 to-white",
    avatar: "bg-violet-600 text-white ring-violet-300/40",
  },
  {
    stripe: "border-l-emerald-500",
    header: "bg-gradient-to-r from-emerald-50/90 to-white",
    avatar: "bg-emerald-600 text-white ring-emerald-300/40",
  },
  {
    stripe: "border-l-amber-500",
    header: "bg-gradient-to-r from-amber-50/90 to-white",
    avatar: "bg-amber-600 text-white ring-amber-300/40",
  },
  {
    stripe: "border-l-rose-500",
    header: "bg-gradient-to-r from-rose-50/90 to-white",
    avatar: "bg-rose-600 text-white ring-rose-300/40",
  },
] as const;

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

interface ProjectOwnerSectionProps {
  group: OwnerProjectGroup;
  index: number;
  avatarUrl?: string | null;
  canEditAvatar?: boolean;
  onAvatarChange?: (avatarUrl: string | null) => void;
}

export function ProjectOwnerSection({
  group,
  index,
  avatarUrl,
  canEditAvatar = false,
  onAvatarChange,
}: ProjectOwnerSectionProps) {
  const accent = OWNER_ACCENTS[index % OWNER_ACCENTS.length];
  const stats = getGroupStats(group.projects);
  const sectionId = `owner-${group.ownerId ?? "unassigned"}`;

  return (
    <section
      id={sectionId}
      className={cn(
        "surface-card scroll-mt-24 overflow-hidden border-l-4",
        accent.stripe,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
          accent.header,
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          {group.ownerId ? (
            <UserAvatar
              userId={group.ownerId}
              name={group.ownerLabel}
              avatarUrl={avatarUrl}
              size="md"
              fallbackClassName={accent.avatar}
              editable={canEditAvatar}
              onAvatarChange={onAvatarChange}
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

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        {group.projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            ownerName={group.ownerLabel}
            showOwner={false}
          />
        ))}
      </div>
    </section>
  );
}
