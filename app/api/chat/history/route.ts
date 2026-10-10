import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "du_sid";
const HISTORY_LIMIT = 10;

/**
 * GET /api/chat/history
 * Đọc cookie du_sid, trả về N message gần nhất cho khung chat khi reload.
 * Không nhận query/body — session_id chỉ lấy từ cookie HttpOnly.
 */
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  // Khách lần đầu / đã xoá cookie → trả empty, không lộ gì
  if (!sessionId) {
    return NextResponse.json({ messages: [] });
  }

  const supabase = getAdminClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!conv) {
    return NextResponse.json({ messages: [] });
  }

  const { data: rows, error } = await supabase
    .from("messages")
    .select("role, text, created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error("Fetch history failed:", error);
    return NextResponse.json({ messages: [] });
  }

  // Reverse → oldest first (để render tự nhiên trong khung chat)
  const messages = (rows ?? [])
    .reverse()
    .map((r) => ({ from: r.role as "user" | "bot", text: r.text }));

  return NextResponse.json({ messages });
}
