import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getUnreadWeeklyWorkCommentCount } from "@/lib/weekly-work-comments";

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) {
    return session;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ count: 0 });
  }

  const { data, error } = await getUnreadWeeklyWorkCommentCount(session);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ count: data });
}
