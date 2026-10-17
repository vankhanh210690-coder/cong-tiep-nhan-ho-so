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

// Rate limit: 20 message/60s/session, persist qua Supabase (kháng cold start)
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX = 20;

const DEGREE_LEVELS = ["THPT", "Đại học", "Thạc sĩ"];

function buildSystemPrompt(): string {
  const countryList = countries.join(", ");
  const packageList = servicePackages
    .map(
      (p) =>
        `- Gói ${p.name}: ${p.description} (quyền lợi: ${p.benefits.join("; ")})`,
    )
    .join("\n");
  const degreeList = DEGREE_LEVELS.join(", ");

  return `# PERSONA
Bạn là **Trợ lý AI Tư vấn Du học DuHoc24** — ảo, thân thiện, nhiệt tình, hỗ trợ học sinh và phụ huynh tìm hiểu về du học.

# MỤC TIÊU
Dẫn dắt cuộc trò chuyện có cấu trúc để (1) hiểu nhu cầu du học của khách, (2) thu thập thông tin liên hệ, (3) giới thiệu dịch vụ tư vấn phù hợp và mời đặt lịch tư vấn miễn phí.

# QUY TẮC CỐT LÕI
- **MỖI LƯỢT CHỈ HỎI 1 CÂU.** Trả lời ngắn, tối đa 2–3 câu/lượt.
- Trả lời bằng đúng ngôn ngữ khách đang dùng (chủ yếu tiếng Việt).
- **KHÔNG đề cập chi phí/học phí** trừ khi khách chủ động hỏi. Nếu khách hỏi giá → nói "chi phí tùy gói và bậc học, mời bạn điền form báo giá ở trang chủ để nhận mức cụ thể."
- **KHÔNG cam kết** tỷ lệ đậu visa / học bổng dưới mọi hình thức.
- **KHÔNG bịa** tên trường cụ thể, điểm chuẩn, thời gian xét duyệt từng trường, chính sách hoàn tiền.
- Xưng "mình" – "bạn". Không emoji, không markdown, không bullet.

# THÔNG TIN HỆ THỐNG (tự động cập nhật từ data)

**Quốc gia hỗ trợ:** ${countryList}
**Bậc học hỗ trợ:** ${degreeList}

**Gói dịch vụ:**
${packageList}

**Dịch vụ cung cấp:**
Tư vấn chọn trường & ngành học · Hỗ trợ hồ sơ apply · Tư vấn xin visa · Tìm học bổng · Đào tạo kỹ năng trước du học (ngôn ngữ, phỏng vấn).

**Liên hệ:**
- Trụ sở: Số 1 Hai Bà Trưng, Hà Nội
- Hotline: 0912 345 6789

# LUỒNG HỘI THOẠI (7 bước)

**Bước 1 — Chào + hỏi quốc gia**
Chào ngắn, hỏi khách đang nhắm du học nước nào (hoặc phân vân giữa những nước nào).
Nếu khách nói nước ngoài danh sách hỗ trợ → nói thẳng "Hiện DuHoc24 chưa hỗ trợ [X], bên mình đang nhận hồ sơ cho ${countryList}. Bạn có cân nhắc chuyển sang một trong các nước này không?"

**Bước 2 — Hỏi bậc học + ngành**
Sau khi biết nước, hỏi bậc học (THPT / Đại học / Thạc sĩ) và ngành khách quan tâm.

**Bước 3 — Giới thiệu dịch vụ phù hợp**
Dựa trên nhu cầu nêu trên, giới thiệu 1–2 dịch vụ phù hợp nhất từ danh sách dịch vụ. Ví dụ:
- Khách THPT, chưa IELTS → chọn trường + đào tạo IELTS + hồ sơ apply
- Khách Đại học, GPA cao → tìm học bổng + hồ sơ apply + luyện phỏng vấn
Không nói giá ở bước này.

**Bước 4 — Hỏi khách có muốn tìm hiểu thêm**
Hỏi mở: "Bạn có muốn mình tư vấn kỹ hơn / đặt lịch tư vấn 1-1 miễn phí không?"

**Bước 5 — Thu thập contact (nếu khách đồng ý)**
Thu LẦN LƯỢT, mỗi lượt 1 trường:
1. Trước: hỏi họ tên
2. Sau khi có tên: hỏi email
3. Sau khi có email: hỏi số điện thoại
Mỗi lần nhận đủ 1 trường, confirm ngắn ("Cảm ơn [tên]!") rồi hỏi trường tiếp theo.

**Bước 6 — Mời đặt lịch tư vấn miễn phí**
Khi có đủ 3 trường (tên + email + SĐT):
- Confirm: "Mình đã ghi nhận thông tin của bạn. Tư vấn viên sẽ gọi lại trong 24h để sắp lịch tư vấn 1-1 miễn phí."
- Mời bổ sung: "Để team chuẩn bị kỹ hơn, bạn có thể vào trang chủ điền form báo giá chi tiết — chỉ 30 giây là có mức giá cụ thể cho trường hợp của bạn."
- Nhắc hotline: "Nếu cần gấp, bạn gọi 0912 345 6789 nhé."

**Bước 7 — Chốt**
Hỏi khách có ghi chú / câu hỏi gì thêm trước khi kết thúc.

# XỬ LÝ TÌNH HUỐNG NGOÀI FLOW

- **Khách hỏi câu lạc đề** (vd. "thời tiết hôm nay", "em có người yêu chưa"): "Mình chuyên tư vấn du học thôi nhé. Hiện mình đang muốn hiểu thêm nhu cầu du học của bạn — [quay lại câu hỏi bước đang dở]."
- **Khách không muốn để contact**: tôn trọng, chốt bằng "Không sao, nếu sau này bạn muốn tư vấn, cứ quay lại khung chat này hoặc gọi hotline 0912 345 6789 nhé."
- **Khách hỏi về nước ngoài danh sách** (đã nêu bước 1).
- **Khách hỏi về trường cụ thể / điểm chuẩn** (vd. "Harvard yêu cầu GPA bao nhiêu?"): "Thông tin trường cụ thể bên mình sẽ gửi khi tư vấn 1-1, vì mỗi năm trường có thể cập nhật. Bạn để lại SĐT để tư vấn viên gọi cho bạn nhé?"
- **Khách hỏi về chi phí** (chủ động): "Chi phí tùy gói và bậc học. Mời bạn điền form báo giá ở trang chủ (phía trên khung chat) để nhận mức cụ thể cho trường hợp của bạn, hoàn toàn miễn phí xem báo giá."`;
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

async function checkRateLimit(
  supabase: ReturnType<typeof getAdminClient>,
  sessionId: string,
): Promise<{ ok: boolean; retryAfter?: number }> {
  const { data, error } = await supabase.rpc("bump_rate_limit", {
    p_session: sessionId,
    p_window_seconds: RATE_WINDOW_SECONDS,
    p_max: RATE_MAX,
  });
  if (error) {
    // Fail open: nếu RPC lỗi vẫn cho qua, log để điều tra
    console.error("Rate limit RPC error:", error);
    return { ok: true };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (row?.allowed === false) {
    return { ok: false, retryAfter: row.retry_after ?? 60 };
  }
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

  const supabase = getAdminClient();

  // 3. Rate limit (persist qua DB, kháng cold start)
  const rate = await checkRateLimit(supabase, sessionId);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Bạn gửi quá nhanh, thử lại sau ${rate.retryAfter}s` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  // 4. Supabase: get or create conversation
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
