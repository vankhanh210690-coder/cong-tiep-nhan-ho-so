import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase-auth-server";
import { getAdminClient } from "@/lib/supabase-server";
import { extractDocument } from "./extract";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
]);
const ALLOWED_DOC_TYPES = new Set(["transcript", "ielts", "identity"]);

const BUCKET = "student-documents";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const file = formData.get("file");
  const docType = formData.get("doc_type")?.toString();

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
  }
  if (!docType || !ALLOWED_DOC_TYPES.has(docType)) {
    return NextResponse.json({ error: "doc_type không hợp lệ" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `File quá lớn (${(file.size / 1024 / 1024).toFixed(1)} MB). Tối đa 5 MB.` },
      { status: 400 },
    );
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Định dạng ${file.type} không hỗ trợ` },
      { status: 400 },
    );
  }

  const supabase = getAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const timestamp = Date.now();
  const storagePath = `${user.id}/${docType}-${timestamp}.${ext}`;

  // Upload lên Storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    console.error("Storage upload failed:", uploadErr);
    return NextResponse.json({ error: "Upload storage lỗi" }, { status: 500 });
  }

  // Xoá document cũ cùng loại (nếu có) — storage + record
  const { data: oldDoc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("user_id", user.id)
    .eq("doc_type", docType)
    .maybeSingle();

  if (oldDoc?.storage_path) {
    await supabase.storage.from(BUCKET).remove([oldDoc.storage_path]);
  }

  // Upsert record mới
  const { error: upsertErr } = await supabase
    .from("documents")
    .upsert(
      {
        user_id: user.id,
        doc_type: docType,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        status: "dang_xu_ly",
        reason: null,
        extracted_data: null,
      },
      { onConflict: "user_id,doc_type" },
    );

  if (upsertErr) {
    console.error("DB upsert failed:", upsertErr);
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "DB lỗi" }, { status: 500 });
  }

  // Auto-trigger extract (chạy ngay, không fire-and-forget vì cần cập nhật trạng thái)
  try {
    await extractDocument({
      userId: user.id,
      docType: docType as "transcript" | "ielts" | "identity",
      buffer,
      mimeType: file.type,
      supabase,
    });
  } catch (err) {
    console.error("Extract failed (file đã upload OK):", err);
    // Mark as can_nop_lai + reason
    await supabase
      .from("documents")
      .update({
        status: "can_nop_lai",
        reason: "Không trích xuất được, bạn thử upload lại ảnh rõ hơn.",
      })
      .eq("user_id", user.id)
      .eq("doc_type", docType);
  }

  return NextResponse.json({ ok: true });
}
