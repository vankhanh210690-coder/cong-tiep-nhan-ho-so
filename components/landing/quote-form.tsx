"use client";

import React from "react";
import { Check, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  countries,
  servicePackages,
  type ServicePackage,
} from "@/lib/mock-data";

const degreeLevels = [
  { value: "thpt", label: "THPT" },
  { value: "dai_hoc", label: "Đại học" },
  { value: "thac_si", label: "Thạc sĩ" },
];

function formatVnd(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

export function QuoteForm() {
  const [customerName, setCustomerName] = React.useState<string>("");
  const [country, setCountry] = React.useState<string>("");
  const [degreeLevel, setDegreeLevel] = React.useState<string>("dai_hoc");
  const [selectedPackage, setSelectedPackage] =
    React.useState<ServicePackage>("co_ban");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const chosenPackage = servicePackages.find((p) => p.id === selectedPackage)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!customerName.trim()) {
      setErrorMsg("Vui lòng nhập họ tên của bạn.");
      return;
    }
    if (!country) {
      setErrorMsg("Vui lòng chọn quốc gia muốn du học.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          country,
          degree: degreeLevel,
          package: selectedPackage,
          email,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Có lỗi xảy ra, bạn thử lại nhé.");
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMsg("Không kết nối được, kiểm tra mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="bao-gia" className="scroll-mt-32 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left: editorial copy */}
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Bước 01 — Báo giá
            </p>
            <h2 className="mt-5 font-serif text-5xl font-light leading-[0.95] tracking-tight text-foreground md:text-6xl">
              Nhận báo giá
              <br />
              <span className="font-medium text-[color:var(--umber)]">tức thì</span>.
            </h2>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-foreground/70">
              Chọn quốc gia, bậc học và gói dịch vụ. Báo giá sẽ gửi vào email
              trong vài giây, kèm chi tiết quyền lợi từng gói.
            </p>
            <ul className="mt-10 space-y-4">
              {[
                "Không ẩn phí, không fine-print",
                "Chi tiết quyền lợi từng gói rõ ràng",
                "Email gửi tự động trong < 1 phút",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-start gap-3 text-sm text-foreground/80"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--sage)]/15 text-[color:var(--sage)]">
                    <Check className="size-3 stroke-[2]" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: form — Double-Bezel */}
          <div className="lg:col-span-7">
            <div className="rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/8">
              <form
                onSubmit={handleSubmit}
                className="space-y-8 rounded-[calc(2rem-0.375rem)] bg-background p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] md:p-8"
              >
                {/* Country */}
                <div className="space-y-3">
                  <label
                    htmlFor="country"
                    className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60"
                  >
                    Quốc gia muốn du học
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {countries.map((c) => {
                      const active = country === c;
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setCountry(c)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-foreground/15 bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground",
                          )}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Degree */}
                <div className="space-y-3">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60">
                    Bậc học
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {degreeLevels.map((level) => {
                      const active = degreeLevel === level.value;
                      return (
                        <button
                          type="button"
                          key={level.value}
                          onClick={() => setDegreeLevel(level.value)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                            active
                              ? "border-foreground bg-foreground text-background"
                              : "border-foreground/15 bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground",
                          )}
                        >
                          {level.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Packages — Double-Bezel */}
                <div className="space-y-3">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60">
                    Gói dịch vụ
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {servicePackages.map((pkg) => {
                      const active = selectedPackage === pkg.id;
                      return (
                        <button
                          type="button"
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg.id)}
                          className={cn(
                            "group relative rounded-2xl border p-5 text-left transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                            active
                              ? "border-[color:var(--umber)] bg-[color:var(--umber)]/5 shadow-lg shadow-[color:var(--umber)]/10"
                              : "border-foreground/10 bg-background hover:border-foreground/25",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "font-mono text-[0.6rem] uppercase tracking-[0.3em]",
                                active
                                  ? "text-[color:var(--umber)]"
                                  : "text-foreground/50",
                              )}
                            >
                              Gói {pkg.name}
                            </span>
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full transition-all duration-500",
                                active
                                  ? "bg-[color:var(--umber)] text-background"
                                  : "bg-foreground/8 text-transparent",
                              )}
                            >
                              <Check className="size-3 stroke-[2.5]" />
                            </span>
                          </div>
                          <p className="mt-3 font-serif text-3xl font-light tabular-nums tracking-tight text-foreground">
                            {formatVnd(pkg.price)}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-foreground/60">
                            {pkg.description}
                          </p>
                          <ul className="mt-4 space-y-2 border-t border-foreground/8 pt-4">
                            {pkg.benefits.map((benefit) => (
                              <li
                                key={benefit}
                                className="flex items-start gap-2 text-xs text-foreground/70"
                              >
                                <Check className="mt-0.5 size-3 shrink-0 stroke-[2] text-[color:var(--sage)]" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Họ tên */}
                <div className="space-y-2">
                  <label
                    htmlFor="customer_name"
                    className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60"
                  >
                    Họ và tên
                  </label>
                  <input
                    id="customer_name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-4 text-sm outline-none transition-all duration-500 placeholder:text-foreground/40 focus:border-[color:var(--umber)] focus:ring-4 focus:ring-[color:var(--umber)]/10"
                  />
                </div>

                {/* Contact */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60"
                    >
                      Email liên hệ
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="ban@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-4 text-sm outline-none transition-all duration-500 placeholder:text-foreground/40 focus:border-[color:var(--umber)] focus:ring-4 focus:ring-[color:var(--umber)]/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="phone"
                      className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60"
                    >
                      Số điện thoại
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="09xx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-4 text-sm tabular-nums outline-none transition-all duration-500 placeholder:text-foreground/40 focus:border-[color:var(--umber)] focus:ring-4 focus:ring-[color:var(--umber)]/10"
                    />
                  </div>
                </div>

                {/* Submit — Button-in-Button */}
                <button
                  type="submit"
                  disabled={loading || submitted}
                  className="group relative inline-flex w-full items-center justify-between gap-2 rounded-full bg-foreground py-2 pl-6 pr-2 text-sm font-medium text-background shadow-xl shadow-foreground/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
                >
                  <span>
                    {loading ? "Đang gửi..." : submitted ? "Đã gửi báo giá" : "Nhận báo giá"}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-full bg-background/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:bg-background/25">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    >
                      <path
                        d="M7 17L17 7M9 7h8v8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {/* Error */}
                {errorMsg && (
                  <p role="alert" className="mt-3 text-sm text-[color:var(--destructive)]">
                    {errorMsg}
                  </p>
                )}

                {/* Result */}
                {submitted && (
                  <div className="anim-rise mt-2 overflow-hidden rounded-2xl border border-[color:var(--sage)]/25 bg-[color:var(--sage)]/5 p-6">
                    <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/60">
                      Mức giá dự kiến
                    </p>
                    <p className="mt-3 font-serif text-5xl font-light tabular-nums tracking-tight text-foreground">
                      {formatVnd(chosenPackage.price)}
                    </p>
                    <div className="mt-5 flex items-start gap-2.5 text-sm text-foreground/80">
                      <Mail className="mt-0.5 size-4 shrink-0 stroke-[1.3] text-[color:var(--sage)]" />
                      <span>
                        Báo giá đã được gửi qua email, đội ngũ sẽ liên hệ trong
                        24h.
                      </span>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
