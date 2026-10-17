import { Check, X, HelpCircle, Trophy, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { School } from "@/lib/mock-data";

export interface SchoolMatchItem {
  school: School;
  passed: boolean | null; // null = chưa có đủ dữ liệu
  reasons?: string[];
}

export function SchoolMatch({
  matches,
  hasStudentData,
}: {
  matches: SchoolMatchItem[];
  hasStudentData: boolean;
}) {
  const passed = matches.filter((m) => m.passed === true);
  const failed = matches.filter((m) => m.passed === false);
  const pending = matches.filter((m) => m.passed === null);
  const total = matches.length;

  return (
    <div className="rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/8">
      <div className="rounded-[calc(2rem-0.375rem)] bg-background p-6 md:p-8">
        {/* Header với counter nổi bật */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-6">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Đối chiếu điểm chuẩn
            </p>
            <h3 className="mt-2 font-serif text-2xl font-light tracking-tight">
              So sánh với {total} trường
            </h3>
          </div>
          {hasStudentData ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--sage)]/15 px-4 py-2 ring-1 ring-[color:var(--sage)]/30">
                <Trophy className="size-4 stroke-[1.6] text-[color:var(--sage)]" />
                <span className="font-serif text-2xl font-medium tabular-nums text-[color:var(--sage)]">
                  {passed.length}
                </span>
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[color:var(--sage)]">
                  / {total} ĐẠT
                </span>
              </span>
            </div>
          ) : (
            <span className="rounded-full bg-foreground/8 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-foreground/60">
              Cần upload bảng điểm + IELTS
            </span>
          )}
        </div>

        {!hasStudentData && (
          <div className="mt-5 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/70">
            Danh sách trường + điểm chuẩn lấy từ hệ thống. Khi bạn upload đủ{" "}
            <strong>bảng điểm (GPA)</strong> và <strong>chứng chỉ IELTS</strong>{" "}
            ở trên, mỗi trường sẽ hiện trạng thái <em>đạt / chưa đạt</em>.
          </div>
        )}

        {/* NHÓM 1 — ĐẠT (sort trước, nhấn mạnh) */}
        {passed.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[color:var(--sage)] text-background">
                <Check className="size-3.5 stroke-[2.5]" />
              </span>
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--sage)]">
                Đạt điều kiện · {passed.length} trường
              </p>
            </div>
            <div className="space-y-2.5">
              {passed.map(({ school }) => (
                <PassRow key={school.id} school={school} />
              ))}
            </div>
          </section>
        )}

        {/* NHÓM 2 — CHƯA ĐẠT */}
        {failed.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-[color:var(--destructive)]/20 text-[color:var(--destructive)]">
                <X className="size-3.5 stroke-[2.5]" />
              </span>
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--destructive)]">
                Chưa đạt · {failed.length} trường
              </p>
            </div>
            <div className="space-y-2.5">
              {failed.map(({ school, reasons }) => (
                <FailRow key={school.id} school={school} reasons={reasons ?? []} />
              ))}
            </div>
          </section>
        )}

        {/* NHÓM 3 — CHƯA CHẤM (khi chưa upload data) */}
        {pending.length > 0 && (
          <section className="mt-6">
            {hasStudentData && (
              <div className="mb-3 flex items-center gap-2">
                <HelpCircle className="size-4 stroke-[1.4] text-foreground/40" />
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/40">
                  Chưa chấm · {pending.length} trường
                </p>
              </div>
            )}
            <div className="space-y-2.5">
              {pending.map(({ school }) => (
                <PendingRow key={school.id} school={school} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* === Row nhánh ĐẠT — xanh sage đậm, badge ĐẠT to === */
function PassRow({ school }: { school: School }) {
  return (
    <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border-2 border-[color:var(--sage)]/40 bg-[color:var(--sage)]/10 p-5 shadow-sm shadow-[color:var(--sage)]/10">
      {/* Thanh dọc bên trái nhấn mạnh */}
      <span className="absolute inset-y-0 left-0 w-1 bg-[color:var(--sage)]" />
      <div className="flex items-center gap-4 pl-2">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--sage)] text-background shadow-md shadow-[color:var(--sage)]/30">
          <Check className="size-6 stroke-[2.5]" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-serif text-xl font-medium text-foreground">
              {school.name}
            </p>
            <span className="rounded-full bg-[color:var(--sage)] px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-background">
              ĐẠT
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground/60">
            {school.country}
          </p>
        </div>
      </div>
      <div className="text-right font-mono text-xs tabular-nums text-foreground/70">
        <p>GPA ≥ {school.minGpa.toFixed(1)}</p>
        <p>IELTS ≥ {school.minIelts.toFixed(1)}</p>
      </div>
    </div>
  );
}

/* === Row nhánh CHƯA ĐẠT — đỏ nhạt, badge + lý do rõ === */
function FailRow({ school, reasons }: { school: School; reasons: string[] }) {
  return (
    <div className="relative flex items-start justify-between gap-4 overflow-hidden rounded-2xl border border-[color:var(--destructive)]/30 bg-[color:var(--destructive)]/[0.04] p-5">
      <span className="absolute inset-y-0 left-0 w-1 bg-[color:var(--destructive)]/60" />
      <div className="flex items-start gap-4 pl-2">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--destructive)]/20 text-[color:var(--destructive)] ring-1 ring-[color:var(--destructive)]/30">
          <X className="size-6 stroke-[2.5]" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-xl font-medium text-foreground">
              {school.name}
            </p>
            <span className="rounded-full bg-[color:var(--destructive)]/15 px-2 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-widest text-[color:var(--destructive)] ring-1 ring-[color:var(--destructive)]/30">
              Chưa đạt
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground/60">
            {school.country}
          </p>
          {reasons.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[color:var(--destructive)]">
              <AlertCircle className="size-3.5 shrink-0 stroke-[1.6]" />
              {reasons.join(" · ")}
            </p>
          )}
        </div>
      </div>
      <div className="text-right font-mono text-xs tabular-nums text-foreground/70">
        <p>GPA ≥ {school.minGpa.toFixed(1)}</p>
        <p>IELTS ≥ {school.minIelts.toFixed(1)}</p>
      </div>
    </div>
  );
}

/* === Row nhánh CHƯA CHẤM — xám nhạt === */
function PendingRow({ school }: { school: School }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-foreground/8 bg-background p-5">
      <div className="flex items-center gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/30 ring-1 ring-foreground/8">
          <HelpCircle className="size-4 stroke-[1.4]" />
        </span>
        <div>
          <p className="font-serif text-lg font-medium text-foreground">
            {school.name}
          </p>
          <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground/50">
            {school.country}
          </p>
        </div>
      </div>
      <div className="text-right font-mono text-[0.7rem] tabular-nums text-foreground/60">
        <p>GPA ≥ {school.minGpa.toFixed(1)}</p>
        <p>IELTS ≥ {school.minIelts.toFixed(1)}</p>
      </div>
    </div>
  );
}
