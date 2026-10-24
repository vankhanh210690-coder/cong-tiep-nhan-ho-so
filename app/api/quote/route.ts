import { NextResponse, after } from "next/server";
import crypto from "node:crypto";
import { getAdminClient } from "@/lib/supabase-server";
import { countries, servicePackages } from "@/lib/mock-data";

export const runtime = "nodejs";

const QUOTE_WEBHOOK_URL =
  process.env.QUOTE_WEBHOOK_URL ??
  "https://hook.eu2.make.com/vbpnjcvdgu3513depignev2qfvxftx66";

async function sendQuoteWebhook(payload: {
  id: string;
  customer_name: string;
  email: string;
  package_id: string;
  package_name: string;
  quote_amount: number;
}) {
  try {
    const res = await fetch(QUOTE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: payload.id,
        customer_name: payload.customer_name,
        email: payload.email,
        package: payload.package_name,
        package_id: payload.package_id,
        quote_amount: payload.quote_amount,
        quote_amount_vnd: payload.quote_amount.toLocaleString("vi-VN") + "₫",
        created_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      console.error("Quote webhook non-2xx:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("Quote webhook failed:", err);
  }
}

const DEGREE_LEVELS = ["thpt", "dai_hoc", "thac_si"] as const;
const COUNTRY_SET = new Set<string>(countries);
const PACKAGE_SET = new Set<string>(servicePackages.map((p) => p.id));

const EMAIL_TYPO_DOMAINS: Record<string, string> = {
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.vn": "gmail.com",
  "gnail.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahoo.cm": "yahoo.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlook.co": "outlook.com",
  "outllook.com": "outlook.com",
};

function detectEmailTypo(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? (EMAIL_TYPO_DOMAINS[domain] ?? null) : null;
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.SUPABASE_SECRET_KEY ?? "";
  return crypto.createHash("sha256").update(ip + salt).digest("hex").slice(0, 32);
}

export async function POST(req: Request) {
  let body: {
    customer_name?: string;
    country?: string;
    degree?: string;
    package?: string;
    email?: string;
    phone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const customerName = body.customer_name?.trim();
  const country = body.country?.trim();
  const degree = body.degree?.trim();
  const pkg = body.package?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = body.phone?.trim();

  // Validate basics
  if (!customerName || customerName.length < 2 || customerName.length > 120) {
    return NextResponse.json({ error: "Họ tên không hợp lệ" }, { status: 400 });
  }
  if (!country || !COUNTRY_SET.has(country)) {
    return NextResponse.json({ error: "Quốc gia không hợp lệ" }, { status: 400 });
  }
  if (!degree || !DEGREE_LEVELS.includes(degree as (typeof DEGREE_LEVELS)[number])) {
    return NextResponse.json({ error: "Bậc học không hợp lệ" }, { status: 400 });
  }
  if (!pkg || !PACKAGE_SET.has(pkg)) {
    return NextResponse.json({ error: "Gói dịch vụ không hợp lệ" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  }
  const emailSuggestion = detectEmailTypo(email);
  if (emailSuggestion) {
    return NextResponse.json(
      {
        error: `Email có vẻ gõ nhầm. Có phải bạn muốn dùng @${emailSuggestion} không?`,
        suggestion: email.split("@")[0] + "@" + emailSuggestion,
      },
      { status: 400 },
    );
  }
  if (!phone || !/^0\d{8,10}$/.test(phone.replace(/\s/g, ""))) {
    return NextResponse.json(
      { error: "Số điện thoại không hợp lệ (phải bắt đầu bằng 0, 9-11 số)" },
      { status: 400 },
    );
  }

  const chosen = servicePackages.find((p) => p.id === pkg);
  if (!chosen) {
    return NextResponse.json({ error: "Gói không tồn tại" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() ?? null;

  const { data, error } = await supabase
    .from("quote_requests")
    .insert({
      customer_name: customerName,
      country,
      degree_level: degree,
      package: pkg,
      email,
      phone,
      quote_amount: chosen.price,
      ip_hash: hashIp(ip),
    })
    .select("id, quote_amount")
    .single();

  if (error || !data) {
    console.error("Insert quote failed:", error);
    return NextResponse.json({ error: "DB lỗi, thử lại nhé" }, { status: 500 });
  }

  after(() =>
    sendQuoteWebhook({
      id: data.id,
      customer_name: customerName,
      email,
      package_id: chosen.id,
      package_name: chosen.name,
      quote_amount: data.quote_amount,
    }),
  );

  return NextResponse.json({
    ok: true,
    id: data.id,
    quote_amount: data.quote_amount,
  });
}
