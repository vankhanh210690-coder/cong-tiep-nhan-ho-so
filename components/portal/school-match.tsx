import { Check, X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { School } from "@/lib/mock-data";

export interface SchoolMatchItem {
  school: School;
  passed: boolean | null; // null = chưa có đủ dữ liệu để chấm
  reasons?: string[];     // vd ["GPA 7.0 < yêu cầu 7.5"]
}

export function SchoolMatch({
  matches,
  hasStudentData,
}: {
  matches: SchoolMatchItem[];
  hasStudentData: boolean;
}) {
  const passed = matches.filter((m) => m.passed === true).length;
  const total = matches.length;

  return (
    <div className="rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/8">
      <div className="rounded-[calc(2rem-0.375rem)] bg-background p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground/10 pb-5">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Đối chiếu điểm chuẩn
            </p>
            <h3 className="mt-2 font-serif text-2xl font-light tracking-tight">
              {total} trường tham chiếu
            </h3>
          </div>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground/50 tabular-nums">
            {hasStudentData
              ? `${passed} / ${total} đạt`
              : "Cần upload bảng điểm + IELTS"}
          </span>
        </div>

        {!hasStudentData && (
          <div className="mt-5 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/70">
            Danh sách trường + điểm chuẩn lấy từ hệ thống. Khi bạn upload đủ
            <strong> bảng điểm (GPA)</strong> và <strong>chứng chỉ IELTS</strong>{" "}
            ở trên, mỗi trường sẽ hiện trạng thái <em>đạt / chưa đạt</em>.
          </div>
        )}

        <div className="mt-6 space-y-3">
          {matches.map(({ school, passed, reasons }) => (
            <div
              key={school.id}
              className={cn(
                "group flex items-center justify-between gap-4 rounded-2xl border p-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                passed === true
                  ? "border-[color:var(--sage)]/30 bg-[color:var(--sage)]/5"
                  : passed === false
                    ? "border-foreground/10 bg-foreground/[0.02]"
                    : "border-foreground/8 bg-background",
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full ring-1",
                    passed === true
                      ? "bg-[color:var(--sage)]/15 text-[color:var(--sage)] ring-[color:var(--sage)]/25"
                      : passed === false
                        ? "bg-foreground/8 text-foreground/40 ring-foreground/10"
                        : "bg-foreground/5 text-foreground/30 ring-foreground/8",
                  )}
                >
                  {passed === true ? (
                    <Check className="size-4 stroke-[1.8]" />
                  ) : passed === false ? (
                    <X className="size-4 stroke-[1.8]" />
                  ) : (
                    <HelpCircle className="size-4 stroke-[1.4]" />
                  )}
                </span>
                <div>
                  <p className="font-serif text-lg font-medium text-foreground">
                    {school.name}
                  </p>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground/50">
                    {school.country}
                  </p>
                  {reasons && reasons.length > 0 && (
                    <p className="mt-1 text-xs text-[color:var(--destructive)]">
                      {reasons.join(" · ")}
                    </p>
                  )}
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
