import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const MODEL = "gemini-3.1-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

type DocType = "transcript" | "ielts" | "identity";

const SCHEMA_BY_TYPE: Record<DocType, object> = {
  transcript: {
    type: "OBJECT",
    properties: {
      full_name: { type: "STRING", nullable: true, description: "Họ và tên đầy đủ của học viên trên bảng điểm" },
      date_of_birth: { type: "STRING", nullable: true, description: "Ngày sinh, định dạng DD/MM/YYYY" },
      gpa: { type: "NUMBER", nullable: true, description: "Điểm trung bình tổng kết, thang 10. Nếu bảng điểm thang 4, chuyển sang thang 10 (vd. 3.5/4 → 8.75/10)" },
      is_valid: { type: "BOOLEAN", description: "True nếu đây đúng là bảng điểm học tập chính thức (có dấu/chữ ký trường)" },
      reason: { type: "STRING", nullable: true, description: "Nếu is_valid=false, giải thích ngắn vì sao" },
    },
    required: ["is_valid"],
  },
  ielts: {
    type: "OBJECT",
    properties: {
      full_name: { type: "STRING", nullable: true, description: "Họ tên trên chứng chỉ IELTS" },
      ielts_overall: { type: "NUMBER", nullable: true, description: "Overall band score, 0.0-9.0" },
      ielts_listening: { type: "NUMBER", nullable: true, description: "Listening band score" },
      ielts_reading: { type: "NUMBER", nullable: true, description: "Reading band score" },
      ielts_writing: { type: "NUMBER", nullable: true, description: "Writing band score" },
      ielts_speaking: { type: "NUMBER", nullable: true, description: "Speaking band score" },
      test_date: { type: "STRING", nullable: true, description: "Ngày thi (Test Date), định dạng DD/MM/YYYY" },
      is_valid: { type: "BOOLEAN", description: "True nếu đây đúng là chứng chỉ IELTS hợp lệ (có logo IELTS/British Council/IDP + band scores)" },
      reason: { type: "STRING", nullable: true, description: "Nếu is_valid=false, giải thích ngắn" },
    },
    required: ["is_valid"],
  },
  identity: {
    type: "OBJECT",
    properties: {
      full_name: { type: "STRING", nullable: true, description: "Họ tên trên CMND/CCCD/hộ chiếu" },
      date_of_birth: { type: "STRING", nullable: true, description: "Ngày sinh, định dạng DD/MM/YYYY" },
      identity_number: { type: "STRING", nullable: true, description: "Số CMND/CCCD/hộ chiếu (giữ nguyên format gốc, bao gồm dấu/chữ nếu có)" },
      is_valid: { type: "BOOLEAN", description: "True nếu ảnh rõ, đọc được thông tin, không che/mờ" },
      reason: { type: "STRING", nullable: true, description: "Nếu is_valid=false, giải thích (vd: ảnh mờ, bị che số)" },
    },
    required: ["is_valid"],
  },
};

const PROMPT_BY_TYPE: Record<DocType, string> = {
  transcript:
    "Đây là bảng điểm học tập của học viên Việt Nam. Trích xuất: họ tên đầy đủ, ngày sinh (DD/MM/YYYY), điểm trung bình tổng kết (GPA thang 10). Nếu bảng điểm thang 4, chuyển sang thang 10 (nhân 2.5). Chỉ ghi is_valid=true nếu đây đúng là bảng điểm chính thức có dấu hoặc chữ ký của trường.",
  ielts:
    "Đây là ảnh chứng chỉ IELTS. Trích xuất: họ tên trên chứng chỉ, điểm Overall + 4 kỹ năng (Listening, Reading, Writing, Speaking), ngày thi (Test Date, DD/MM/YYYY). Chỉ ghi is_valid=true nếu thấy rõ logo IELTS/British Council/IDP và đọc được Overall + 4 band scores.",
  identity:
    "Đây là ảnh CMND/CCCD/hộ chiếu Việt Nam. Trích xuất: họ tên, ngày sinh (DD/MM/YYYY), số giấy tờ (giữ nguyên định dạng gốc). Chỉ ghi is_valid=true nếu ảnh rõ, không che/mờ, đọc được cả 3 thông tin.",
};

interface ExtractParams {
  sessionId: string;
  docType: DocType;
  buffer: Buffer;
  mimeType: string;
  supabase: SupabaseClient;
}

interface ExtractedFields {
  full_name?: string | null;
  date_of_birth?: string | null;
  gpa?: number | null;
  ielts_overall?: number | null;
  ielts_listening?: number | null;
  ielts_reading?: number | null;
  ielts_writing?: number | null;
  ielts_speaking?: number | null;
  test_date?: string | null;
  identity_number?: string | null;
  is_valid?: boolean;
  reason?: string | null;
}

export async function extractDocument(params: ExtractParams) {
  const { sessionId, docType, buffer, mimeType, supabase } = params;
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
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini Vision error:", res.status, errText.slice(0, 300));
    throw new Error(`Gemini ${res.status}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error("Gemini không trả về text");

  let parsed: ExtractedFields;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini trả JSON sai format");
  }

  const isValid = parsed.is_valid === true;
  const status = isValid ? "hop_le" : "can_nop_lai";
  const reason = isValid ? null : (parsed.reason ?? "Không đọc rõ thông tin");

  // Update document record với full extracted JSON
  await supabase
    .from("documents")
    .update({ status, reason, extracted_data: parsed })
    .eq("session_id", sessionId)
    .eq("doc_type", docType);

  // Nếu hợp lệ → cập nhật từng field vào profile theo loại giấy tờ
  if (isValid) {
    const update: Record<string, unknown> = {};

    if (docType === "transcript") {
      if (parsed.full_name) update.full_name = parsed.full_name;
      if (parsed.date_of_birth) update.date_of_birth = parsed.date_of_birth;
      if (parsed.gpa != null) update.gpa = parsed.gpa;
    } else if (docType === "ielts") {
      if (parsed.full_name) update.ielts_name = parsed.full_name;
      if (parsed.ielts_overall != null) update.ielts_overall = parsed.ielts_overall;
      if (parsed.ielts_listening != null) update.ielts_listening = parsed.ielts_listening;
      if (parsed.ielts_reading != null) update.ielts_reading = parsed.ielts_reading;
      if (parsed.ielts_writing != null) update.ielts_writing = parsed.ielts_writing;
      if (parsed.ielts_speaking != null) update.ielts_speaking = parsed.ielts_speaking;
      if (parsed.test_date) update.ielts_test_date = parsed.test_date;
    } else if (docType === "identity") {
      if (parsed.full_name) update.identity_name = parsed.full_name;
      if (parsed.date_of_birth) update.identity_dob = parsed.date_of_birth;
      if (parsed.identity_number) update.identity_number = parsed.identity_number;
    }

    if (Object.keys(update).length > 0) {
      await supabase
        .from("student_profiles")
        .update(update)
        .eq("session_id", sessionId);
    }
  }
}
