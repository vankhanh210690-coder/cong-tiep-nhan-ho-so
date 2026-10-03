"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Trang chủ", href: "/" },
  { name: "Điểm chuẩn", href: "#" },
  { name: "Cổng hồ sơ", href: "/portal" },
  { name: "Admin", href: "/admin" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-6">
        <nav
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full p-1.5 ring-1 ring-foreground/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            scrolled
              ? "bg-background/70 shadow-xl shadow-foreground/5 backdrop-blur-xl"
              : "bg-background/40 backdrop-blur-md",
          )}
        >
          <Link
            href="/"
            aria-label="Về trang chủ"
            className="flex items-center rounded-full px-4 py-1.5 transition-opacity duration-500 hover:opacity-80"
          >
            <Logo />
          </Link>

          <ul className="hidden items-center gap-0.5 text-sm lg:flex">
            {menuItems.map((item) => {
              const active = item.href !== "#" && pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-full px-4 py-2 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      active
                        ? "bg-foreground/8 text-foreground"
                        : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <Link
            href="#bao-gia"
            className="hidden group relative items-center gap-2 rounded-full bg-foreground py-1.5 pl-5 pr-1.5 text-sm text-background transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/90 active:scale-[0.97] lg:inline-flex"
          >
            <span>Nhận báo giá</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-background/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:bg-background/25">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                className="size-3.5"
              >
                <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            className="relative flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/5 lg:hidden"
          >
            <span className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute left-0 right-0 h-px bg-current transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  menuOpen ? "top-1.5 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 right-0 h-px bg-current transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  menuOpen ? "top-1.5 -rotate-45" : "top-full",
                )}
              />
            </span>
          </button>
        </nav>
      </header>

      {/* Mobile fullscreen overlay */}
      <div
        className={cn(
          "fixed inset-0 z-30 flex flex-col items-center justify-center bg-background/85 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] lg:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ul className="flex flex-col items-center gap-4">
          {menuItems.map((item, i) => (
            <li
              key={item.name}
              className={cn(
                "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
                menuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
              )}
              style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : "0ms" }}
            >
              <Link
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="font-serif text-4xl font-medium text-foreground"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
