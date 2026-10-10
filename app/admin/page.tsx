import Link from "next/link";
import { MessageSquare, UserCheck, Star, Globe2, FileText, GraduationCap } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { getAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchStats() {
  const supabase = getAdminClient();

  const [convsRes, insightsRes] = await Promise.all([
    supabase.from("conversations").select("id, message_count, last_message_at").order("last_message_at", { ascending: false }),
    supabase.from("conversation_insights").select("lead_captured, quality_score, country"),
  ]);

  const convs = convsRes.data ?? [];
  const insights = insightsRes.data ?? [];

  const totalConversations = convs.length;
  const totalMessages = convs.reduce((s, c) => s + (c.message_count ?? 0), 0);
  const analyzedCount = insights.length;
  const leadCount = insights.filter((i) => i.lead_captured).length;
  const leadRate = analyzedCount > 0 ? Math.round((leadCount / analyzedCount) * 100) : 0;
  const qualityScores = insights.map((i) => i.quality_score).filter((s): s is number => typeof s === "number");
  const avgQuality = qualityScores.length > 0
    ? (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1)
    : null;

  // Top countries
  const countryMap = new Map<string, number>();
  insights.forEach((i) => {
    if (i.country) {
      const key = String(i.country).trim();
      countryMap.set(key, (countryMap.get(key) ?? 0) + 1);
    }
  });
  const topCountries = Array.from(countryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Recent conversations (last 24h)
  const dayAgo = new Date(Date.now() - 24 * 3600_000);
  const recent24h = convs.filter((c) => new Date(c.last_message_at) >= dayAgo).length;

  return {
    totalConversations,
    totalMessages,
    recent24h,
    analyzedCount,
    leadCount,
    leadRate,
    avgQuality,
    topCountries,
  };
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "default" | "sage" | "umber";
}

function StatCard({ label, value, sub, icon: Icon, accent = "default" }: StatCardProps) {
  const accentClass =
    accent === "sage"
      ? "text-[color:var(--sage)]"
      : accent === "umber"
        ? "text-[color:var(--umber)]"
        : "text-foreground";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
          {label}
        </p>
        <Icon className="size-4 stroke-[1.3] text-foreground/40" />
      </div>
      <p className={`mt-3 font-serif text-4xl font-light tabular-nums ${accentClass}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-foreground/50">{sub}</p>}
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const stats = await fetchStats();

  return (
    <>
      <AdminPageHeader
        title="Tổng quan"
        description="Số liệu chatbot tư vấn du học DuHoc24 (realtime từ Supabase)."
      />

      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Hội thoại"
          value={stats.totalConversations}
          sub={`${stats.totalMessages} tin nhắn tổng`}
          icon={MessageSquare}
        />
        <StatCard
          label="24h gần nhất"
          value={stats.recent24h}
          sub="hội thoại mới"
          icon={MessageSquare}
          accent="sage"
        />
        <StatCard
          label="Có lead"
          value={stats.leadCount}
          sub={
            stats.analyzedCount > 0
              ? `${stats.leadRate}% trên ${stats.analyzedCount} đã phân tích`
              : "Chưa phân tích hội thoại nào"
          }
          icon={UserCheck}
          accent="umber"
        />
        <StatCard
          label="Chất lượng TB"
          value={stats.avgQuality ?? "—"}
          sub={stats.avgQuality ? "trên thang điểm 5" : "Cần phân tích để có điểm"}
          icon={Star}
        />
      </div>

      {/* Top countries + navigation */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
              Top quốc gia khách quan tâm
            </p>
            <Globe2 className="size-4 stroke-[1.3] text-foreground/40" />
          </div>
          {stats.topCountries.length === 0 ? (
            <p className="mt-5 text-sm text-foreground/50">
              Chưa có dữ liệu — cần phân tích hội thoại để có insight.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.topCountries.map(([country, count], i) => {
                const max = stats.topCountries[0][1];
                const pct = Math.round((count / max) * 100);
                return (
                  <li key={country}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[0.65rem] text-foreground/40">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-medium">{country}</span>
                      </span>
                      <span className="font-mono text-xs tabular-nums text-foreground/60">
                        {count}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/5">
                      <div
                        className="h-full rounded-full bg-[color:var(--umber)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
            Điều hướng nhanh
          </p>
          <nav className="mt-5 grid gap-2">
            <Link
              href="/admin/conversations"
              className="group flex items-center justify-between rounded-xl border border-foreground/10 bg-background p-4 transition-all duration-300 hover:border-foreground/25 hover:bg-foreground/[0.02]"
            >
              <span className="flex items-center gap-3">
                <MessageSquare className="size-4 stroke-[1.3] text-foreground/60" />
                <span className="font-medium">Hội thoại chatbot</span>
              </span>
              <span className="font-mono text-xs tabular-nums text-foreground/50 group-hover:text-foreground">
                {stats.totalConversations}
              </span>
            </Link>
            <Link
              href="/admin/requests"
              className="group flex items-center justify-between rounded-xl border border-foreground/10 bg-background p-4 transition-all duration-300 hover:border-foreground/25 hover:bg-foreground/[0.02]"
            >
              <span className="flex items-center gap-3">
                <FileText className="size-4 stroke-[1.3] text-foreground/60" />
                <span className="font-medium">Yêu cầu báo giá</span>
              </span>
              <span className="font-mono text-[0.65rem] text-foreground/40">mock</span>
            </Link>
            <Link
              href="/admin/schools"
              className="group flex items-center justify-between rounded-xl border border-foreground/10 bg-background p-4 transition-all duration-300 hover:border-foreground/25 hover:bg-foreground/[0.02]"
            >
              <span className="flex items-center gap-3">
                <GraduationCap className="size-4 stroke-[1.3] text-foreground/60" />
                <span className="font-medium">Danh sách trường</span>
              </span>
              <span className="font-mono text-[0.65rem] text-foreground/40">mock</span>
            </Link>
            <Link
              href="/admin/profiles"
              className="group flex items-center justify-between rounded-xl border border-foreground/10 bg-background p-4 transition-all duration-300 hover:border-foreground/25 hover:bg-foreground/[0.02]"
            >
              <span className="flex items-center gap-3">
                <UserCheck className="size-4 stroke-[1.3] text-foreground/60" />
                <span className="font-medium">Hồ sơ học viên</span>
              </span>
              <span className="font-mono text-[0.65rem] text-foreground/40">mock</span>
            </Link>
          </nav>
        </Card>
      </div>
    </>
  );
}
