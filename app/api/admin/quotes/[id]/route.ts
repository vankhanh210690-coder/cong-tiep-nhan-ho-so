import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["cho_duyet", "da_duyet", "tu_choi"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  const status = body.status;
  if (!status || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from("quote_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Update quote status failed:", error);
    return NextResponse.json({ error: "DB lỗi" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
