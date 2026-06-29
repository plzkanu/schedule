"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Search, Users } from "lucide-react";
import {
  ProjectOwnerSection,
  type OwnerProjectGroup,
} from "@/components/project-owner-section";
import { ProjectListTable } from "@/components/project-list-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "@/lib/project-types";
import { sortProjectsForList } from "@/lib/project-sort";
import { canManageUsers } from "@/lib/auth-permissions";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "grid";
type SortKey = "updated" | "name" | "progress" | "end_date";

interface ProjectListViewProps {
  projects: Project[];
  ownerMap: Record<string, string>;
  avatarMap: Record<string, string>;
  session: SessionUser;
}

function canEditOwnerAvatar(session: SessionUser, ownerId: string | null) {
  if (!ownerId) {
    return false;
  }
  return session.id === ownerId || canManageUsers(session);
}

function sortProjectList(projects: Project[], sort: SortKey): Project[] {
  return sortProjectsForList(projects, (a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name, "ko");
      case "progress":
        return b.progress - a.progress;
      case "end_date":
        return a.end_date.localeCompare(b.end_date);
      default:
        return b.updated_at.localeCompare(a.updated_at);
    }
  });
}

function groupProjectsByOwner(
  projects: Project[],
  ownerMap: Record<string, string>,
  sort: SortKey,
): OwnerProjectGroup[] {
  const grouped = new Map<string | null, Project[]>();

  for (const project of projects) {
    const ownerId = project.owner_id ?? null;
    const list = grouped.get(ownerId) ?? [];
    list.push(project);
    grouped.set(ownerId, list);
  }

  return Array.from(grouped.entries())
    .map(([ownerId, ownerProjects]) => ({
      ownerId,
      ownerLabel: ownerId
        ? (ownerMap[ownerId] ?? "담당자 미지정")
        : "담당자 미지정",
      projects: sortProjectList(ownerProjects, sort),
    }))
    .sort((a, b) => a.ownerLabel.localeCompare(b.ownerLabel, "ko"));
}

function scrollToOwnerSection(ownerId: string | null) {
  const element = document.getElementById(
    `owner-${ownerId ?? "unassigned"}`,
  );
  element?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ProjectListView({
  projects,
  ownerMap,
  avatarMap: initialAvatarMap,
  session,
}: ProjectListViewProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("table");
  const [sort, setSort] = useState<SortKey>("updated");
  const [localSearch, setLocalSearch] = useState("");
  const [avatarMap, setAvatarMap] = useState(initialAvatarMap);

  function handleAvatarChange(userId: string, avatarUrl: string | null) {
    setAvatarMap((prev) => {
      const next = { ...prev };
      if (avatarUrl) {
        next[userId] = avatarUrl;
      } else {
        delete next[userId];
      }
      return next;
    });
    router.refresh();
  }

  const filtered = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    let list = projects;
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.department ?? "").toLowerCase().includes(q) ||
          (p.owner_id
            ? (ownerMap[p.owner_id] ?? "").toLowerCase().includes(q)
            : false),
      );
    }
    return list;
  }, [projects, localSearch, ownerMap]);

  const groupedProjects = useMemo(
    () => groupProjectsByOwner(filtered, ownerMap, sort),
    [filtered, ownerMap, sort],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="프로젝트명, 담당자, 부서 검색..."
            className="border-slate-200 pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={sort}
            onValueChange={(value) => setSort((value ?? "updated") as SortKey)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">최근 수정순</SelectItem>
              <SelectItem value="name">이름순</SelectItem>
              <SelectItem value="progress">진행률순</SelectItem>
              <SelectItem value="end_date">마감일순</SelectItem>
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <Button
              type="button"
              size="sm"
              variant={view === "table" ? "default" : "ghost"}
              className={cn(
                "h-8 gap-1.5 px-2.5",
                view === "table" && "bg-brand-navy hover:bg-brand-navy-dark",
              )}
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">목록</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "grid" ? "default" : "ghost"}
              className={cn(
                "h-8 gap-1.5 px-2.5",
                view === "grid" && "bg-brand-navy hover:bg-brand-navy-dark",
              )}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">카드</span>
            </Button>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="surface-card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="h-4 w-4 text-brand-navy" />
            <span>
              담당자 <strong className="text-slate-900">{groupedProjects.length}명</strong>
              {" · "}
              프로젝트 <strong className="text-slate-900">{filtered.length}건</strong>
              {localSearch ? (
                <span className="text-slate-400"> (전체 {projects.length}건)</span>
              ) : null}
            </span>
          </div>

          {groupedProjects.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {groupedProjects.map((group) => (
                <button
                  key={group.ownerId ?? "unassigned"}
                  type="button"
                  onClick={() => scrollToOwnerSection(group.ownerId)}
                  className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-brand-navy hover:text-white hover:ring-brand-navy"
                >
                  {group.ownerLabel.split("(")[0]?.trim() ?? group.ownerLabel}
                  <span className="ml-1 opacity-70">{group.projects.length}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <p className="text-sm font-medium text-slate-600">
            {projects.length === 0
              ? "등록된 프로젝트가 없습니다."
              : "검색 결과가 없습니다."}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            필터를 조정하거나 새 프로젝트를 등록해 보세요.
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="space-y-6">
          {groupedProjects.map((group, index) => (
            <ProjectOwnerSection
              key={group.ownerId ?? "unassigned"}
              group={group}
              index={index}
              avatarUrl={group.ownerId ? avatarMap[group.ownerId] : null}
              canEditAvatar={canEditOwnerAvatar(session, group.ownerId)}
              onAvatarChange={
                group.ownerId
                  ? (avatarUrl) => handleAvatarChange(group.ownerId as string, avatarUrl)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <ProjectListTable
          groups={groupedProjects}
          avatarMap={avatarMap}
          session={session}
          onAvatarChange={handleAvatarChange}
        />
      )}
    </div>
  );
}
