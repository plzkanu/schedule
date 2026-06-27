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
  REVIEW_CATEGORIES,
  REVIEW_PRIORITIES,
  REVIEW_STATUSES,
} from "@/lib/review-types";
import type { UserPublic } from "@/lib/types";
import { formatUserDisplayLabel } from "@/lib/user-display";

interface ReviewFiltersProps {
  assignees: UserPublic[];
}

export function ReviewFilters({ assignees }: ReviewFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");

  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const reviewerId = searchParams.get("reviewer_id") ?? "";
  const search = searchParams.get("search") ?? "";

  const activeFilterCount = [category, status, priority, reviewerId, search].filter(Boolean).length;

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  function updateParams(mutator: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    startTransition(() => {
      router.push(`/reviews?${params.toString()}`);
    });
  }

  function updateFilter(key: string, value: string) {
    updateParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  function handleSelectChange(key: string, value: string | null) {
    updateFilter(key, !value || value === "all" ? "" : value);
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFilter("search", searchDraft.trim())}
            placeholder="검토 제목 검색..."
            className="border-slate-200 pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => updateFilter("search", searchDraft.trim())} disabled={isPending}>
            검색
          </Button>
          <Button type="button" variant="outline" onClick={() => setExpanded((p) => !p)} className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            필터
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-brand-navy px-1.5 py-0.5 text-[10px] text-white">
                {activeFilterCount}
              </span>
            ) : null}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>분류</Label>
            <Select value={category || "all"} onValueChange={(v) => handleSelectChange("category", v)}>
              <SelectTrigger><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {REVIEW_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>상태</Label>
            <Select value={status || "all"} onValueChange={(v) => handleSelectChange("status", v)}>
              <SelectTrigger><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {REVIEW_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>우선순위</Label>
            <Select value={priority || "all"} onValueChange={(v) => handleSelectChange("priority", v)}>
              <SelectTrigger><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {REVIEW_PRIORITIES.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>검토 담당자</Label>
            <Select value={reviewerId || "all"} onValueChange={(v) => handleSelectChange("reviewer_id", v)}>
              <SelectTrigger><SelectValue placeholder="전체" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {assignees.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {formatUserDisplayLabel(user.name, user.department)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end lg:col-span-4">
            <Button type="button" variant="outline" onClick={() => startTransition(() => router.push("/reviews"))} disabled={isPending}>
              필터 초기화
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
