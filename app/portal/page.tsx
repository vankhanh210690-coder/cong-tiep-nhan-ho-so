import { FileText, IdCard, LogOut, Medal } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DocumentFeatures } from "@/components/portal/document-features";
import { ExtractedInfo } from "@/components/portal/extracted-info";
import { SchoolMatch } from "@/components/portal/school-match";
import { currentStudent } from "@/lib/mock-data";

export default function PortalPage() {
  const { documents, extracted, matches } = currentStudent;

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
                {currentStudent.name}
              </span>
            </h1>
            <p className="mt-3 text-sm text-foreground/60">
              {currentStudent.email}
            </p>
          </div>
          <button className="group inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-background px-4 py-2.5 text-sm text-foreground transition-all duration-500 hover:bg-foreground/5 active:scale-[0.97]">
            <LogOut className="size-3.5 stroke-[1.3]" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Documents */}
        <section className="mt-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
                Bước 01
              </p>
              <h2 className="mt-3 font-serif text-3xl font-light tracking-tight md:text-4xl">
                Giấy tờ cần nộp
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/60">
                Nộp đủ 3 loại giấy tờ dưới đây, hệ thống sẽ tự trích xuất thông
                tin và đối chiếu điểm chuẩn giúp bạn.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <DocumentFeatures
              items={[
                {
                  icon: FileText,
                  title: "Bảng điểm (PDF)",
                  accept: "Chấp nhận PDF",
                  fileName: documents.transcript.fileName,
                  status: documents.transcript.status,
                },
                {
                  icon: Medal,
                  title: "Ảnh chứng chỉ IELTS",
                  accept: "Chấp nhận JPG, PNG",
                  fileName: documents.ielts.fileName,
                  status: documents.ielts.status,
                },
                {
                  icon: IdCard,
                  title: "Ảnh CMND/CCCD hoặc hộ chiếu",
                  accept: "Chấp nhận JPG, PNG",
                  fileName: documents.identity.fileName,
                  status: documents.identity.status,
                  reason: documents.identity.reason,
                },
              ]}
            />
          </div>

          <button className="group mt-10 inline-flex items-center gap-2 rounded-full bg-foreground py-2 pl-6 pr-2 text-sm font-medium text-background shadow-xl shadow-foreground/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/90 active:scale-[0.97]">
            <span>Nộp hồ sơ</span>
            <span className="flex size-9 items-center justify-center rounded-full bg-background/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:bg-background/25">
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <path
                  d="M7 17L17 7M9 7h8v8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </section>

        {/* Extracted info + School match */}
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
            fullName={extracted.fullName}
            dateOfBirth={extracted.dateOfBirth}
            gpa={extracted.gpa}
            ielts={extracted.ielts}
          />
          <SchoolMatch matches={matches} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
