import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAdminClient } from "@/lib/supabase-server";
import { countries, servicePackages } from "@/lib/mock-data";

export const runtime = "nodejs";

const DEGREE_LEVELS = ["thpt", "dai_hoc", "thac_si"] as const;
const COUNTRY_SET = new Set<string>(countries);
const PACKAGE_SET = new Set<string>(servicePackages.map((p) => p.id));

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
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  }
  if (!phone || phone.length < 8 || phone.length > 20) {
    return NextResponse.json({ error: "SĐT không hợp lệ" }, { status: 400 });
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

  return NextResponse.json({
    ok: true,
    id: data.id,
    quote_amount: data.quote_amount,
  });
}
