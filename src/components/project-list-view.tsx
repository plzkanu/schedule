"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { LayoutGrid, List, Search } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { PriorityBadge } from "@/components/priority-badge";
import { ProgressBar } from "@/components/progress-bar";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@/lib/project-types";
import { sortProjectsForList } from "@/lib/project-sort";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "grid";
type SortKey = "updated" | "name" | "progress" | "end_date";

interface ProjectListViewProps {
  projects: Project[];
  ownerMap: Record<string, string>;
}

function formatDateLabel(value: string) {
  return format(new Date(`${value}T00:00:00`), "yyyy-MM-dd");
}

export function ProjectListView({ projects, ownerMap }: ProjectListViewProps) {
  const [view, setView] = useState<ViewMode>("table");
  const [sort, setSort] = useState<SortKey>("updated");
  const [localSearch, setLocalSearch] = useState("");

  const filtered = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    let list = projects;
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.department ?? "").toLowerCase().includes(q) ||
          (p.owner_id ? (ownerMap[p.owner_id] ?? "").toLowerCase().includes(q) : false),
      );
    }
    return sortProjectsForList(list, (a, b) => {
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
  }, [projects, localSearch, sort, ownerMap]);

  return (
    <div className="space-y-4">
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
                "h-8 px-2",
                view === "table" && "bg-brand-navy hover:bg-brand-navy-dark",
              )}
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === "grid" ? "default" : "ghost"}
              className={cn(
                "h-8 px-2",
                view === "grid" && "bg-brand-navy hover:bg-brand-navy-dark",
              )}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          {filtered.length}건
          {localSearch ? ` (전체 ${projects.length}건 중)` : ""}
        </span>
      </div>

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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              ownerName={
                project.owner_id
                  ? (ownerMap[project.owner_id] ?? "담당자 미지정")
                  : "미지정"
              }
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto surface-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead>프로젝트</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>우선순위</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>진행률</TableHead>
                <TableHead>담당자</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => (
                <TableRow
                  key={project.id}
                  className="transition hover:bg-slate-50/80"
                >
                  <TableCell className="max-w-[240px]">
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
                  <TableCell>
                    <ProjectStatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={project.priority} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {formatDateLabel(project.start_date)} ~{" "}
                    {formatDateLabel(project.end_date)}
                  </TableCell>
                  <TableCell className="min-w-[130px]">
                    <ProgressBar value={project.progress} showLabel />
                  </TableCell>
                  <TableCell className="text-sm">
                    {project.owner_id
                      ? (ownerMap[project.owner_id] ?? "담당자 미지정")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
