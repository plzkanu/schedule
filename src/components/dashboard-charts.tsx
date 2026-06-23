"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  CHART_STATUS_COLORS,
  type DashboardData,
} from "@/lib/dashboard";

interface DashboardChartsProps {
  statusDistribution: DashboardData["statusDistribution"];
  statusSummary: DashboardData["statusSummary"];
  ownerDistribution: DashboardData["ownerDistribution"];
  departmentDistribution: DashboardData["departmentDistribution"];
}

type ChartTab = "status" | "owner" | "department";

const TABS: { id: ChartTab; label: string }[] = [
  { id: "status", label: "상태" },
  { id: "owner", label: "담당자" },
  { id: "department", label: "부서" },
];

export function DashboardCharts({
  statusDistribution,
  statusSummary,
  ownerDistribution,
  departmentDistribution,
}: DashboardChartsProps) {
  const [tab, setTab] = useState<ChartTab>("status");

  const statusBarData = statusSummary.filter((item) => item.count > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="surface-card lg:col-span-2">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-800">
            프로젝트 구성
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">상태별 비율</p>
        </div>
        <div className="p-4">
          {statusDistribution.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">
              표시할 데이터가 없습니다.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {statusDistribution.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={CHART_STATUS_COLORS[entry.status]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, props) => {
                    const status = (props.payload as { status?: string })
                      ?.status;
                    return [`${value}건`, status ?? "프로젝트"];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="surface-card lg:col-span-3">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">분석 차트</h2>
            <p className="mt-0.5 text-xs text-slate-500">담당자·부서별 분포</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  tab === item.id
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {tab === "status" ? (
            statusBarData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusBarData} margin={{ top: 8, right: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value}건`, "프로젝트"]} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {statusBarData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={CHART_STATUS_COLORS[entry.status]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          ) : null}

          {tab === "owner" ? (
            ownerDistribution.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={ownerDistribution}
                  layout="vertical"
                  margin={{ left: 4, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => [`${value}건`, "프로젝트"]} />
                  <Bar dataKey="count" fill="#004b87" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : null}

          {tab === "department" ? (
            departmentDistribution.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={departmentDistribution}
                  layout="vertical"
                  margin={{ left: 4, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="department"
                    width={80}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => [`${value}건`, "프로젝트"]} />
                  <Bar dataKey="count" fill="#009ada" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <p className="py-12 text-center text-sm text-slate-500">
      표시할 데이터가 없습니다.
    </p>
  );
}
