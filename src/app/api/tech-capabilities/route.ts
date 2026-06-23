import { NextResponse } from "next/server";
import {
  requireApiSession,
  requireApiWriter,
} from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createTechCapability,
  listTechCapabilities,
} from "@/lib/tech-capabilities";
import type {
  TechCapabilityFilters,
  TechCategory,
  TechMaturity,
  TechCapabilityInput,
  TechPriority,
  TechStatus,
} from "@/lib/tech-capability-types";

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
  const filters: TechCapabilityFilters = {
    category: getParam(searchParams.get("category")) as TechCategory | undefined,
    maturity: getParam(searchParams.get("maturity")) as TechMaturity | undefined,
    status: getParam(searchParams.get("status")) as TechStatus | undefined,
    priority: getParam(searchParams.get("priority")) as TechPriority | undefined,
    owner_id: getParam(searchParams.get("owner_id")),
    search: getParam(searchParams.get("search")),
  };

  const { data, error } = await listTechCapabilities(filters);

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
    const body = (await request.json()) as Partial<TechCapabilityInput>;
    const { data, error } = await createTechCapability({
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
      const status = error.includes("입력") ? 400 : 500;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "기술 확보 등록 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
