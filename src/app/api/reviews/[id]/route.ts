import { NextResponse } from "next/server";
import { requireApiSession, requireApiWriter } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { deleteReview, getReview, updateReview } from "@/lib/reviews";
import type { ReviewInput } from "@/lib/review-types";

interface RouteContext {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
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

  const { data, error } = await getReview(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "검토 항목을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(request: Request, { params }: RouteContext) {
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
    const { data, error } = await updateReview(params.id, {
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
      const status =
        error.includes("입력") ||
        error.includes("형식") ||
        error.includes("찾을 수 없")
          ? 400
          : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json(
      { error: "검토 수정 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
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

  const { error } = await deleteReview(params.id);

  if (error) {
    const status = error.includes("찾을 수 없") ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ ok: true });
}
