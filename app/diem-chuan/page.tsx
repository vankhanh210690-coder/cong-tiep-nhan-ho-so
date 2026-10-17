import type { Metadata } from "next";
import { Award } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Điểm chuẩn các trường — DuHoc24",
  description:
    "Danh sách điểm học tập và IELTS tối thiểu + học bổng theo từng trường đối tác của DuHoc24.",
};

interface SchoolRow {
  id: string;
  name: string;
  country: string;
  min_gpa: number;
  min_ielts: number;
}

interface ScholarshipRow {
  id: string;
  name: string;
  school_id: string;
  min_gpa: number | null;
  min_ielts: number | null;
  benefit_text: string;
  benefit_percent: number | null;
}

async function fetchAll() {
  const supabase = getAdminClient();
  const [schoolsRes, schRes] = await Promise.all([
    supabase.from("schools").select("*").order("country").order("name"),
    supabase
      .from("scholarships")
      .select("*")
      .order("benefit_percent", { ascending: false, nullsFirst: false }),
  ]);
  return {
    schools: (schoolsRes.data ?? []) as SchoolRow[],
    scholarships: (schRes.data ?? []) as ScholarshipRow[],
  };
}

function conditionText(s: ScholarshipRow): string {
  if (s.min_gpa != null) return `GPA ≥ ${s.min_gpa.toFixed(1)}`;
  if (s.min_ielts != null) return `IELTS ≥ ${s.min_ielts.toFixed(1)}`;
  return "Không yêu cầu";
}

export default async function DiemChuanPage() {
  const { schools, scholarships } = await fetchAll();

  // Group schools theo country
  const byCountry = new Map<string, SchoolRow[]>();
  schools.forEach((s) => {
    const list = byCountry.get(s.country) ?? [];
    list.push(s);
    byCountry.set(s.country, list);
  });
  const countries = Array.from(byCountry.keys()).sort();

  // Scholarships grouped by school
  const schBySchool = new Map<string, ScholarshipRow[]>();
  scholarships.forEach((s) => {
    const list = schBySchool.get(s.school_id) ?? [];
    list.push(s);
    schBySchool.set(s.school_id, list);
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-40 md:pt-48">
        {/* Header */}
        <div className="border-b border-foreground/10 pb-10">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
            Dữ liệu công khai · Cập nhật thường xuyên
          </p>
          <h1 className="mt-5 font-serif text-5xl font-light uppercase leading-[0.95] tracking-[-0.01em] text-foreground md:text-7xl">
            Điểm chuẩn
            <br />
            <span className="font-medium text-[color:var(--umber)]">
              {schools.length} trường
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/70 md:text-lg">
            Điểm học tập (GPA thang 10) và IELTS tối thiểu + {scholarships.length}{" "}
            học bổng đang mở. Đối chiếu với hồ sơ của bạn trong{" "}
            <a
              href="/portal"
              className="underline underline-offset-4 decoration-foreground/30 transition-colors duration-300 hover:text-[color:var(--umber)] hover:decoration-[color:var(--umber)]"
            >
              cổng hồ sơ
            </a>
            .
          </p>
        </div>

        <div className="mt-14 space-y-14">
          {countries.length === 0 ? (
            <p className="text-center text-sm text-foreground/50">
              Chưa có trường nào.
            </p>
          ) : (
            countries.map((country) => {
              const list = byCountry.get(country)!;
              return (
                <section key={country}>
                  <header className="mb-6 flex items-end justify-between gap-4 border-b border-foreground/8 pb-4">
                    <div>
                      <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/50">
                        Quốc gia
                      </p>
                      <h2 className="mt-2 font-serif text-3xl font-light tracking-tight">
                        {country}
                      </h2>
                    </div>
                    <span className="font-mono text-[0.65rem] tabular-nums uppercase tracking-wider text-foreground/50">
                      {list.length} trường
                    </span>
                  </header>
                  <ul className="space-y-3">
                    {list.map((s) => {
                      const schList = schBySchool.get(s.id) ?? [];
                      return (
                        <li
                          key={s.id}
                          className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 transition-colors duration-300 hover:border-foreground/20"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-serif text-lg font-medium text-foreground">
                                {s.name}
                              </p>
                              <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/40">
                                Mã · {s.id}
                              </p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                                  GPA tối thiểu
                                </p>
                                <p className="mt-1 font-serif text-xl tabular-nums font-medium text-foreground">
                                  {Number(s.min_gpa).toFixed(1)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                                  IELTS tối thiểu
                                </p>
                                <p className="mt-1 font-serif text-xl tabular-nums font-medium text-foreground">
                                  {Number(s.min_ielts).toFixed(1)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Scholarships (nếu có) */}
                          {schList.length > 0 && (
                            <div className="mt-4 border-t border-foreground/8 pt-4">
                              <p className="mb-3 flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--umber)]">
                                <Award className="size-3.5 stroke-[1.6]" />
                                Học bổng đang mở · {schList.length}
                              </p>
                              <ul className="space-y-2">
                                {schList.map((sch) => (
                                  <li
                                    key={sch.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--umber)]/20 bg-[color:var(--umber)]/5 px-4 py-3"
                                  >
                                    <div>
                                      <p className="font-serif text-base font-medium text-foreground">
                                        {sch.name}
                                      </p>
                                      <p className="mt-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-foreground/60">
                                        Điều kiện · {conditionText(sch)}
                                      </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--umber)] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                                      <Award className="size-3 stroke-[2]" />
                                      {sch.benefit_text}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })
          )}
        </div>

        {/* Note */}
        <div className="mt-16 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 text-sm leading-relaxed text-foreground/70">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/50">
            Lưu ý
          </p>
          <p className="mt-3">
            Điểm chuẩn và học bổng trên là điều kiện <strong>tối thiểu</strong>{" "}
            để xét, không phải đảm bảo trúng tuyển / nhận học bổng. Mỗi năm
            trường có thể cập nhật, hãy xác nhận lại với tư vấn viên DuHoc24
            trước khi nộp hồ sơ.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
