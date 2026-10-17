import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const MODEL = "gemini-3.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

type DocType = "transcript" | "ielts" | "identity";

const SCHEMA_BY_TYPE: Record<DocType, object> = {
  transcript: {
    type: "OBJECT",
    properties: {
      full_name: { type: "STRING", nullable: true, description: "Họ tên học viên trong bảng điểm" },
      gpa: { type: "NUMBER", nullable: true, description: "Điểm trung bình, thang 10 (chuyển đổi nếu bảng điểm thang 4)" },
      is_valid: { type: "BOOLEAN", description: "True nếu đây đúng là bảng điểm học tập chính thức" },
      reason: { type: "STRING", nullable: true, description: "Nếu is_valid=false, giải thích ngắn vì sao" },
    },
    required: ["is_valid"],
  },
  ielts: {
    type: "OBJECT",
    properties: {
      full_name: { type: "STRING", nullable: true, description: "Họ tên trong chứng chỉ IELTS" },
      ielts: { type: "NUMBER", nullable: true, description: "Overall band score (0.0 - 9.0)" },
      is_valid: { type: "BOOLEAN", description: "True nếu đây đúng là chứng chỉ IELTS hợp lệ" },
      reason: { type: "STRING", nullable: true, description: "Nếu is_valid=false, giải thích ngắn" },
    },
    required: ["is_valid"],
  },
  identity: {
    type: "OBJECT",
    properties: {
      full_name: { type: "STRING", nullable: true, description: "Họ tên trong CMND/CCCD/hộ chiếu" },
      date_of_birth: { type: "STRING", nullable: true, description: "Ngày sinh, định dạng DD/MM/YYYY" },
      is_valid: { type: "BOOLEAN", description: "True nếu đọc được rõ thông tin, không mờ, không che" },
      reason: { type: "STRING", nullable: true, description: "Nếu is_valid=false, giải thích (vd: ảnh mờ, bị che)" },
    },
    required: ["is_valid"],
  },
};

const PROMPT_BY_TYPE: Record<DocType, string> = {
  transcript: "Đây là bảng điểm học tập của học viên Việt Nam. Trích xuất họ tên và điểm trung bình (GPA). Nếu bảng điểm thang 4, chuyển sang thang 10 (vd. 3.5/4 → 8.75/10). Chỉ ghi is_valid=true nếu đây đúng là bảng điểm chính thức có dấu/chữ ký của trường.",
  ielts: "Đây là ảnh chứng chỉ IELTS. Trích xuất họ tên và Overall band score. Chỉ ghi is_valid=true nếu thấy rõ logo IELTS/British Council/IDP và Overall band.",
  identity: "Đây là ảnh CMND/CCCD/hộ chiếu Việt Nam. Trích xuất họ tên và ngày sinh (dạng DD/MM/YYYY). Chỉ ghi is_valid=true nếu ảnh rõ, không che/mờ, đọc được thông tin.",
};

interface ExtractParams {
  userId: string;
  docType: DocType;
  buffer: Buffer;
  mimeType: string;
  supabase: SupabaseClient;
}

export async function extractDocument(params: ExtractParams) {
  const { userId, docType, buffer, mimeType, supabase } = params;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Thiếu GEMINI_API_KEY");

  const base64 = buffer.toString("base64");

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT_BY_TYPE[docType] },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: SCHEMA_BY_TYPE[docType],
      },
    }),
    signal: AbortSignal.timeout(40_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini Vision error:", res.status, errText.slice(0, 300));
    throw new Error(`Gemini ${res.status}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Gemini không trả về text");

  let parsed: {
    full_name?: string | null;
    gpa?: number | null;
    ielts?: number | null;
    date_of_birth?: string | null;
    is_valid?: boolean;
    reason?: string | null;
  };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini trả JSON sai format");
  }

  const isValid = parsed.is_valid === true;
  const status = isValid ? "hop_le" : "can_nop_lai";
  const reason = isValid ? null : (parsed.reason ?? "Không đọc rõ thông tin");

  // Update document record
  await supabase
    .from("documents")
    .update({
      status,
      reason,
      extracted_data: parsed,
    })
    .eq("user_id", userId)
    .eq("doc_type", docType);

  // Nếu hợp lệ → cập nhật profile
  if (isValid) {
    const profileUpdate: Record<string, unknown> = {};
    if (parsed.full_name) profileUpdate.full_name = parsed.full_name;
    if (docType === "transcript" && parsed.gpa != null) {
      profileUpdate.gpa = parsed.gpa;
    }
    if (docType === "ielts" && parsed.ielts != null) {
      profileUpdate.ielts = parsed.ielts;
    }
    if (docType === "identity" && parsed.date_of_birth) {
      profileUpdate.date_of_birth = parsed.date_of_birth;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await supabase
        .from("student_profiles")
        .update(profileUpdate)
        .eq("user_id", userId);
    }
  }
}
