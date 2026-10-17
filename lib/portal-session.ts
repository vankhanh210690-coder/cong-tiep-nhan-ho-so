import "server-only";
import { cookies } from "next/headers";
import { getAdminClient } from "@/lib/supabase-server";

export const PORTAL_COOKIE = "portal_sid";

/**
 * Lấy session_id từ cookie (được middleware set trước đó).
 * Idempotent upsert profile row.
 * Server Component dùng được (chỉ đọc cookie, không set).
 */
export async function getPortalSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const sid = cookieStore.get(PORTAL_COOKIE)?.value;
  if (!sid) return null;

  const supabase = getAdminClient();
  await supabase
    .from("student_profiles")
    .upsert({ session_id: sid }, { onConflict: "session_id", ignoreDuplicates: true });

  return sid;
}
