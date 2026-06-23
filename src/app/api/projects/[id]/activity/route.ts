import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { listProjectActivityLogs } from "@/lib/activity-logs";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
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
  const limit = Number(searchParams.get("limit") ?? "30");

  const { data, error } = await listProjectActivityLogs(params.id, limit);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
