import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireApiWriter,
} from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  deleteTechCapability,
  getTechCapability,
  updateTechCapability,
} from "@/lib/tech-capabilities";
import type { TechCapabilityInput } from "@/lib/tech-capability-types";

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

  const { data, error } = await getTechCapability(params.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "기술 확보 항목을 찾을 수 없습니다." },
      { status: 404 },
    );
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
    const body = (await request.json()) as Partial<TechCapabilityInput>;
    const { data, error } = await updateTechCapability(params.id, {
      name: body.name ?? "",
      description: body.description,
      category: body.category ?? "기타",
      maturity: body.maturity ?? "탐색",
      status: body.status ?? "계획",
      priority: body.priority ?? "중",
      start_date: body.start_date ?? "",
      target_date: body.target_date ?? "",
      progress: body.progress ?? 0,
      owner_id: body.owner_id,
      department: body.department,
      use_cases: body.use_cases,
      notes: body.notes,
    });

    if (error) {
      const status = error.includes("찾을") ? 404 : error.includes("입력") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json(
      { error: "기술 확보 수정 처리 중 오류가 발생했습니다." },
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

  const { error } = await deleteTechCapability(params.id);

  if (error) {
    const status = error.includes("찾을") ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ ok: true });
}
