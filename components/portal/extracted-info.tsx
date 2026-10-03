export function ExtractedInfo({
  fullName,
  dateOfBirth,
  gpa,
  ielts,
}: {
  fullName: string;
  dateOfBirth: string;
  gpa: number;
  ielts: number;
}) {
  const fields = [
    { label: "Họ tên", value: fullName },
    { label: "Ngày sinh", value: dateOfBirth, tabular: true },
    { label: "Điểm GPA", value: gpa.toFixed(1), tabular: true, big: true },
    { label: "Điểm IELTS", value: ielts.toFixed(1), tabular: true, big: true },
  ];

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
            Tự động trích xuất
          </span>
        </div>

        <dl className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/50">
                {field.label}
              </dt>
              <dd
                className={`mt-3 font-serif font-light tracking-tight text-foreground ${
                  field.big ? "text-4xl" : "text-xl"
                } ${field.tabular ? "tabular-nums" : ""}`}
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
