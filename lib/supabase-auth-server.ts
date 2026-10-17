import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client cho server component / route handler.
 * Dùng publishable key (giống browser) để đọc session từ cookie.
 * KHÔNG dùng để query bảng — dùng getAdminClient() (sb_secret_) cho việc đó.
 */
export async function getAuthServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components không set được cookie — ignore (middleware handles refresh)
          }
        },
      },
    },
  );
}

/**
 * Convenience: lấy user hiện tại hoặc null.
 */
export async function getCurrentUser() {
  const supabase = await getAuthServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
