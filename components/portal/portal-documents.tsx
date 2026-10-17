"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileText, IdCard, Medal } from "lucide-react";
import { DocStatusBadge } from "@/components/status-badge";
import type { DocStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type DocType = "transcript" | "ielts" | "identity";

interface DocItem {
  type: DocType;
  fileName: string | null;
  status: DocStatus;
  reason?: string | null;
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

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export function PortalDocuments({ items }: { items: DocItem[] }) {
  const router = useRouter();
  const [uploadingType, setUploadingType] = React.useState<DocType | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<Record<DocType, string | null>>(
    { transcript: null, ielts: null, identity: null },
  );
  const inputRefs = React.useRef<Record<DocType, HTMLInputElement | null>>({
    transcript: null,
    ielts: null,
    identity: null,
  });

  async function handleFile(type: DocType, file: File) {
    setErrorMsg((prev) => ({ ...prev, [type]: null }));

    if (file.size > MAX_SIZE) {
      setErrorMsg((prev) => ({
        ...prev,
        [type]: `File quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Tối đa 5 MB.`,
      }));
      return;
    }

    setUploadingType(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", type);

      const res = await fetch("/api/portal/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg((prev) => ({ ...prev, [type]: data.error ?? "Upload lỗi" }));
        return;
      }

      // Refresh server component để hiện trạng thái mới + info trích xuất
      router.refresh();
    } catch {
      setErrorMsg((prev) => ({ ...prev, [type]: "Không kết nối được" }));
    } finally {
      setUploadingType(null);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item) => {
        const uploading = uploadingType === item.type;
        const err = errorMsg[item.type];
        const hasFile = item.fileName !== null;
        const meta = DOC_META[item.type];
        const Icon = meta.icon;

        return (
          <article key={item.type} className="group">
            <div className="rounded-[1.5rem] bg-foreground/5 p-1.5 ring-1 ring-foreground/8 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-foreground/15">
              <label
                className={cn(
                  "flex aspect-[5/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-[calc(1.5rem-0.375rem)] bg-background p-6 transition-colors",
                  uploading && "pointer-events-none opacity-70",
                  !hasFile && "hover:bg-foreground/[0.02]",
                )}
              >
                <input
                  ref={(el) => {
                    inputRefs.current[item.type] = el;
                  }}
                  type="file"
                  accept={meta.mime}
                  disabled={uploading}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(item.type, file);
                    e.target.value = ""; // reset để chọn lại cùng file được
                  }}
                />
                {uploading ? (
                  <>
                    <Loader2 className="size-7 animate-spin stroke-[1.3] text-foreground/60" />
                    <span className="font-mono text-[0.65rem] uppercase tracking-widest text-foreground/60">
                      Đang trích xuất...
                    </span>
                  </>
                ) : hasFile ? (
                  <>
                    <Icon className="size-7 stroke-[1.1] text-foreground/60" />
                    <span className="max-w-full truncate px-4 font-mono text-[0.65rem] text-foreground/60">
                      {item.fileName}
                    </span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[color:var(--umber)]">
                      Click để upload lại
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="size-7 stroke-[1.3] text-foreground/40 transition-transform duration-500 group-hover:-translate-y-0.5" />
                    <span className="font-mono text-[0.65rem] uppercase tracking-widest text-foreground/50">
                      Chọn file để upload
                    </span>
                  </>
                )}
              </label>
            </div>

            <div className="mt-5 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-xl font-medium text-foreground">
                  {meta.title}
                </h3>
                {hasFile && <DocStatusBadge status={item.status} />}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                {item.status === "can_nop_lai" && item.reason ? (
                  <>
                    Cần nộp lại:{" "}
                    <span className="text-[color:var(--destructive)]">
                      {item.reason}
                    </span>
                  </>
                ) : (
                  meta.accept
                )}
              </p>
              {err && (
                <p role="alert" className="mt-2 text-xs text-[color:var(--destructive)]">
                  {err}
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
