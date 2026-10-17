"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client cho browser — DÙNG CHỈ CHO AUTH (login/logout/getSession).
 * KHÔNG query data qua client này. Mọi data read/write đi qua API server.
 *
 * Publishable key an toàn expose ra client (thiết kế cho mục đích này).
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
