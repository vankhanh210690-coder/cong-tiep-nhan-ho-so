import { Check, X, HelpCircle, Trophy, AlertCircle } from "lucide-react";
import type { School } from "@/lib/mock-data";

export interface SchoolMatchItem {
  school: School;
  passed: boolean | null;
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
        {/* Header */}
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
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 shadow-lg shadow-emerald-600/30">
              <Trophy className="size-4 stroke-[2] text-white" />
              <span className="font-serif text-2xl font-semibold tabular-nums text-white">
                {passed.length}
              </span>
              <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wider text-white">
                / {total} ĐẠT
              </span>
            </span>
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

        {/* NHÓM ĐẠT */}
        {passed.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                <Check className="size-3.5 stroke-[3]" />
              </span>
              <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.3em] text-emerald-700">
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

        {/* NHÓM CHƯA ĐẠT */}
        {failed.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md shadow-red-600/30">
                <X className="size-3.5 stroke-[3]" />
              </span>
              <p className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.3em] text-red-700">
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

        {/* NHÓM PENDING */}
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

/* ===== ĐẠT — xanh emerald vibrant ===== */
function PassRow({ school }: { school: School }) {
  return (
    <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-5 shadow-md shadow-emerald-500/20">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-emerald-600" />
      <div className="flex items-center gap-4 pl-2">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40">
          <Check className="size-6 stroke-[3]" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-serif text-xl font-medium text-emerald-950">
              {school.name}
            </p>
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-white shadow-sm">
              ĐẠT
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-emerald-700/80">
            {school.country}
          </p>
        </div>
      </div>
      <div className="text-right font-mono text-xs tabular-nums text-emerald-900/80">
        <p>GPA ≥ {school.minGpa.toFixed(1)}</p>
        <p>IELTS ≥ {school.minIelts.toFixed(1)}</p>
      </div>
    </div>
  );
}

/* ===== CHƯA ĐẠT — đỏ red vibrant ===== */
function FailRow({ school, reasons }: { school: School; reasons: string[] }) {
  return (
    <div className="relative flex items-start justify-between gap-4 overflow-hidden rounded-2xl border-2 border-red-500 bg-red-50 p-5 shadow-md shadow-red-500/15">
      <span className="absolute inset-y-0 left-0 w-1.5 bg-red-600" />
      <div className="flex items-start gap-4 pl-2">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40">
          <X className="size-6 stroke-[3]" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-serif text-xl font-medium text-red-950">
              {school.name}
            </p>
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-widest text-white shadow-sm">
              Chưa đạt
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-[0.25em] text-red-700/80">
            {school.country}
          </p>
          {reasons.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-red-700">
              <AlertCircle className="size-3.5 shrink-0 stroke-[2]" />
              {reasons.join(" · ")}
            </p>
          )}
        </div>
      </div>
      <div className="text-right font-mono text-xs tabular-nums text-red-900/80">
        <p>GPA ≥ {school.minGpa.toFixed(1)}</p>
        <p>IELTS ≥ {school.minIelts.toFixed(1)}</p>
      </div>
    </div>
  );
}

/* ===== PENDING — xám nhạt ===== */
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
