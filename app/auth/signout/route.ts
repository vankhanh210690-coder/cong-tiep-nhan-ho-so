import { NextResponse } from "next/server";
import { getAuthServerClient } from "@/lib/supabase-auth-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await getAuthServerClient();
  await supabase.auth.signOut();
  const { origin } = new URL(req.url);
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
