import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-foreground/8">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Est. 2024 · Việt Nam
            </p>
            <h2 className="mt-6 font-serif text-6xl font-light leading-[0.9] tracking-tight text-foreground md:text-7xl lg:text-[8rem]">
              DuHoc<span className="text-[color:var(--umber)]">/24</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-foreground/60">
              Tư vấn hồ sơ du học, rõ ràng từ báo giá đến xét duyệt. Đồng hành
              cùng học viên từ bước chọn trường đến khi hoàn tất hồ sơ.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
                  Liên hệ
                </p>
                <ul className="mt-5 space-y-3 text-sm text-foreground/80">
                  <li className="flex items-center gap-2.5">
                    <Mail className="size-3.5 stroke-[1.2] text-foreground/50" />
                    <span>hotro@duhoc24.vn</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone className="size-3.5 stroke-[1.2] text-foreground/50" />
                    <span className="tabular-nums">1900 636 999</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <MapPin className="size-3.5 stroke-[1.2] text-foreground/50" />
                    <span>Quận 1, TP. Hồ Chí Minh</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
                  Liên kết
                </p>
                <ul className="mt-5 space-y-3 text-sm">
                  <li>
                    <Link
                      href="/"
                      className="text-foreground/80 transition-colors duration-500 hover:text-[color:var(--umber)]"
                    >
                      Trang chủ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-foreground/80 transition-colors duration-500 hover:text-[color:var(--umber)]"
                    >
                      Điểm chuẩn các trường
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/portal"
                      className="text-foreground/80 transition-colors duration-500 hover:text-[color:var(--umber)]"
                    >
                      Cổng hồ sơ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-foreground/8 pt-6 text-xs text-foreground/50 sm:flex-row sm:items-center">
          <p>&copy; 2026 DuHoc24. Website mẫu dùng cho mục đích đào tạo.</p>
          <p className="font-mono tracking-wider">v1.0 · editorial luxe</p>
        </div>
      </div>
    </footer>
  );
}
