import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { DeleteConversationButton } from "@/components/admin/delete-conversation-button";
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

interface ConversationDetail {
  id: string;
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  user_agent: string | null;
  messages: MessageRow[];
}

async function fetchDetail(id: string): Promise<ConversationDetail | null> {
  const supabase = getAdminClient();

  const { data: conv, error: cErr } = await supabase
    .from("conversations")
    .select(
      "id, session_id, started_at, last_message_at, message_count, user_agent",
    )
    .eq("id", id)
    .maybeSingle();

  if (cErr || !conv) {
    console.error("Fetch conversation failed:", cErr);
    return null;
  }

  const { data: msgs, error: mErr } = await supabase
    .from("messages")
    .select("id, role, text, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (mErr) {
    console.error("Fetch messages failed:", mErr);
    return null;
  }

  return {
    ...conv,
    messages: (msgs ?? []) as MessageRow[],
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
      second: "2-digit",
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
            <dd className="mt-2 font-serif text-2xl tabular-nums">
              {conv.message_count}
            </dd>
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
          {conv.user_agent && (
            <div className="sm:col-span-2 lg:col-span-4">
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-foreground/50">
                Thiết bị
              </dt>
              <dd className="mt-2 truncate font-mono text-xs text-foreground/60">
                {conv.user_agent}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {/* Message thread */}
      <section className="mt-8 space-y-3">
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
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
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
                    {m.role === "user" ? "Khách" : "Trợ lý"} ·{" "}
                    {formatMsgTime(m.created_at)}
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
