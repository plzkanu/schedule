"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertCircle, FileText, GanttChart, History } from "lucide-react";
import type { ActivityLog } from "@/lib/activity-logs";
import type { ProjectIssue } from "@/lib/issue-types";
import type { Project } from "@/lib/project-types";
import type { TaskWithDependencies } from "@/lib/task-types";
import type { UserPublic } from "@/lib/types";
import { ActivityTimeline } from "@/components/activity-timeline";
import { IssueFormDialog } from "@/components/issue-form-dialog";
import { ProjectDeleteButton } from "@/components/project-delete-button";
import { ProjectDetailHero } from "@/components/project-detail-hero";
import { ProjectGantt } from "@/components/project-gantt";
import { ProjectIssueList } from "@/components/project-issue-list";
import { ProjectScheduleTracker } from "@/components/project-schedule-tracker";
import { ProjectTaskList } from "@/components/project-task-list";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { cn } from "@/lib/utils";

interface ProjectDetailViewProps {
  project: Project;
  initialTasks: TaskWithDependencies[];
  initialIssues: ProjectIssue[];
  initialLogs: ActivityLog[];
  assignees: UserPublic[];
  userNames: Record<string, string>;
  ownerName: string;
  canWrite: boolean;
  currentUserId: string;
}

type DetailTab = "overview" | "schedule" | "issues" | "activity";

const TABS: { id: DetailTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "개요", icon: FileText },
  { id: "schedule", label: "일정 & 태스크", icon: GanttChart },
  { id: "issues", label: "이슈", icon: AlertCircle },
  { id: "activity", label: "활동", icon: History },
];

export function ProjectDetailView({
  project,
  initialTasks,
  initialIssues,
  initialLogs,
  assignees,
  userNames,
  ownerName,
  canWrite,
  currentUserId,
}: ProjectDetailViewProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [issues, setIssues] = useState(initialIssues);
  const [logs, setLogs] = useState(initialLogs);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<TaskWithDependencies>();
  const [highlightTaskId, setHighlightTaskId] = useState<string>();
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueDialogMode, setIssueDialogMode] = useState<"create" | "edit">("create");
  const [editingIssue, setEditingIssue] = useState<ProjectIssue>();

  const refreshData = useCallback(async () => {
    const [tasksRes, issuesRes, logsRes] = await Promise.all([
      fetch(`/api/projects/${project.id}/tasks`),
      fetch(`/api/projects/${project.id}/issues`),
      fetch(`/api/projects/${project.id}/activity`),
    ]);

    if (tasksRes.ok) {
      const tasksData = (await tasksRes.json()) as {
        tasks: TaskWithDependencies[];
      };
      setTasks(tasksData.tasks);
    }

    if (issuesRes.ok) {
      const issuesData = (await issuesRes.json()) as {
        issues: ProjectIssue[];
      };
      setIssues(issuesData.issues);
    }

    if (logsRes.ok) {
      const logsData = (await logsRes.json()) as { logs: ActivityLog[] };
      setLogs(logsData.logs);
    }
  }, [project.id]);

  const taskStats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "완료").length;
    const inProgress = tasks.filter((t) => t.status === "진행중").length;
    const avgProgress =
      tasks.length === 0
        ? 0
        : Math.round(
            tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length,
          );
    return { completed, inProgress, avgProgress };
  }, [tasks]);

  const openIssueCount = useMemo(
    () => issues.filter((issue) => issue.status !== "해결").length,
    [issues],
  );

  function openCreateDialog() {
    setDialogMode("create");
    setEditingTask(undefined);
    setDialogOpen(true);
    setTab("schedule");
  }

  function openEditDialog(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    setDialogMode("edit");
    setEditingTask(task);
    setDialogOpen(true);
  }

  async function handleTaskSuccess(taskId?: string) {
    await refreshData();
    if (taskId) {
      setHighlightTaskId(taskId);
      window.setTimeout(() => setHighlightTaskId(undefined), 4000);
    }
  }

  function openCreateIssueDialog() {
    setIssueDialogMode("create");
    setEditingIssue(undefined);
    setIssueDialogOpen(true);
    setTab("issues");
  }

  function openEditIssueDialog(issueId: string) {
    const issue = issues.find((item) => item.id === issueId);
    if (!issue) {
      return;
    }
    setIssueDialogMode("edit");
    setEditingIssue(issue);
    setIssueDialogOpen(true);
  }

  async function handleIssueSuccess() {
    await refreshData();
  }

  return (
    <div className="space-y-6">
      <ProjectDetailHero
        project={project}
        ownerName={ownerName}
        taskCount={tasks.length}
        canWrite={canWrite}
        onAddTask={openCreateDialog}
      />

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                tab === item.id
                  ? "bg-brand-navy text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.id === "schedule" && tasks.length > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    tab === item.id ? "bg-white/20" : "bg-slate-100",
                  )}
                >
                  {tasks.length}
                </span>
              ) : null}
              {item.id === "issues" && openIssueCount > 0 ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    tab === item.id
                      ? "bg-white/20"
                      : "bg-red-100 text-red-700",
                  )}
                >
                  {openIssueCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <ProjectScheduleTracker project={project} />

            <div className="surface-card p-5">
              <h2 className="text-sm font-semibold text-slate-800">
                프로젝트 개요
              </h2>
              {project.description ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {project.description}
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  등록된 설명이 없습니다.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="surface-card p-4 text-center">
                <p className="text-2xl font-bold text-brand-navy">
                  {tasks.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">전체 태스크</p>
              </div>
              <div className="surface-card p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {taskStats.inProgress}
                </p>
                <p className="mt-1 text-xs text-slate-500">진행중 태스크</p>
              </div>
              <div className="surface-card p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {taskStats.completed}
                </p>
                <p className="mt-1 text-xs text-slate-500">완료 태스크</p>
              </div>
              <div className="surface-card p-4 text-center">
                <p
                  className={cn(
                    "text-2xl font-bold",
                    openIssueCount > 0 ? "text-red-600" : "text-slate-400",
                  )}
                >
                  {openIssueCount}
                </p>
                <p className="mt-1 text-xs text-slate-500">미해결 이슈</p>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <ActivityTimeline logs={logs.slice(0, 8)} userNames={userNames} />
          </div>
        </div>
      ) : null}

      {tab === "schedule" ? (
        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Gantt 일정
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  태스크명 더블클릭 수정 · 우클릭 삭제 · 드래그로 기간 조정
                </p>
              </div>
            </div>
            <ProjectGantt
              projectId={project.id}
              tasks={tasks}
              canWrite={canWrite}
              onTasksChange={refreshData}
              onEditTask={openEditDialog}
              highlightTaskId={highlightTaskId}
              assigneeNames={userNames}
            />
          </div>

          <div className="surface-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">
              태스크 목록
              {canWrite ? (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  클릭 수정 · 우클릭/휴지통 삭제
                </span>
              ) : null}
            </h2>
            <ProjectTaskList
              projectId={project.id}
              tasks={tasks}
              assignees={assignees}
              canWrite={canWrite}
              onEditTask={openEditDialog}
              onTasksChange={refreshData}
            />
          </div>
        </div>
      ) : null}

      {tab === "issues" ? (
        <ProjectIssueList
          issues={issues}
          userNames={userNames}
          canWrite={canWrite}
          onAddIssue={openCreateIssueDialog}
          onEditIssue={openEditIssueDialog}
        />
      ) : null}

      {tab === "activity" ? (
        <ActivityTimeline logs={logs} userNames={userNames} />
      ) : null}

      {canWrite ? (
        <>
          <ProjectDeleteButton
            projectId={project.id}
            projectName={project.name}
          />
          <TaskFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            mode={dialogMode}
            projectId={project.id}
            task={editingTask}
            tasks={tasks}
            assignees={assignees}
            defaultStartDate={project.start_date}
            defaultEndDate={project.end_date}
            onSuccess={handleTaskSuccess}
          />
          <IssueFormDialog
            open={issueDialogOpen}
            onOpenChange={setIssueDialogOpen}
            mode={issueDialogMode}
            projectId={project.id}
            issue={editingIssue}
            assignees={assignees}
            defaultReporterId={currentUserId}
            onSuccess={handleIssueSuccess}
          />
        </>
      ) : null}
    </div>
  );
}
