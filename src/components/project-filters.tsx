"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
} from "@/lib/project-types";
import type { UserPublic } from "@/lib/types";

interface ProjectFiltersProps {
  assignees: UserPublic[];
}

export function ProjectFilters({ assignees }: ProjectFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [searchDraft, setSearchDraft] = useState(
    searchParams.get("search") ?? "",
  );

  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const ownerId = searchParams.get("owner_id") ?? "";
  const progressMin = searchParams.get("progress_min") ?? "";
  const progressMax = searchParams.get("progress_max") ?? "";
  const search = searchParams.get("search") ?? "";

  const activeFilterCount = [
    status,
    priority,
    ownerId,
    progressMin,
    progressMax,
    search,
  ].filter(Boolean).length;

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    startTransition(() => {
      router.push(`/projects?${params.toString()}`);
    });
  }

  function updateFilter(key: string, value: string) {
    updateParams((params) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
  }

  function handleSelectChange(key: string, value: string | null) {
    updateFilter(key, !value || value === "all" ? "" : value);
  }

  function applySearch() {
    updateFilter("search", searchDraft.trim());
  }

  function resetFilters() {
    startTransition(() => {
      router.push("/projects");
    });
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                applySearch();
              }
            }}
            placeholder="프로젝트명 검색 (서버 필터)..."
            className="border-slate-200 pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={applySearch}
            disabled={isPending}
          >
            검색
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setExpanded((prev) => !prev)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            필터
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-brand-navy px-1.5 py-0.5 text-[10px] text-white">
                {activeFilterCount}
              </span>
            ) : null}
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label>상태</Label>
            <Select
              value={status || "all"}
              onValueChange={(value) => handleSelectChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {PROJECT_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>우선순위</Label>
            <Select
              value={priority || "all"}
              onValueChange={(value) => handleSelectChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {PROJECT_PRIORITIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>담당자</Label>
            <Select
              value={ownerId || "all"}
              onValueChange={(value) => handleSelectChange("owner_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {assignees.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>진행률(최소 %)</Label>
            <Select
              value={progressMin || "all"}
              onValueChange={(value) => handleSelectChange("progress_min", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {[0, 25, 50, 75].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}% 이상
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>진행률(최대 %)</Label>
            <Select
              value={progressMax || "all"}
              onValueChange={(value) => handleSelectChange("progress_max", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {[25, 50, 75, 100].map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {value}% 이하
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end lg:col-span-5">
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={isPending}
            >
              필터 초기화
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
