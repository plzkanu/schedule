"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  TECH_MATURITIES,
  type TechMaturity,
} from "@/lib/tech-capability-types";
import { cn } from "@/lib/utils";

interface TechStatsBarProps {
  counts: Record<TechMaturity, number>;
  total: number;
}

export function TechStatsBar({ counts, total }: TechStatsBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeMaturity = searchParams.get("maturity") ?? "";

  function handleMaturityClick(maturity: TechMaturity | "") {
    const params = new URLSearchParams(searchParams.toString());
    if (maturity && activeMaturity !== maturity) {
      params.set("maturity", maturity);
    } else {
      params.delete("maturity");
    }
    router.push(`/tech-capabilities?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => handleMaturityClick("")}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-medium transition",
          !activeMaturity
            ? "bg-brand-navy text-white shadow-sm"
            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
        )}
      >
        전체 {total}
      </button>
      {TECH_MATURITIES.map((maturity) => (
        <button
          key={maturity}
          type="button"
          onClick={() => handleMaturityClick(maturity)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition",
            activeMaturity === maturity
              ? "bg-brand-navy text-white shadow-sm"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
          )}
        >
          {maturity} {counts[maturity]}
        </button>
      ))}
    </div>
  );
}
