import type { TechCapability } from "@/lib/tech-capability-types";
import { TechCapabilityCard } from "@/components/tech-capability-card";

interface TechCapabilityListViewProps {
  items: TechCapability[];
  ownerNames: Record<string, string>;
}

export function TechCapabilityListView({
  items,
  ownerNames,
}: TechCapabilityListViewProps) {
  if (items.length === 0) {
    return (
      <div className="surface-card py-16 text-center">
        <p className="text-sm font-medium text-slate-600">
          등록된 기술 확보 항목이 없습니다
        </p>
        <p className="mt-1 text-xs text-slate-400">
          AI·IT 기술 내재화 계획을 등록해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <TechCapabilityCard
          key={item.id}
          item={item}
          ownerName={
            item.owner_id
              ? (ownerNames[item.owner_id] ?? item.owner_id)
              : "미지정"
          }
        />
      ))}
    </div>
  );
}
