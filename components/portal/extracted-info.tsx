interface IeltsBreakdown {
  overall: number | null;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  testDate: string | null;
  name: string | null;
}

interface IdentityData {
  number: string | null;
  name: string | null;
  dob: string | null;
}

/**
 * Che số giấy tờ, chỉ lộ 3 ký tự cuối.
 * '001090044141' → '•••••••••141'
 */
function maskIdNumber(num: string | null): string {
  if (!num) return "—";
  const clean = num.trim();
  if (clean.length <= 3) return clean;
  return "•".repeat(clean.length - 3) + clean.slice(-3);
}

export function ExtractedInfo({
  fullName,
  dateOfBirth,
  gpa,
  ielts,
  identity,
}: {
  fullName: string;
  dateOfBirth: string;
  gpa: number | null;
  ielts: IeltsBreakdown;
  identity: IdentityData;
}) {
  return (
    <div className="rounded-[2rem] bg-foreground/5 p-2 ring-1 ring-foreground/8">
      <div className="rounded-[calc(2rem-0.375rem)] bg-background p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-foreground/10 pb-5">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Thông tin đã trích xuất
            </p>
            <h3 className="mt-2 font-serif text-2xl font-light tracking-tight">
              Giấy tờ của bạn đọc được
            </h3>
          </div>
          <span className="rounded-full bg-[color:var(--sage)]/15 px-3 py-1 text-[0.65rem] font-medium text-[color:var(--sage)]">
            Trích xuất tự động bằng Gemini
          </span>
        </div>

        {/* Thông tin cá nhân + GPA */}
        <section className="mt-6">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/50">
            Thông tin cá nhân · Bảng điểm
          </p>
          <dl className="mt-4 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            <Field label="Họ tên" value={fullName} />
            <Field label="Ngày sinh" value={dateOfBirth} tabular />
            <Field
              label="Điểm GPA"
              value={gpa != null ? gpa.toFixed(1) : "—"}
              tabular
              big
            />
            <Field label="(Trích từ)" value="Bảng điểm" dim />
          </dl>
        </section>

        {/* IELTS breakdown */}
        <section className="mt-8 border-t border-foreground/8 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/50">
              Chứng chỉ IELTS
            </p>
            {ielts.testDate && (
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                Ngày thi · {ielts.testDate}
              </p>
            )}
          </div>
          <dl className="mt-4 grid gap-6 sm:grid-cols-3 md:grid-cols-5">
            <Field
              label="Overall"
              value={ielts.overall != null ? ielts.overall.toFixed(1) : "—"}
              tabular
              big
              accent
            />
            <Field
              label="Nghe"
              value={ielts.listening != null ? ielts.listening.toFixed(1) : "—"}
              tabular
            />
            <Field
              label="Đọc"
              value={ielts.reading != null ? ielts.reading.toFixed(1) : "—"}
              tabular
            />
            <Field
              label="Viết"
              value={ielts.writing != null ? ielts.writing.toFixed(1) : "—"}
              tabular
            />
            <Field
              label="Nói"
              value={ielts.speaking != null ? ielts.speaking.toFixed(1) : "—"}
              tabular
            />
          </dl>
          {ielts.name && ielts.name !== fullName && (
            <p className="mt-4 font-mono text-[0.65rem] text-foreground/50">
              Tên trên chứng chỉ: <span className="text-foreground/70">{ielts.name}</span>
            </p>
          )}
        </section>

        {/* Identity doc */}
        <section className="mt-8 border-t border-foreground/8 pt-6">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/50">
            CMND / CCCD / Hộ chiếu
          </p>
          <dl className="mt-4 grid gap-6 sm:grid-cols-3">
            <Field label="Họ tên trên giấy tờ" value={identity.name ?? "—"} />
            <Field label="Ngày sinh" value={identity.dob ?? "—"} tabular />
            <Field label="Số giấy tờ" value={maskIdNumber(identity.number)} tabular />
          </dl>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  tabular,
  big,
  accent,
  dim,
}: {
  label: string;
  value: string;
  tabular?: boolean;
  big?: boolean;
  accent?: boolean;
  dim?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/50">
        {label}
      </dt>
      <dd
        className={`mt-3 font-serif font-light tracking-tight ${big ? "text-4xl" : "text-xl"} ${
          tabular ? "tabular-nums" : ""
        } ${dim ? "text-foreground/40" : accent ? "text-[color:var(--umber)]" : "text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}
