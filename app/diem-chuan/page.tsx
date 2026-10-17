import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Điểm chuẩn các trường — DuHoc24",
  description:
    "Danh sách điểm học tập và IELTS tối thiểu để nộp hồ sơ vào các trường đối tác của DuHoc24.",
};

interface SchoolRow {
  id: string;
  name: string;
  country: string;
  min_gpa: number;
  min_ielts: number;
}

async function fetchSchools(): Promise<SchoolRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .order("country", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Fetch schools failed:", error);
    return [];
  }
  return (data ?? []) as SchoolRow[];
}

export default async function DiemChuanPage() {
  const schools = await fetchSchools();

  // Group theo country
  const byCountry = new Map<string, SchoolRow[]>();
  schools.forEach((s) => {
    const list = byCountry.get(s.country) ?? [];
    list.push(s);
    byCountry.set(s.country, list);
  });
  const countries = Array.from(byCountry.keys()).sort();

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
            Điểm học tập (GPA thang 10) và IELTS tối thiểu để nộp hồ sơ. Đối
            chiếu với hồ sơ của bạn trong cổng {" "}
            <a
              href="/portal"
              className="underline underline-offset-4 decoration-foreground/30 transition-colors duration-300 hover:text-[color:var(--umber)] hover:decoration-[color:var(--umber)]"
            >
              hồ sơ học viên
            </a>{" "}
            để biết trường nào đủ điều kiện.
          </p>
        </div>

        {/* Schools grouped by country */}
        <div className="mt-14 space-y-14">
          {countries.length === 0 ? (
            <p className="text-center text-sm text-foreground/50">
              Chưa có trường nào trong hệ thống.
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
                    {list.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 transition-colors duration-300 hover:border-foreground/20 hover:bg-foreground/[0.04]"
                      >
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
                      </li>
                    ))}
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
            Điểm chuẩn trên là điều kiện <strong>tối thiểu</strong> để nộp hồ
            sơ, không phải điểm đảm bảo trúng tuyển. Mỗi năm trường có thể cập
            nhật ngưỡng, hãy xác nhận lại với tư vấn viên DuHoc24 khi chuẩn bị
            nộp hồ sơ chính thức.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
