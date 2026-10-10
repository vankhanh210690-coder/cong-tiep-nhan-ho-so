import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client dùng sb_secret_ key.
 * KHÔNG expose ra client. Bypass RLS cho mọi query admin.
 *
 * Dùng raw @supabase/supabase-js (không qua @supabase/server adapter)
 * vì Next.js App Router route handler đơn giản hơn, chỉ cần client
 * đã authenticated sẵn với secret key.
 */
let _admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (_admin) return _admin;

  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      "Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong env — không nối được Supabase.",
    );
  }

  _admin = createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _admin;
}

export type ChatRole = "user" | "bot";

export interface ChatMessageRow {
  id: string;
  conversation_id: string;
  role: ChatRole;
  text: string;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  user_agent: string | null;
  ip_hash: string | null;
}
