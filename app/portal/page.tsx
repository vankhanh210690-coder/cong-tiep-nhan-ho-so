import { PortalDocuments } from "@/components/portal/portal-documents";
import { ExtractedInfo } from "@/components/portal/extracted-info";
import { SchoolMatch } from "@/components/portal/school-match";
import { AIScholarshipSuggest } from "@/components/portal/ai-scholarship-suggest";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPortalSession } from "@/lib/portal-session";
import { getAdminClient } from "@/lib/supabase-server";
import type { DocStatus } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DocRow {
  doc_type: "transcript" | "ielts" | "identity";
  file_name: string;
  status: DocStatus;
  reason: string | null;
}

interface SchoolRow {
  id: string;
  name: string;
  country: string;
  min_gpa: number;
  min_ielts: number;
}

interface ProfileRow {
  full_name: string | null;
  date_of_birth: string | null;
  gpa: number | null;
  ielts_name: string | null;
  ielts_overall: number | null;
  ielts_listening: number | null;
  ielts_reading: number | null;
  ielts_writing: number | null;
  ielts_speaking: number | null;
  ielts_test_date: string | null;
  identity_name: string | null;
  identity_dob: string | null;
  identity_number: string | null;
}

export default async function PortalPage() {
  // Cookie đã được middleware set trước, luôn có giá trị
  const sessionId = await getPortalSession();
  if (!sessionId) {
    // Edge case: middleware fail → render shell trống
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-6 pt-40 pb-24">
          <p className="text-sm text-foreground/60">
            Không khởi tạo được phiên portal. Thử refresh lại nhé.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const supabase = getAdminClient();
  const [profileRes, docsRes, schoolsRes] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("session_id", sessionId).maybeSingle(),
    supabase.from("documents").select("doc_type, file_name, status, reason").eq("session_id", sessionId),
    supabase.from("schools").select("*").order("country"),
  ]);

  const profile = profileRes.data as ProfileRow | null;
  const docs = (docsRes.data ?? []) as DocRow[];
  const schools = (schoolsRes.data ?? []) as SchoolRow[];

  const docsByType = new Map<string, DocRow>();
  docs.forEach((d) => docsByType.set(d.doc_type, d));

  const docItems = (["transcript", "ielts", "identity"] as const).map((type) => {
    const existing = docsByType.get(type);
    return {
      type,
      fileName: existing?.file_name ?? null,
      status: existing?.status ?? ("chua_nop" as DocStatus),
      reason: existing?.reason ?? null,
    };
  });

  // Luôn render list schools từ DB; nếu đủ GPA+IELTS → chấm pass/fail + lý do.
  const hasStudentData =
    profile?.gpa != null && profile?.ielts_overall != null;
  const studentGpa = profile?.gpa != null ? Number(profile.gpa) : null;
  const studentIelts =
    profile?.ielts_overall != null ? Number(profile.ielts_overall) : null;

  const matches = schools.map((s) => {
    const minGpa = Number(s.min_gpa);
    const minIelts = Number(s.min_ielts);
    const base = {
      school: {
        id: s.id,
        name: s.name,
        country: s.country,
        minGpa,
        minIelts,
      },
    };
    if (!hasStudentData) {
      return { ...base, passed: null as boolean | null };
    }
    const gpaOk = studentGpa! >= minGpa;
    const ieltsOk = studentIelts! >= minIelts;
    const passed = gpaOk && ieltsOk;
    const reasons: string[] = [];
    if (!gpaOk) reasons.push(`GPA ${studentGpa!.toFixed(1)} < ${minGpa.toFixed(1)}`);
    if (!ieltsOk) reasons.push(`IELTS ${studentIelts!.toFixed(1)} < ${minIelts.toFixed(1)}`);
    return { ...base, passed, reasons };
  });

  const displayName =
    profile?.full_name ?? profile?.identity_name ?? profile?.ielts_name;
  const hasAnyData =
    profile?.full_name ||
    profile?.gpa != null ||
    profile?.ielts_overall != null ||
    profile?.identity_number;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-40 md:pt-48">
        {/* Header */}
        <div className="border-b border-foreground/10 pb-8">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
            Cổng hồ sơ · Fall 2026
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light leading-[1] tracking-tight text-foreground md:text-5xl">
            Xin chào,{" "}
            <span className="font-medium text-[color:var(--umber)]">
              {displayName ?? "bạn"}
            </span>
          </h1>
          <p className="mt-3 text-sm text-foreground/60">
            {displayName
              ? "Hồ sơ của bạn đang được xây dựng từ các giấy tờ đã upload."
              : "Upload 3 loại giấy tờ bên dưới để hệ thống trích xuất thông tin."}
          </p>
        </div>

        {/* Documents */}
        <section className="mt-16">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Bước 01
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light tracking-tight md:text-4xl">
              Giấy tờ cần nộp
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/60">
              Nộp 3 loại giấy tờ. Mỗi lần upload, Gemini sẽ tự đọc nội dung và
              cập nhật thông tin bên dưới. File giới hạn 5 MB.
            </p>
          </div>

          <div className="mt-8">
            <PortalDocuments items={docItems} />
          </div>
        </section>

        {/* Kết quả xử lý — chỉ hiện khi đã có data trích xuất */}
        {hasAnyData && (
          <section className="mt-24 space-y-8">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
                Bước 02
              </p>
              <h2 className="mt-3 font-serif text-3xl font-light tracking-tight md:text-4xl">
                Kết quả xử lý
              </h2>
            </div>
            <ExtractedInfo
              fullName={profile?.full_name ?? profile?.identity_name ?? "—"}
              dateOfBirth={profile?.date_of_birth ?? profile?.identity_dob ?? "—"}
              gpa={profile?.gpa != null ? Number(profile.gpa) : null}
              ielts={{
                overall: profile?.ielts_overall != null ? Number(profile.ielts_overall) : null,
                listening: profile?.ielts_listening != null ? Number(profile.ielts_listening) : null,
                reading: profile?.ielts_reading != null ? Number(profile.ielts_reading) : null,
                writing: profile?.ielts_writing != null ? Number(profile.ielts_writing) : null,
                speaking: profile?.ielts_speaking != null ? Number(profile.ielts_speaking) : null,
                testDate: profile?.ielts_test_date ?? null,
                name: profile?.ielts_name ?? null,
              }}
              identity={{
                number: profile?.identity_number ?? null,
                name: profile?.identity_name ?? null,
                dob: profile?.identity_dob ?? null,
              }}
            />
          </section>
        )}

        {/* Đối chiếu điểm chuẩn — LUÔN hiện (list từ DB), chấm pass/fail khi đủ data */}
        {matches.length > 0 && (
          <section className="mt-16 space-y-6">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
                Bước 03
              </p>
              <h2 className="mt-3 font-serif text-3xl font-light tracking-tight md:text-4xl">
                Điểm chuẩn các trường
              </h2>
            </div>
            <SchoolMatch matches={matches} hasStudentData={hasStudentData} />
          </section>
        )}

        {/* AI gợi ý học bổng — hiện khi đã có GPA + IELTS (dù đạt hay không, AI sẽ trả lời đúng tình huống) */}
        {hasStudentData && (
          <section className="mt-12 space-y-6">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
                Bước 04
              </p>
              <h2 className="mt-3 font-serif text-3xl font-light tracking-tight md:text-4xl">
                Học bổng phù hợp
              </h2>
            </div>
            <AIScholarshipSuggest
              passedCount={matches.filter((m) => m.passed === true).length}
            />
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
