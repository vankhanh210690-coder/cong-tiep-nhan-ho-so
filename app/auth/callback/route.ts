import { NextResponse } from "next/server";
import { getAuthServerClient } from "@/lib/supabase-auth-server";

export const runtime = "nodejs";

/**
 * Xử lý magic link callback từ Supabase Auth.
 * Supabase redirect về đây với ?code=... → exchange lấy session → redirect vào /portal
 */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/portal";

  if (code) {
    const supabase = await getAuthServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Auth exchange error:", error.message);
  }

  // Fail → về /login với query báo lỗi
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
