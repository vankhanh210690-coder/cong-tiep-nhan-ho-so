import { redirect } from "next/navigation";
import { FileText, IdCard, Medal } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PortalDocuments } from "@/components/portal/portal-documents";
import { ExtractedInfo } from "@/components/portal/extracted-info";
import { SchoolMatch } from "@/components/portal/school-match";
import { SignoutButton } from "@/components/portal/signout-button";
import { getCurrentUser } from "@/lib/supabase-auth-server";
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

const DOC_META = {
  transcript: {
    icon: FileText,
    title: "Bảng điểm (PDF)",
    accept: "Chấp nhận PDF, tối đa 5 MB",
    mime: "application/pdf",
  },
  ielts: {
    icon: Medal,
    title: "Ảnh chứng chỉ IELTS",
    accept: "Chấp nhận JPG, PNG, tối đa 5 MB",
    mime: "image/jpeg,image/png",
  },
  identity: {
    icon: IdCard,
    title: "Ảnh CMND/CCCD hoặc hộ chiếu",
    accept: "Chấp nhận JPG, PNG, tối đa 5 MB",
    mime: "image/jpeg,image/png",
  },
} as const;

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = getAdminClient();

  const [profileRes, docsRes, schoolsRes] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("documents").select("doc_type, file_name, status, reason").eq("user_id", user.id),
    supabase.from("schools").select("*").order("country"),
  ]);

  const profile = profileRes.data;
  const docs = (docsRes.data ?? []) as DocRow[];
  const schools = (schoolsRes.data ?? []) as SchoolRow[];

  const docsByType = new Map<string, DocRow>();
  docs.forEach((d) => docsByType.set(d.doc_type, d));

  const docItems = (["transcript", "ielts", "identity"] as const).map((type) => {
    const existing = docsByType.get(type);
    const meta = DOC_META[type];
    return {
      type,
      icon: meta.icon,
      title: meta.title,
      accept: meta.accept,
      mime: meta.mime,
      fileName: existing?.file_name ?? null,
      status: existing?.status ?? ("chua_nop" as DocStatus),
      reason: existing?.reason ?? undefined,
    };
  });

  // Match schools (chỉ khi có cả GPA + IELTS)
  const canMatch = profile?.gpa != null && profile?.ielts != null;
  const matches = canMatch
    ? schools.map((s) => ({
        school: {
          id: s.id,
          name: s.name,
          country: s.country,
          minGpa: Number(s.min_gpa),
          minIelts: Number(s.min_ielts),
        },
        passed:
          Number(profile!.gpa) >= Number(s.min_gpa) &&
          Number(profile!.ielts) >= Number(s.min_ielts),
      }))
    : [];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-40 md:pt-48">
        {/* Header strip */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-foreground/10 pb-8">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
              Cổng hồ sơ · Fall 2026
            </p>
            <h1 className="mt-4 font-serif text-4xl font-light leading-[1] tracking-tight text-foreground md:text-5xl">
              Xin chào,{" "}
              <span className="font-medium text-[color:var(--umber)]">
                {profile?.full_name ?? user.email?.split("@")[0] ?? "bạn"}
              </span>
            </h1>
            <p className="mt-3 text-sm text-foreground/60">{user.email}</p>
          </div>
          <SignoutButton />
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
              Upload 3 loại giấy tờ dưới đây. Sau mỗi lần upload, Gemini Vision
              sẽ tự trích xuất thông tin và cập nhật hồ sơ.
            </p>
          </div>

          <div className="mt-8">
            <PortalDocuments items={docItems} />
          </div>
        </section>

        {/* Extracted info + match */}
        {(profile?.full_name || profile?.gpa != null || profile?.ielts != null) && (
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
              fullName={profile?.full_name ?? "—"}
              dateOfBirth={profile?.date_of_birth ?? "—"}
              gpa={profile?.gpa != null ? Number(profile.gpa) : NaN}
              ielts={profile?.ielts != null ? Number(profile.ielts) : NaN}
            />
            {canMatch && matches.length > 0 && <SchoolMatch matches={matches} />}
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
