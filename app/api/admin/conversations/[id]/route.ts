import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * DELETE /api/admin/conversations/[id]
 * Xoá 1 conversation + CASCADE xoá toàn bộ messages trong đó.
 * Được bảo vệ bởi middleware basic auth khi ADMIN_PASSWORD được set.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Thiếu id" }, { status: 400 });
  }

  // Basic UUID shape check (36 chars with dashes). Prevents random path abuse.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase.from("conversations").delete().eq("id", id);

  if (error) {
    console.error("Delete conversation failed:", error);
    return NextResponse.json({ error: "DB lỗi" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
