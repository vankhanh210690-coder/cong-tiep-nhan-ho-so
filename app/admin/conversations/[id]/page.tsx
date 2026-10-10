import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, User, Star, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { DeleteConversationButton } from "@/components/admin/delete-conversation-button";
import { ExtractInsightsButton } from "@/components/admin/extract-insights-button";
import { getAdminClient } from "@/lib/supabase-server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface MessageRow {
  id: string;
  role: "user" | "bot";
  text: string;
  created_at: string;
}

interface Insights {
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  country: string | null;
  degree: string | null;
  major: string | null;
  timeline: string | null;
  has_ielts: boolean | null;
  availability: string | null;
  wants_consultation: boolean | null;
  note: string | null;
  lead_quality: "good" | "ok" | "spam" | null;
  services_discussed: string[] | null;
  lead_captured: boolean;
  quality_score: number | null;
  flow_stage: string | null;
  summary: string | null;
  quality_notes: string | null;
  extracted_at: string;
  model_used: string | null;
}

const LEAD_QUALITY_STYLES: Record<string, { label: string; className: string }> = {
  good: {
    label: "GOOD · Follow ngay",
    className: "bg-[color:var(--sage)]/15 text-[color:var(--sage)] ring-[color:var(--sage)]/30",
  },
  ok: {
    label: "OK · Nurture",
    className: "bg-amber-100 text-amber-700 ring-amber-300",
  },
  spam: {
    label: "SPAM",
    className: "bg-red-100 text-red-700 ring-red-300",
  },
};

interface ConversationDetail {
  id: string;
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  user_agent: string | null;
  messages: MessageRow[];
  insights: Insights | null;
}

async function fetchDetail(id: string): Promise<ConversationDetail | null> {
  const supabase = getAdminClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, session_id, started_at, last_message_at, message_count, user_agent")
    .eq("id", id)
    .maybeSingle();

  if (!conv) return null;

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, role, text, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const { data: insights } = await supabase
    .from("conversation_insights")
    .select("*")
    .eq("conversation_id", id)
    .maybeSingle();

  return {
    ...conv,
    messages: (msgs ?? []) as MessageRow[],
    insights: insights as Insights | null,
  };
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatMsgTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const FLOW_STAGE_LABELS: Record<string, string> = {
  greeting: "Chào hỏi",
  country: "Hỏi quốc gia",
  degree: "Hỏi bậc học",
  service_intro: "Giới thiệu dịch vụ",
  offer_consultation: "Mời tư vấn",
  collecting_contact: "Thu thập contact",
  closed: "Hoàn tất",
  off_topic: "Lạc đề",
};

function QualityStars({ score }: { score: number | null }) {
  if (!score) return <span className="text-foreground/40">—</span>;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-3.5",
            n <= score
              ? "fill-[color:var(--umber)] text-[color:var(--umber)]"
              : "text-foreground/15",
          )}
        />
      ))}
      <span className="ml-1 font-mono text-[0.65rem] text-foreground/50 tabular-nums">
        {score}/5
      </span>
    </div>
  );
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conv = await fetchDetail(id);
  if (!conv) notFound();

  const durationMin = Math.max(
    1,
    Math.round(
      (new Date(conv.last_message_at).getTime() -
        new Date(conv.started_at).getTime()) /
        60000,
    ),
  );

  const insights = conv.insights;

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/conversations"
          className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-background px-3 py-1.5 text-xs text-foreground/70 transition-all duration-300 hover:bg-foreground/5"
        >
          <ArrowLeft className="size-3.5 stroke-[1.4]" />
          Danh sách
        </Link>
      </div>

      <AdminPageHeader
        title="Chi tiết hội thoại"
        description={`Toàn bộ ${conv.messages.length} tin nhắn giữa khách và trợ lý DuHoc24.`}
      />

      {/* Metadata card */}
      <Card className="p-5">
        <dl className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
              Kênh
            </dt>
            <dd className="mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--sage)]/15 px-2.5 py-0.5 text-xs font-medium text-[color:var(--sage)]">
                <span className="size-1.5 rounded-full bg-[color:var(--sage)]" />
                Web
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
              Số tin nhắn
            </dt>
            <dd className="mt-2 font-serif text-2xl tabular-nums">{conv.message_count}</dd>
          </div>
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
              Bắt đầu
            </dt>
            <dd className="mt-2 tabular-nums text-foreground/80">
              {formatDateTime(conv.started_at)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
              Kéo dài
            </dt>
            <dd className="mt-2 tabular-nums text-foreground/80">
              {durationMin < 60
                ? `${durationMin} phút`
                : `${Math.floor(durationMin / 60)}h ${durationMin % 60}p`}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Insights card — Gemini analysis */}
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-medium">Thông tin trích xuất</h2>
            <p className="mt-1 text-xs text-foreground/50">
              {insights
                ? `Phân tích lúc ${formatDateTime(insights.extracted_at)} · ${insights.model_used}`
                : "Chưa phân tích. Bấm nút để Gemini trích xuất lead + đánh giá chất lượng."}
            </p>
          </div>
          <ExtractInsightsButton conversationId={conv.id} />
        </div>

        {insights ? (
          <Card className="p-6">
            {/* Lead quality — badge lớn ưu tiên nhất */}
            {insights.lead_quality && (
              <div className="mb-5">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ring-1",
                    LEAD_QUALITY_STYLES[insights.lead_quality]?.className ?? "",
                  )}
                >
                  <span className="font-mono text-xs uppercase tracking-widest">
                    {LEAD_QUALITY_STYLES[insights.lead_quality]?.label ?? insights.lead_quality}
                  </span>
                </span>
              </div>
            )}

            {/* Phụ: lead captured + quality score + flow stage + wants consultation */}
            <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-foreground/8 pb-5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium",
                  insights.lead_captured
                    ? "bg-[color:var(--sage)]/15 text-[color:var(--sage)]"
                    : "bg-foreground/8 text-foreground/60",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    insights.lead_captured ? "bg-[color:var(--sage)]" : "bg-foreground/40",
                  )}
                />
                {insights.lead_captured ? "Có đủ contact" : "Thiếu contact"}
              </span>
              {insights.wants_consultation !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium",
                    insights.wants_consultation
                      ? "bg-[color:var(--umber)]/15 text-[color:var(--umber)]"
                      : "bg-foreground/8 text-foreground/60",
                  )}
                >
                  {insights.wants_consultation ? "✓ Muốn đặt lịch tư vấn" : "✗ Từ chối tư vấn"}
                </span>
              )}
              <QualityStars score={insights.quality_score} />
              {insights.flow_stage && (
                <span className="rounded-full bg-foreground/8 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-foreground/60">
                  {FLOW_STAGE_LABELS[insights.flow_stage] ?? insights.flow_stage}
                </span>
              )}
            </div>

            {/* Summary */}
            {insights.summary && (
              <div className="mb-6">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Tóm tắt
                </p>
                <p className="mt-2 text-sm leading-relaxed">{insights.summary}</p>
              </div>
            )}

            {/* Contact + needs grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Thông tin khách
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 stroke-[1.3] text-foreground/50" />
                    <dt className="w-16 text-foreground/60">Họ tên</dt>
                    <dd>{insights.lead_name ?? <span className="text-foreground/40">—</span>}</dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 stroke-[1.3] text-foreground/50" />
                    <dt className="w-16 text-foreground/60">Email</dt>
                    <dd className="tabular-nums">
                      {insights.lead_email ?? <span className="text-foreground/40">—</span>}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 stroke-[1.3] text-foreground/50" />
                    <dt className="w-16 text-foreground/60">SĐT</dt>
                    <dd className="tabular-nums">
                      {insights.lead_phone ?? <span className="text-foreground/40">—</span>}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Nhu cầu du học
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <dt className="w-24 text-foreground/60">Quốc gia</dt>
                    <dd>{insights.country ?? <span className="text-foreground/40">—</span>}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="w-24 text-foreground/60">Bậc học</dt>
                    <dd>{insights.degree ?? <span className="text-foreground/40">—</span>}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="w-24 text-foreground/60">Ngành</dt>
                    <dd>{insights.major ?? <span className="text-foreground/40">—</span>}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="w-24 text-foreground/60">Thời gian</dt>
                    <dd>{insights.timeline ?? <span className="text-foreground/40">—</span>}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="w-24 text-foreground/60">IELTS</dt>
                    <dd>
                      {insights.has_ielts === true && "Đã có"}
                      {insights.has_ielts === false && "Chưa có"}
                      {insights.has_ielts === null && (
                        <span className="text-foreground/40">—</span>
                      )}
                    </dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="w-24 text-foreground/60">Khung giờ rảnh</dt>
                    <dd>{insights.availability ?? <span className="text-foreground/40">—</span>}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Note khách để lại */}
            {insights.note && (
              <div className="mt-6 border-t border-foreground/8 pt-5">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Ghi chú/câu hỏi khách để lại
                </p>
                <p className="mt-2 text-sm italic text-foreground/70">
                  "{insights.note}"
                </p>
              </div>
            )}

            {/* Services discussed */}
            {insights.services_discussed && insights.services_discussed.length > 0 && (
              <div className="mt-6 border-t border-foreground/8 pt-5">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Dịch vụ đã trao đổi
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {insights.services_discussed.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-foreground/15 bg-background px-2.5 py-1 text-xs text-foreground/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* QA notes */}
            {insights.quality_notes && (
              <div className="mt-6 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                  Nhận xét chất lượng
                </p>
                <p className="mt-2 text-sm italic text-foreground/70">
                  {insights.quality_notes}
                </p>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <Sparkles className="mx-auto size-6 stroke-[1.3] text-foreground/30" />
            <p className="mt-3 text-sm text-foreground/60">
              Chưa có phân tích. Bấm nút trên để Gemini đọc hội thoại và trích
              xuất lead + đánh giá chất lượng.
            </p>
          </Card>
        )}
      </section>

      {/* Message thread */}
      <section className="mt-10 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium">Nội dung hội thoại</h2>
          <DeleteConversationButton
            conversationId={conv.id}
            previewText={conv.messages[conv.messages.length - 1]?.text ?? ""}
          />
        </div>

        <div className="rounded-[1.5rem] bg-foreground/5 p-2 ring-1 ring-foreground/8">
          <div className="space-y-3 rounded-[calc(1.5rem-0.375rem)] bg-background p-5 md:p-6">
            {conv.messages.length === 0 && (
              <p className="py-10 text-center text-sm text-foreground/50">
                Hội thoại chưa có tin nhắn nào.
              </p>
            )}
            {conv.messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className="flex max-w-[80%] flex-col gap-1">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "rounded-br-md bg-foreground text-background"
                        : "rounded-bl-md bg-foreground/5 text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[0.6rem] uppercase tracking-wider text-foreground/40",
                      m.role === "user" ? "text-right" : "text-left",
                    )}
                  >
                    {m.role === "user" ? "Khách" : "Trợ lý"} · {formatMsgTime(m.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
