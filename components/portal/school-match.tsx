import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { School } from "@/lib/mock-data";

export function SchoolMatch({
  matches,
}: {
  matches: { school: School; passed: boolean }[];
}) {
  return (
    <div className="rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/8">
      <div className="rounded-[calc(2rem-0.375rem)] bg-background p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground/10 pb-5">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Đối chiếu điểm chuẩn
            </p>
            <h3 className="mt-2 font-serif text-2xl font-light tracking-tight">
              So sánh với từng trường
            </h3>
          </div>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground/50 tabular-nums">
            {matches.filter((m) => m.passed).length} / {matches.length} đạt
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {matches.map(({ school, passed }) => (
            <div
              key={school.id}
              className={cn(
                "group flex items-center justify-between gap-4 rounded-2xl border p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                passed
                  ? "border-[color:var(--sage)]/30 bg-[color:var(--sage)]/5"
                  : "border-foreground/10 bg-foreground/[0.02]",
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full ring-1",
                    passed
                      ? "bg-[color:var(--sage)]/15 text-[color:var(--sage)] ring-[color:var(--sage)]/25"
                      : "bg-foreground/8 text-foreground/40 ring-foreground/10",
                  )}
                >
                  {passed ? (
                    <Check className="size-4 stroke-[1.8]" />
                  ) : (
                    <X className="size-4 stroke-[1.8]" />
                  )}
                </span>
                <div>
                  <p className="font-serif text-lg font-medium text-foreground">
                    {school.name}
                  </p>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground/50">
                    {school.country}
                  </p>
                </div>
              </div>
              <div className="text-right font-mono text-[0.7rem] uppercase tracking-wider tabular-nums text-foreground/60">
                <p>GPA ≥ {school.minGpa.toFixed(1)}</p>
                <p>IELTS ≥ {school.minIelts.toFixed(1)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
