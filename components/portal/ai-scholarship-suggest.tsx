"use client";

import React from "react";
import { Sparkles, Award } from "lucide-react";

export function AIScholarshipSuggest({ passedCount }: { passedCount: number }) {
  const [loading, setLoading] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/suggest-scholarships", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Có lỗi xảy ra");
        return;
      }
      setSuggestion(data.suggestion);
    } catch {
      setError("Không kết nối được, thử lại nhé");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[2rem] bg-[color:var(--umber)]/5 p-2 ring-1 ring-[color:var(--umber)]/20">
      <div className="rounded-[calc(2rem-0.375rem)] bg-background p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/10 pb-5">
          <div>
            <p className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--umber)]">
              <Award className="size-3.5 stroke-[1.6]" />
              Gợi ý học bổng từ AI
            </p>
            <h3 className="mt-2 font-serif text-2xl font-light tracking-tight">
              AI tra cứu học bổng phù hợp
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/70">
              AI sẽ dựa trên hồ sơ của bạn (GPA, IELTS) và {passedCount} trường
              bạn đã đạt để tra cứu học bổng + gợi ý những học bổng bạn có khả
              năng nhận được.
            </p>
          </div>
          <button
            onClick={handleClick}
            disabled={loading}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--umber)] py-2.5 pl-5 pr-2 text-sm font-medium text-white shadow-lg shadow-[color:var(--umber)]/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[color:var(--umber)]/90 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{loading ? "AI đang tra cứu..." : suggestion ? "Hỏi AI lại" : "Hỏi AI gợi ý"}</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-white/15 transition-all duration-500 group-hover:translate-x-0.5 group-hover:bg-white/25">
              <Sparkles
                className={`size-3.5 stroke-[1.5] ${loading ? "animate-pulse" : ""}`}
              />
            </span>
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-[color:var(--destructive)]/25 bg-[color:var(--destructive)]/5 p-4 text-sm text-[color:var(--destructive)]">
            {error}
          </div>
        )}

        {suggestion && (
          <div className="mt-6 rounded-xl border border-[color:var(--umber)]/15 bg-[color:var(--umber)]/5 p-5">
            <p className="mb-3 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--umber)]">
              <Sparkles className="size-3 stroke-[1.6]" />
              Phản hồi của AI
            </p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {suggestion}
            </div>
          </div>
        )}

        {!suggestion && !error && !loading && (
          <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-wider text-foreground/40">
            Bấm nút để AI tra cứu và gợi ý
          </p>
        )}
      </div>
    </div>
  );
}
