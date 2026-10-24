import { NextResponse, after } from "next/server";
import { getAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const ALLOWED_STATUSES = ["cho_duyet", "da_duyet", "tu_choi"] as const;

const APPROVAL_WEBHOOK_URL =
  process.env.APPROVAL_WEBHOOK_URL ??
  "https://hook.eu2.make.com/qwbbppmwilchp239iwyt91sc84rqb8gb";

const APPROVAL_LOGIN_URL =
  process.env.APPROVAL_LOGIN_URL ??
  "https://duhoc24hh.vercel.app/login";

async function sendApprovalWebhook(payload: {
  id: string;
  customer_name: string;
  email: string;
  login_url: string;
}) {
  try {
    const res = await fetch(APPROVAL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: payload.id,
        customer_name: payload.customer_name,
        email: payload.email,
        login_url: payload.login_url,
        approved_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      console.error(
        "Approval webhook non-2xx:",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    console.error("Approval webhook failed:", err);
  }
}

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

  const { data: current, error: fetchErr } = await supabase
    .from("quote_requests")
    .select("id, customer_name, email, status")
    .eq("id", id)
    .single();

  if (fetchErr || !current) {
    return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  }

  if (current.status === status) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const { error: updateErr } = await supabase
    .from("quote_requests")
    .update({ status })
    .eq("id", id);

  if (updateErr) {
    console.error("Update quote status failed:", updateErr);
    return NextResponse.json({ error: "DB lỗi" }, { status: 500 });
  }

  if (status === "da_duyet") {
    after(() =>
      sendApprovalWebhook({
        id: current.id,
        customer_name: current.customer_name ?? "",
        email: current.email,
        login_url: APPROVAL_LOGIN_URL,
      }),
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase.from("quote_requests").delete().eq("id", id);

  if (error) {
    console.error("Delete quote failed:", error);
    return NextResponse.json({ error: "DB lỗi" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
