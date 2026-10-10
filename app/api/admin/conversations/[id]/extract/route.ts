import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MODEL = "gemini-3.1-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * POST /api/admin/conversations/[id]/extract
 * Dùng Gemini structured output để trích xuất info + đánh giá chất lượng
 * hội thoại, upsert vào bảng conversation_insights.
 */

const EXTRACT_SCHEMA = {
  type: "OBJECT",
  properties: {
    // === Thông tin khách ===
    lead_name: { type: "STRING", nullable: true, description: "Họ tên khách (nếu đã cung cấp)" },
    lead_email: { type: "STRING", nullable: true, description: "Email khách (format hợp lệ)" },
    lead_phone: { type: "STRING", nullable: true, description: "SĐT khách (format VN, giữ nguyên định dạng khách gõ)" },

    // === Nhu cầu du học ===
    country: { type: "STRING", nullable: true, description: "Quốc gia khách muốn du học" },
    degree: { type: "STRING", nullable: true, description: "Bậc học (THPT/Đại học/Thạc sĩ)" },
    major: { type: "STRING", nullable: true, description: "Ngành học khách quan tâm" },
    timeline: { type: "STRING", nullable: true, description: "Thời gian dự kiến đi (vd Fall 2027)" },
    has_ielts: { type: "BOOLEAN", nullable: true, description: "Khách có IELTS chưa (null nếu chưa nhắc)" },

    // === Sales / consultation ===
    availability: {
      type: "STRING",
      nullable: true,
      description: "Khung giờ khách rảnh để tư vấn (vd 'tối thứ 7', 'sau 6h chiều'). Null nếu không nhắc.",
    },
    wants_consultation: {
      type: "BOOLEAN",
      nullable: true,
      description: "Khách có đồng ý/muốn đặt lịch tư vấn 1-1 không. Null nếu chưa đến bước này.",
    },
    note: {
      type: "STRING",
      nullable: true,
      description: "Ghi chú/câu hỏi tự do khách để lại ngoài flow chuẩn (vd mối lo ngại cụ thể, điều kiện riêng).",
    },

    // === Phân loại lead ===
    lead_quality: {
      type: "STRING",
      enum: ["good", "ok", "spam"],
      description: "Phân loại nhanh: 'good'=khách có nhu cầu rõ + để contact, follow ngay. 'ok'=có quan tâm nhưng chưa đủ info, cần nurture. 'spam'=bot/lạc đề/khách giả.",
    },

    // === Services + QA cũ ===
    services_discussed: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Danh sách dịch vụ đã trao đổi (chọn trường, hồ sơ, visa, học bổng, pre-departure)",
    },
    lead_captured: {
      type: "BOOLEAN",
      description: "True nếu khách đã cung cấp đủ tên + ít nhất 1 trong (email/phone)",
    },
    quality_score: {
      type: "INTEGER",
      description: "Đánh giá chất lượng tư vấn (QA nội bộ) 1-5. 1=lạc đề/khách bỏ, 5=thu lead đầy đủ + đúng flow",
    },
    flow_stage: {
      type: "STRING",
      enum: ["greeting", "country", "degree", "service_intro", "offer_consultation", "collecting_contact", "closed", "off_topic"],
      description: "Giai đoạn cuối cùng của flow 7 bước",
    },
    summary: {
      type: "STRING",
      description: "Tóm tắt 1-2 câu về cuộc hội thoại (bằng tiếng Việt)",
    },
    quality_notes: {
      type: "STRING",
      description: "Nhận xét ngắn về chất lượng tư vấn, điểm mạnh/yếu (bằng tiếng Việt)",
    },
  },
  required: ["services_discussed", "lead_captured", "quality_score", "lead_quality", "flow_stage", "summary", "quality_notes"],
};

const SYSTEM = `Bạn là chuyên viên Sales Ops của DuHoc24. Nhiệm vụ: đọc một cuộc hội thoại giữa khách và trợ lý tư vấn du học, trích xuất đầy đủ thông tin lead + phân loại chất lượng để team sales biết khách nào ưu tiên gọi trước.

**Quy tắc trích xuất:**
- Chỉ ghi info khách ĐÃ CUNG CẤP, KHÔNG suy đoán.
- Field không có → trả null (string/boolean) hoặc [] (array).

**lead_captured** = true KHI VÀ CHỈ KHI khách đã cho tên + (email HOẶC phone).

**wants_consultation** = true nếu khách gật đồng ý đặt lịch tư vấn 1-1. false nếu từ chối. null nếu chưa đến bước này hoặc chưa trả lời.

**lead_quality** — phân loại nhanh để sales triage:
- **good**: Khách có nhu cầu du học CỤ THỂ (nêu nước + bậc học) VÀ đã để contact (ít nhất tên + 1 kênh liên lạc). Đây là lead nóng, follow trong 24h.
- **ok**: Khách có quan tâm thật nhưng info chưa đủ (vd. chỉ nói nước, không có contact; hoặc có contact nhưng chưa rõ nhu cầu). Cần nurture.
- **spam**: Khách lạc đề hoàn toàn, hỏi câu test chatbot, viết linh tinh, hoặc trông giả.

**quality_score (1-5)** — đánh giá QA nội bộ về trợ lý:
- 5 = flow đúng + thu đủ lead + reply phù hợp
- 4 = thu được 1 phần contact + đúng flow
- 3 = đi đúng flow nhưng chưa thu contact
- 2 = flow lệch, trợ lý reply chưa đạt
- 1 = lạc đề hoàn toàn / khách thù địch

**availability** — ghi nguyên văn khung giờ khách nêu (vd "tối thứ 7", "sau 7h", "cuối tuần"). Null nếu không nhắc.

**note** — ghi câu hỏi/mối lo cụ thể khách nêu ngoài flow chuẩn. Vd: "lo chi phí", "cần biết về visa F-1 cho sinh viên chuyển ngành". Null nếu không có.

**summary + quality_notes** bằng tiếng Việt, 1-2 câu, ngắn gọn.`;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });
  }

  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "id không hợp lệ" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Fetch messages
  const { data: msgs, error: mErr } = await supabase
    .from("messages")
    .select("role, text, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (mErr) {
    return NextResponse.json({ error: "DB lỗi khi fetch messages" }, { status: 500 });
  }
  if (!msgs || msgs.length === 0) {
    return NextResponse.json({ error: "Hội thoại trống, không có gì để trích xuất" }, { status: 400 });
  }

  // Build transcript cho Gemini
  const transcript = msgs
    .map((m) => `[${m.role === "user" ? "KHÁCH" : "TRỢ LÝ"}] ${m.text}`)
    .join("\n");

  // Call Gemini structured output
  const geminiRes = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: `Phân tích cuộc hội thoại dưới đây:\n\n${transcript}` }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: EXTRACT_SCHEMA,
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error("Gemini extract error:", geminiRes.status, errText.slice(0, 300));
    return NextResponse.json({ error: `Gemini lỗi ${geminiRes.status}` }, { status: 502 });
  }

  const geminiData = await geminiRes.json();
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    return NextResponse.json({ error: "Gemini không trả về nội dung" }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "Gemini trả JSON sai format" }, { status: 502 });
  }

  // Upsert vào bảng insights
  const { error: upsertErr } = await supabase
    .from("conversation_insights")
    .upsert({
      conversation_id: id,
      ...parsed,
      extracted_at: new Date().toISOString(),
      model_used: MODEL,
    });

  if (upsertErr) {
    console.error("Upsert insights failed:", upsertErr);
    return NextResponse.json({ error: "DB lỗi khi lưu insights" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, insights: parsed });
}
