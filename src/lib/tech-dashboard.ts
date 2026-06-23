import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import {
  TECH_CATEGORIES,
  TECH_MATURITIES,
  type TechCapability,
  type TechCategory,
  type TechMaturity,
} from "./tech-capability-types";
import { calculateProjectDDay } from "./dashboard";

export interface ApproachingTechCapability extends TechCapability {
  dDay: number;
}

export interface TechDashboardData {
  total: number;
  inProgress: number;
  internalized: number;
  pilotOrAbove: number;
  delayed: number;
  averageProgress: number;
  internalizationRate: number;
  maturitySummary: { maturity: TechMaturity; count: number }[];
  categoryDistribution: { category: TechCategory; count: number }[];
  approachingItems: ApproachingTechCapability[];
}

export function buildTechDashboardData(
  items: TechCapability[],
): TechDashboardData {
  const today = startOfDay(new Date());
  const total = items.length;
  const inProgress = items.filter((item) => item.status === "진행중").length;
  const internalized = items.filter(
    (item) => item.maturity === "내재화완료",
  ).length;
  const pilotOrAbove = items.filter((item) =>
    ["파일럿", "확산", "내재화완료"].includes(item.maturity),
  ).length;
  const delayed = items.filter((item) => item.status === "지연").length;

  const averageProgress =
    total === 0
      ? 0
      : Math.round(
          items.reduce((sum, item) => sum + item.progress, 0) / total,
        );

  const internalizationRate =
    total === 0 ? 0 : Math.round((internalized / total) * 100);

  const maturitySummary = TECH_MATURITIES.map((maturity) => ({
    maturity,
    count: items.filter((item) => item.maturity === maturity).length,
  }));

  const categoryDistribution = TECH_CATEGORIES.map((category) => ({
    category,
    count: items.filter((item) => item.category === category).length,
  })).filter((item) => item.count > 0);

  const approachingItems = items
    .filter((item) => {
      if (item.maturity === "내재화완료" || item.status === "완료") {
        return false;
      }
      const dDay = calculateProjectDDay(item.target_date, today);
      return item.status === "지연" || dDay <= 14;
    })
    .map((item) => ({
      ...item,
      dDay: calculateProjectDDay(item.target_date, today),
    }))
    .sort((a, b) => a.dDay - b.dDay);

  return {
    total,
    inProgress,
    internalized,
    pilotOrAbove,
    delayed,
    averageProgress,
    internalizationRate,
    maturitySummary,
    categoryDistribution,
    approachingItems,
  };
}

export function calculateTechDDay(targetDate: string, today = startOfDay(new Date())) {
  const end = startOfDay(parseISO(targetDate));
  return differenceInCalendarDays(end, today);
}
