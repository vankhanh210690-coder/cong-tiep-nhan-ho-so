import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/portal-session";
import { getAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "gemini-3.1-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * POST /api/portal/suggest-scholarships
 *
 * Dùng Gemini function calling: AI tự quyết định lookup học bổng của trường nào
 * dựa trên hồ sơ + danh sách trường khách đã đạt.
 *
 * Flow:
 * 1. Lấy profile (GPA, IELTS) + passed schools từ Supabase.
 * 2. Gọi Gemini với system prompt + context + tool declaration.
 * 3. Nếu Gemini trả về functionCall → execute (query scholarships table) → gửi functionResponse.
 * 4. Lặp tối đa 3 vòng (phòng Gemini gọi nhiều tool).
 * 5. Trả về text suggestion cuối cùng.
 */
export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Thiếu GEMINI_API_KEY" }, { status: 500 });
  }

  const sessionId = await getPortalSession();
  if (!sessionId) {
    return NextResponse.json({ error: "Chưa khởi tạo phiên" }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Fetch profile + schools
  const [profileRes, schoolsRes] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("full_name, gpa, ielts_overall")
      .eq("session_id", sessionId)
      .maybeSingle(),
    supabase.from("schools").select("id, name, country, min_gpa, min_ielts"),
  ]);

  const profile = profileRes.data;
  const schools = schoolsRes.data ?? [];

  if (!profile?.gpa || !profile?.ielts_overall) {
    return NextResponse.json(
      { error: "Cần có đủ GPA và IELTS trong hồ sơ trước khi hỏi AI" },
      { status: 400 },
    );
  }

  const studentGpa = Number(profile.gpa);
  const studentIelts = Number(profile.ielts_overall);

  // Deterministic: compute passed schools
  const passedSchools = schools.filter(
    (s) =>
      studentGpa >= Number(s.min_gpa) && studentIelts >= Number(s.min_ielts),
  );

  if (passedSchools.length === 0) {
    return NextResponse.json({
      ok: true,
      suggestion:
        "Hồ sơ hiện tại chưa đạt điểm chuẩn trường nào trong hệ thống nên chưa có cơ sở để gợi ý học bổng. Bạn hãy cải thiện GPA hoặc IELTS, hoặc liên hệ tư vấn viên để biết các trường ngoài danh sách tham chiếu.",
      passed_count: 0,
    });
  }

  // Tool declaration cho Gemini
  const TOOL = {
    functionDeclarations: [
      {
        name: "get_scholarships_by_schools",
        description:
          "Tra cứu danh sách học bổng của các trường trong hệ thống DuHoc24. Dùng để lấy chi tiết học bổng (tên, điều kiện, mức hỗ trợ) cho những trường cụ thể trong danh sách khách đã đạt điểm chuẩn.",
        parameters: {
          type: "OBJECT",
          properties: {
            school_ids: {
              type: "ARRAY",
              items: { type: "STRING" },
              description:
                "Mảng school_id của các trường cần tra cứu học bổng. Chỉ dùng ID có trong danh sách trường khách đã đạt, vd ['sch_06', 'sch_07'].",
            },
          },
          required: ["school_ids"],
        },
      },
    ],
  };

  const systemPrompt = `Bạn là tư vấn viên học bổng của DuHoc24.

Nhiệm vụ: dựa trên HỒ SƠ khách (GPA, IELTS) và DANH SÁCH TRƯỜNG khách đã ĐẠT điểm chuẩn, hãy TRA CỨU học bổng bằng cách gọi hàm \`get_scholarships_by_schools\`, sau đó đánh giá học bổng nào khách CÓ KHẢ NĂNG đủ điều kiện nhận (so sánh GPA/IELTS của khách với điều kiện tối thiểu của từng học bổng).

Quy tắc:
- Chỉ gọi hàm MỘT LẦN với tất cả school_ids khách đạt (không cần gọi từng trường).
- Sau khi có danh sách học bổng, tự so sánh với hồ sơ khách để chọn học bổng khách đủ điều kiện.
- Trả lời bằng tiếng Việt, ngắn gọn, có cấu trúc rõ (dùng số thứ tự nếu nhiều học bổng).
- Mỗi học bổng gợi ý nêu rõ: tên, trường, mức hỗ trợ, lý do khách đủ (vd "GPA 8.5 ≥ yêu cầu 8.0").
- Nếu không có học bổng nào khách đủ điều kiện → nói thẳng + gợi ý cải thiện GPA/IELTS.
- KHÔNG bịa học bổng ngoài danh sách hàm trả về.`;

  const passedListText = passedSchools
    .map((s) => `- ${s.id} · ${s.name} (${s.country})`)
    .join("\n");

  const userMessage = `HỒ SƠ KHÁCH:
- Tên: ${profile.full_name ?? "(chưa có)"}
- GPA: ${studentGpa.toFixed(1)}/10
- IELTS Overall: ${studentIelts.toFixed(1)}

CÁC TRƯỜNG KHÁCH ĐÃ ĐẠT ĐIỂM CHUẨN (${passedSchools.length}):
${passedListText}

Hãy tra cứu học bổng cho các trường trên và gợi ý những học bổng khách có khả năng đủ điều kiện nhận.`;

  // Conversation history cho function calling loop
  const contents: Array<{
    role: string;
    parts: Array<Record<string, unknown>>;
  }> = [{ role: "user", parts: [{ text: userMessage }] }];

  const MAX_LOOPS = 3;
  let finalText = "";

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        tools: [TOOL],
        toolConfig: { functionCallingConfig: { mode: "AUTO" } },
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini suggest error:", res.status, errText.slice(0, 300));
      return NextResponse.json(
        { error: `Gemini lỗi ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];

    // Tìm function call hoặc text
    const functionCall = parts.find(
      (p: Record<string, unknown>) => "functionCall" in p,
    );
    const textPart = parts.find(
      (p: Record<string, unknown>) => "text" in p && (p as { text: string }).text.trim(),
    );

    if (functionCall) {
      const fc = (functionCall as {
        functionCall: { name: string; args: { school_ids: string[] }; id?: string };
      }).functionCall;
      if (fc.name === "get_scholarships_by_schools") {
        const schoolIds = fc.args.school_ids ?? [];
        const passedIds = new Set(passedSchools.map((s) => s.id));
        const safeIds = schoolIds.filter((id) => passedIds.has(id));

        const { data: schList, error } = await supabase
          .from("scholarships")
          .select("id, name, school_id, min_gpa, min_ielts, benefit_text, schools(name)")
          .in("school_id", safeIds.length > 0 ? safeIds : ["__none__"]);

        const scholarshipsForAi = (schList ?? []).map((s: {
          id: string;
          name: string;
          school_id: string;
          min_gpa: number | null;
          min_ielts: number | null;
          benefit_text: string;
          schools: { name: string } | { name: string }[] | null;
        }) => ({
          id: s.id,
          name: s.name,
          school_name: Array.isArray(s.schools) ? s.schools[0]?.name : s.schools?.name,
          min_gpa: s.min_gpa,
          min_ielts: s.min_ielts,
          benefit: s.benefit_text,
        }));

        // Echo FULL model response parts (bao gồm thoughtSignature nếu có)
        contents.push({ role: "model", parts });

        // functionResponse với id matching + response object
        const funcResponsePart: Record<string, unknown> = {
          functionResponse: {
            name: "get_scholarships_by_schools",
            response: {
              scholarships: scholarshipsForAi,
              queried_count: safeIds.length,
              found_count: scholarshipsForAi.length,
              ...(error ? { error: error.message } : {}),
            },
          },
        };
        if (fc.id) {
          (funcResponsePart.functionResponse as { id?: string }).id = fc.id;
        }
        contents.push({ role: "user", parts: [funcResponsePart] });
        continue;
      }
    }

    if (textPart) {
      finalText = (textPart as { text: string }).text.trim();
      break;
    }

    // Không có function call và không có text → break
    break;
  }

  if (!finalText) {
    finalText = "AI không trả về kết quả, bạn thử lại nhé.";
  }

  return NextResponse.json({
    ok: true,
    suggestion: finalText,
    passed_count: passedSchools.length,
    model: MODEL,
  });
}
