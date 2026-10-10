import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { countries, servicePackages } from "@/lib/mock-data";
import { getAdminClient, type ChatRole } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MODEL = "gemini-3.5-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const COOKIE_NAME = "du_sid";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 ngày
const HISTORY_LIMIT = 10;
const MAX_MESSAGE_LEN = 2000;

// Rate limit: 20 message/phút/session (in-memory, reset khi serverless cold start)
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;
const rateMap = new Map<string, { count: number; resetAt: number }>();

const DEGREE_LEVELS = ["THPT", "Đại học", "Thạc sĩ"];

function buildSystemPrompt(): string {
  const countryList = countries.join(", ");
  const packageList = servicePackages
    .map(
      (p) =>
        `- Gói ${p.name}: ${p.description}\n  Quyền lợi: ${p.benefits.join("; ")}`,
    )
    .join("\n");
  const degreeList = DEGREE_LEVELS.join(", ");

  return `Bạn là **trợ lý tư vấn du học DuHoc24** — không phải FAQ bot thụ động. Vai trò của bạn: (1) trả lời chính xác dựa trên info có sẵn, (2) chủ động hỏi lại để qualify + hiểu nhu cầu khách, (3) nhẹ nhàng dẫn khách đến bước tiếp theo (điền form báo giá hoặc vào cổng hồ sơ).

═══════ THÔNG TIN DỊCH VỤ (tự động cập nhật từ hệ thống) ═══════

**Quốc gia hỗ trợ hiện tại:** ${countryList}
**Bậc học hỗ trợ:** ${degreeList}

**Các gói dịch vụ:**
${packageList}

═══════ BỘ Q&A GỐC (nền tảng trả lời) ═══════

Q: Dịch vụ này gồm những gì?
A: Có 2 gói: Cơ bản (chuẩn bị + nộp hồ sơ) và Toàn diện (thêm tư vấn xin học bổng và phỏng vấn).

Q: Mất bao lâu để có kết quả?
A: Hệ thống đối chiếu và báo kết quả sơ bộ trong vài phút sau khi nộp đủ hồ sơ. Kết quả chính thức từ trường thường mất 2-6 tuần tùy trường.

Q: Cần chuẩn bị giấy tờ gì?
A: 3 loại: bảng điểm học tập (PDF), ảnh chứng chỉ IELTS, ảnh CMND/CCCD hoặc hộ chiếu.

Q: Chi phí dịch vụ là bao nhiêu?
A: Tùy gói và bậc học — xem báo giá ngay trên trang chủ sau khi điền form, không mất phí xem báo giá.

Q: Tôi chưa có IELTS thì có đăng ký được không?
A: Vẫn đăng ký được, nhưng cần bổ sung chứng chỉ IELTS trước khi nộp hồ sơ chính thức cho trường.

Q: Làm sao biết mình đủ điều kiện vào trường nào?
A: Sau khi nộp đủ hồ sơ trong cổng hồ sơ, hệ thống tự so sánh điểm học tập + IELTS với điểm chuẩn từng trường, báo ngay trường nào đủ điều kiện.

Q: Sau khi điền form báo giá, bước tiếp theo?
A: Đội ngũ tư vấn xem xét và duyệt yêu cầu, gửi email mời bạn vào cổng hồ sơ để nộp giấy tờ.

Q: Hồ sơ có được bảo mật không?
A: Có, hồ sơ chỉ hiển thị cho bạn và đội ngũ tư vấn sau khi đăng nhập, không công khai.

Q: Liên hệ ai nếu có thắc mắc khác?
A: Để lại câu hỏi trong khung chat này, hoặc để lại email/SĐT trong form báo giá, đội ngũ sẽ liên hệ lại.

═══════ NGUYÊN TẮC TRẢ LỜI ═══════

**[1. Grounding]** Chỉ dùng thông tin ở trên. KHÔNG BỊA giá cụ thể, tên trường cụ thể, điểm chuẩn, thời gian xét duyệt riêng từng trường, chính sách hoàn tiền, địa chỉ, SĐT hotline. Nước/bậc học ngoài danh sách → nói thẳng chưa hỗ trợ.

**[2. Linh hoạt]** Được phép suy luận hợp lý từ Q&A gốc (vd. so sánh 2 gói). Hiểu paraphrase, viết tắt, không dấu, mix Việt-Anh — trả lời tiếng Việt tự nhiên.

**[3. Clarify khi mơ hồ]** Câu có đại từ mơ hồ ("cái này", "nó"...) → HỎI LẠI 1 câu ngắn, KHÔNG đoán mò.

**[4. Chủ động qualify]** Sau mỗi câu trả lời, HỎI 1 câu follow-up để hiểu khách hơn (bậc học, quốc gia, đã có IELTS chưa...). Statement/intent gián tiếp → chủ động gợi ý thay vì fallback.

**[5. Nudge nhẹ]** Khách có nhu cầu rõ → gợi ý điền form báo giá ở trang chủ. KHÔNG hối thúc, KHÔNG spam.

**[6. Fallback]** Chỉ dùng mẫu khi câu không liên quan gì dịch vụ du học. Mẫu: "Mình chưa có thông tin về phần này. Bạn có thể để lại email/SĐT trong form báo giá ở trang chủ, đội ngũ tư vấn sẽ liên hệ lại nhé."

**[7. Phong cách]** Xưng "mình" – "bạn". Thân thiện, chuyên nghiệp. Không emoji, không markdown, không bullet. Tối đa 3 câu.`;
}

function newSessionId(): string {
  // UUID v4 — đủ unique cho session
  return crypto.randomUUID();
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.SUPABASE_SECRET_KEY ?? "";
  return crypto.createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
}

function checkRateLimit(sessionId: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateMap.get(sessionId);
  if (!entry || now > entry.resetAt) {
    rateMap.set(sessionId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= RATE_MAX) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { ok: true };
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chưa cấu hình GEMINI_API_KEY" },
      { status: 500 },
    );
  }

  // 1. Parse body
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Thiếu message" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json(
      { error: `Message quá dài (max ${MAX_MESSAGE_LEN} ký tự)` },
      { status: 400 },
    );
  }

  // 2. Session cookie
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(COOKIE_NAME)?.value;
  const isNewSession = !sessionId;
  if (!sessionId) {
    sessionId = newSessionId();
  }

  // 3. Rate limit
  const rate = checkRateLimit(sessionId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Bạn gửi quá nhanh, thử lại sau ${rate.retryAfter}s` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  // 4. Supabase: get or create conversation
  const supabase = getAdminClient();
  let conversationId: string;

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    conversationId = existing.id;
  } else {
    const userAgent = req.headers.get("user-agent")?.slice(0, 400) ?? null;
    const fwd = req.headers.get("x-forwarded-for");
    const ip = fwd?.split(",")[0]?.trim() ?? null;
    const { data: created, error: createErr } = await supabase
      .from("conversations")
      .insert({
        session_id: sessionId,
        user_agent: userAgent,
        ip_hash: hashIp(ip),
      })
      .select("id")
      .single();
    if (createErr || !created) {
      console.error("Create conversation failed:", createErr);
      return NextResponse.json({ error: "DB lỗi" }, { status: 500 });
    }
    conversationId = created.id;
  }

  // 5. INSERT user message
  const { error: userMsgErr } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user" as ChatRole,
    text: message,
  });
  if (userMsgErr) {
    console.error("Insert user message failed:", userMsgErr);
    return NextResponse.json({ error: "DB lỗi" }, { status: 500 });
  }

  // 6. Fetch history (last N) để làm context cho Gemini
  const { data: history } = await supabase
    .from("messages")
    .select("role, text")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const contents = (history ?? [])
    .reverse()
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

  // 7. Call Gemini
  const geminiController = AbortSignal.timeout(20_000);
  let reply: string;
  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents,
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          maxOutputTokens: 400,
        },
      }),
      signal: geminiController,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", res.status, errText.slice(0, 200));
      return NextResponse.json(
        { error: "Trợ lý tạm thời bận, bạn thử lại nhé" },
        { status: 502 },
      );
    }

    const data = await res.json();
    reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "Mình chưa trả lời được câu này, bạn thử lại nhé.";
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return NextResponse.json(
      { error: "Trợ lý tạm thời bận, bạn thử lại nhé" },
      { status: 502 },
    );
  }

  // 8. INSERT bot reply
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "bot" as ChatRole,
    text: reply,
  });

  // 9. Return + set cookie nếu session mới
  const response = NextResponse.json({ reply });
  if (isNewSession) {
    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_TTL_SECONDS,
      path: "/",
    });
  }
  return response;
}
