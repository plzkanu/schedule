import { NextResponse } from "next/server";
import { requireApiSession, requireApiWriter } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createReview, listReviews } from "@/lib/reviews";
import type {
  ReviewFilters,
  ReviewCategory,
  ReviewInput,
  ReviewPriority,
  ReviewStatus,
} from "@/lib/review-types";

function getParam(value: string | null) {
  return value ?? undefined;
}

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase 설정이 필요합니다." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const filters: ReviewFilters = {
    category: getParam(searchParams.get("category")) as ReviewCategory | undefined,
    status: getParam(searchParams.get("status")) as ReviewStatus | undefined,
    priority: getParam(searchParams.get("priority")) as ReviewPriority | undefined,
    reviewer_id: getParam(searchParams.get("reviewer_id")),
    search: getParam(searchParams.get("search")),
  };

  const { data, error } = await listReviews(filters);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}

export async function POST(request: Request) {
  const session = await requireApiWriter();
  if (session instanceof NextResponse) {
    return session;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase 설정이 필요합니다." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as Partial<ReviewInput>;
    const { data, error } = await createReview({
      title: body.title ?? "",
      description: body.description,
      category: body.category ?? "기타",
      status: body.status ?? "접수",
      priority: body.priority ?? "중",
      request_department: body.request_department,
      requester_id: body.requester_id,
      reviewer_id: body.reviewer_id,
      requested_date: body.requested_date ?? "",
      target_date: body.target_date ?? "",
      review_summary: body.review_summary,
      scope: body.scope,
      notes: body.notes,
      project_id: body.project_id,
    });

    if (error) {
      const status = error.includes("입력") || error.includes("형식") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "검토 등록 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
