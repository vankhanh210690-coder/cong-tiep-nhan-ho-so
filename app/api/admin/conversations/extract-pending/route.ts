import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXTRACT_CONCURRENCY = 3;

/**
 * POST /api/admin/conversations/extract-pending
 * Chạy Gemini extract cho tất cả conversations CHƯA có insight.
 * Chạy song song max 3 request/lượt để không vượt rate limit Gemini.
 */
export async function POST(req: Request) {
  const supabase = getAdminClient();

  // Lấy conversation ids chưa có insight
  const { data: convs, error: cErr } = await supabase
    .from("conversations")
    .select("id, message_count")
    .gt("message_count", 1); // bỏ qua conversation chỉ có greeting

  if (cErr || !convs) {
    return NextResponse.json({ error: "DB lỗi" }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("conversation_insights")
    .select("conversation_id");

  const existingSet = new Set((existing ?? []).map((e) => e.conversation_id));
  const pendingIds = convs
    .filter((c) => !existingSet.has(c.id))
    .map((c) => c.id);

  if (pendingIds.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, total: 0, message: "Tất cả đã có insight" });
  }

  // Gọi endpoint extract đơn (reuse logic). Chạy batch song song concurrency 3.
  const origin = new URL(req.url).origin;
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  async function extractOne(id: string): Promise<void> {
    try {
      const res = await fetch(`${origin}/api/admin/conversations/${id}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        success++;
      } else {
        failed++;
        const txt = await res.text().catch(() => "");
        errors.push(`${id.slice(0, 8)}: ${res.status} ${txt.slice(0, 80)}`);
      }
    } catch (err) {
      failed++;
      errors.push(`${id.slice(0, 8)}: ${(err as Error).message}`);
    }
  }

  // Chia batch
  for (let i = 0; i < pendingIds.length; i += EXTRACT_CONCURRENCY) {
    const batch = pendingIds.slice(i, i + EXTRACT_CONCURRENCY);
    await Promise.all(batch.map(extractOne));
  }

  return NextResponse.json({
    ok: true,
    total: pendingIds.length,
    processed: success,
    failed,
    errors: errors.slice(0, 10),
  });
}
