"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email không hợp lệ, bạn kiểm tra lại nhé.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = getBrowserClient();
      const { error: authErr } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authErr) {
        setError(authErr.message);
        return;
      }
      setSent(true);
    } catch {
      setError("Có lỗi xảy ra, bạn thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Back home */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-background px-3 py-1.5 text-xs text-foreground/70 transition-all duration-300 hover:bg-foreground/5"
        >
          <ArrowLeft className="size-3.5 stroke-[1.4]" />
          Trang chủ
        </Link>

        {/* Card */}
        <div className="rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/8">
          <div className="rounded-[calc(2rem-0.375rem)] bg-background p-8 md:p-10">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Cổng hồ sơ · Đăng nhập nhanh
            </p>
            <h1 className="mt-5 font-serif text-4xl font-light leading-[1] tracking-tight text-foreground md:text-5xl">
              Vào cổng
              <br />
              hồ sơ
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-foreground/70">
              Nhập email, DuHoc24 sẽ gửi link đăng nhập qua email. Không cần
              nhớ mật khẩu.
            </p>

            {sent ? (
              <div className="mt-8 rounded-xl border border-[color:var(--sage)]/25 bg-[color:var(--sage)]/5 p-5">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 stroke-[1.4] text-[color:var(--sage)]" />
                  <div>
                    <p className="text-sm font-medium">Đã gửi link đăng nhập!</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                      Mở hộp thư <strong>{email}</strong> và bấm vào link để
                      vào cổng hồ sơ. Link có hiệu lực trong 1 giờ.
                    </p>
                    <p className="mt-3 text-xs text-foreground/50">
                      Không thấy email? Kiểm tra thư mục Spam, hoặc{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setSent(false);
                          setEmail("");
                        }}
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        gửi lại
                      </button>
                      .
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60"
                  >
                    Email của bạn
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="ban@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    className="mt-2 h-12 w-full rounded-xl border border-foreground/15 bg-background px-4 text-sm outline-none transition-all duration-500 placeholder:text-foreground/40 focus:border-[color:var(--umber)] focus:ring-4 focus:ring-[color:var(--umber)]/10 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-[color:var(--destructive)]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex w-full items-center justify-between gap-2 rounded-full bg-foreground py-2 pl-6 pr-2 text-sm font-medium text-background shadow-xl shadow-foreground/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>{loading ? "Đang gửi..." : "Gửi link đăng nhập"}</span>
                  <span className="flex size-9 items-center justify-center rounded-full bg-background/15 transition-all duration-500 group-hover:translate-x-0.5 group-hover:bg-background/25">
                    <Mail className="size-3.5 stroke-[1.5]" />
                  </span>
                </button>
              </form>
            )}

            <p className="mt-6 text-xs leading-relaxed text-foreground/50">
              Khi đăng nhập, bạn đồng ý với điều khoản dịch vụ của DuHoc24.
              Chúng tôi chỉ gửi email liên quan tới hồ sơ của bạn.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
