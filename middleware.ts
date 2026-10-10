import { NextRequest, NextResponse } from "next/server";

/**
 * Bảo vệ /admin bằng Basic Auth qua ADMIN_PASSWORD env.
 * Username cố định: "admin". Mật khẩu: biến ADMIN_PASSWORD trong .env + Vercel.
 */
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  // Bảo vệ cả trang admin lẫn API admin (POST/DELETE từ UI admin)
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    // Nếu chưa cấu hình → cho qua (để không chặn dev)
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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
