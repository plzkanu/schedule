import type { Review } from "./review-types";
import type { ReviewStatus } from "./review-types";

/** 검토 목록: 진행 중 항목 우선 */
export const REVIEW_LIST_STATUS_ORDER: Record<ReviewStatus, number> = {
  검토중: 0,
  접수: 1,
  보완요청: 2,
  승인대기: 3,
  보류: 4,
  반려: 5,
  프로젝트화: 6,
};

export function sortReviewsForList(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => {
    const statusDiff =
      REVIEW_LIST_STATUS_ORDER[a.status] - REVIEW_LIST_STATUS_ORDER[b.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return a.target_date.localeCompare(b.target_date);
  });
}

export function isActiveReview(review: Review) {
  return !["반려", "프로젝트화"].includes(review.status);
}
