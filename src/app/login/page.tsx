import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { BarChart3, CalendarRange, Shield } from "lucide-react";

function LoginFormFallback() {
  return (
    <div className="flex h-80 w-full max-w-md items-center justify-center rounded-2xl bg-white text-sm text-slate-500 shadow-card">
      로딩 중...
    </div>
  );
}

const FEATURES = [
  {
    icon: BarChart3,
    title: "경영진 대시보드",
    desc: "KPI·차트로 프로젝트 현황을 한눈에",
  },
  {
    icon: CalendarRange,
    title: "Gantt 일정관리",
    desc: "드래그로 태스크 기간을 즉시 조정",
  },
  {
    icon: Shield,
    title: "역할 기반 접근",
    desc: "IT팀·경영진 권한을 분리 운영",
  },
];

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* 브랜드 패널 */}
      <div className="relative hidden w-[44%] overflow-hidden bg-brand-navy lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#009ada40,_transparent_50%),radial-gradient(circle_at_bottom_left,_#ffffff10,_transparent_40%)]"
        />
        <div className="relative px-10 pt-12">
          <BrandLogo variant="light" size="lg" subtitle="IT 프로젝트 현황 · 일정관리" />
        </div>
        <div className="relative space-y-6 px-10 pb-12">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-5 w-5 text-brand-cyan" />
                </div>
                <div>
                  <p className="font-semibold text-white">{feature.title}</p>
                  <p className="mt-0.5 text-sm text-white/65">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="relative px-10 pb-8 text-xs text-white/40">
          © SOOSAN. All rights reserved.
        </p>
      </div>

      {/* 로그인 폼 */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f4f8] px-4 py-12">
        <div className="mb-8 lg:hidden">
          <BrandLogo size="lg" />
        </div>
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
