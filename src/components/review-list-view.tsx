import type { Review } from "@/lib/review-types";
import { ReviewCard } from "@/components/review-card";

interface ReviewListViewProps {
  items: Review[];
  userNames: Record<string, string>;
}

export function ReviewListView({ items, userNames }: ReviewListViewProps) {
  if (items.length === 0) {
    return (
      <div className="surface-card py-16 text-center">
        <p className="text-sm font-medium text-slate-600">
          등록된 검토 항목이 없습니다
        </p>
        <p className="mt-1 text-xs text-slate-400">
          프로젝트화 이전 검토·요청 사항을 등록해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <ReviewCard
          key={item.id}
          item={item}
          reviewerName={
            item.reviewer_id
              ? (userNames[item.reviewer_id] ?? item.reviewer_id)
              : "미지정"
          }
          requesterName={
            item.requester_id
              ? (userNames[item.requester_id] ?? item.requester_id)
              : "미지정"
          }
        />
      ))}
    </div>
  );
}
