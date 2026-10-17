import { NextRequest, NextResponse } from "next/server";

const PORTAL_COOKIE = "portal_sid";
const PORTAL_COOKIE_TTL = 60 * 60 * 24 * 90; // 90 ngày

/**
 * Middleware xử lý 2 việc:
 * 1. /admin/* + /api/admin/* → Basic Auth qua ADMIN_PASSWORD env (nếu set)
 * 2. /portal + /api/portal/* → ensure cookie portal_sid tồn tại
 *    (Server Component không set cookie được trong Next 16 → phải làm ở middleware)
 */
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // --- Portal: ensure cookie portal_sid ---
  const isPortal = pathname.startsWith("/portal") || pathname.startsWith("/api/portal");
  if (isPortal) {
    const existing = req.cookies.get(PORTAL_COOKIE)?.value;
    if (!existing) {
      const newSid = crypto.randomUUID();
      const response = NextResponse.next();
      response.cookies.set({
        name: PORTAL_COOKIE,
        value: newSid,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: PORTAL_COOKIE_TTL,
        path: "/",
      });
      return response;
    }
    return NextResponse.next();
  }

  // --- Admin basic auth ---
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const [user, pass] = decoded.split(":");
      if (user === username && pass === password) {
        return NextResponse.next();
      }
    } catch {
      // malformed → fall through to 401
    }
  }

  return new NextResponse("Yêu cầu đăng nhập quản trị", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="DuHoc24 Admin", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/portal", "/api/portal/:path*"],
};
