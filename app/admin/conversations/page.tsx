import Link from "next/link";
import { Eye, Star } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteConversationButton } from "@/components/admin/delete-conversation-button";
import { getAdminClient } from "@/lib/supabase-server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ConversationWithLatest {
  id: string;
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  latest_text: string | null;
  lead_captured: boolean | null;
  quality_score: number | null;
  lead_name: string | null;
}

async function fetchConversations(): Promise<ConversationWithLatest[]> {
  const supabase = getAdminClient();

  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id, session_id, started_at, last_message_at, message_count")
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error || !convs) {
    console.error("Admin fetch conversations failed:", error);
    return [];
  }

  const ids = convs.map((c) => c.id);
  if (ids.length === 0) return [];

  // Fetch latest message snippet
  const { data: latestRows } = await supabase
    .from("messages")
    .select("conversation_id, text, created_at")
    .in("conversation_id", ids)
    .order("created_at", { ascending: false });

  const latestByConv = new Map<string, string>();
  (latestRows ?? []).forEach((r) => {
    if (!latestByConv.has(r.conversation_id)) {
      latestByConv.set(r.conversation_id, r.text);
    }
  });

  // Fetch insights
  const { data: insights } = await supabase
    .from("conversation_insights")
    .select("conversation_id, lead_captured, quality_score, lead_name")
    .in("conversation_id", ids);

  const insightsByConv = new Map<
    string,
    { lead_captured: boolean | null; quality_score: number | null; lead_name: string | null }
  >();
  (insights ?? []).forEach((i) => insightsByConv.set(i.conversation_id, i));

  return convs.map((c) => {
    const ins = insightsByConv.get(c.id);
    return {
      ...c,
      latest_text: latestByConv.get(c.id) ?? null,
      lead_captured: ins?.lead_captured ?? null,
      quality_score: ins?.quality_score ?? null,
      lead_name: ins?.lead_name ?? null,
    };
  });
}

function formatTime(iso: string): string {
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

export default async function AdminConversationsPage() {
  const conversations = await fetchConversations();

  return (
    <>
      <AdminPageHeader
        title="Hội thoại"
        description={`${conversations.length} hội thoại gần nhất của khách với chatbot DuHoc24.`}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kênh</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead>Chất lượng</TableHead>
              <TableHead>Số tin</TableHead>
              <TableHead>Tin nhắn gần nhất</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Chưa có hội thoại nào. Khách gửi tin trên trang chủ sẽ hiện ở đây.
                </TableCell>
              </TableRow>
            )}
            {conversations.map((conv) => (
              <TableRow key={conv.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--sage)]/15 px-2.5 py-0.5 text-xs font-medium text-[color:var(--sage)]">
                    <span className="size-1.5 rounded-full bg-[color:var(--sage)]" />
                    Web
                  </span>
                </TableCell>
                <TableCell>
                  {conv.lead_captured === true ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--sage)]/15 px-2 py-0.5 text-[0.65rem] font-medium text-[color:var(--sage)]">
                      ✓ {conv.lead_name ?? "Có lead"}
                    </span>
                  ) : conv.lead_captured === false ? (
                    <span className="font-mono text-[0.65rem] text-foreground/40">Không</span>
                  ) : (
                    <span className="font-mono text-[0.65rem] text-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {conv.quality_score ? (
                    <div className="inline-flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={cn(
                            "size-3",
                            n <= conv.quality_score!
                              ? "fill-[color:var(--umber)] text-[color:var(--umber)]"
                              : "text-foreground/15",
                          )}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="font-mono text-[0.65rem] text-foreground/30">—</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {conv.message_count}
                </TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">
                  <Link
                    href={`/admin/conversations/${conv.id}`}
                    className="transition-colors duration-300 hover:text-foreground hover:underline underline-offset-4"
                  >
                    {conv.latest_text ?? "—"}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTime(conv.last_message_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={`/admin/conversations/${conv.id}`}
                      aria-label="Xem chi tiết"
                      className="inline-flex size-7 items-center justify-center rounded-full text-foreground/50 transition-all duration-300 hover:bg-foreground/10 hover:text-foreground"
                    >
                      <Eye className="size-3.5 stroke-[1.3]" />
                    </Link>
                    <DeleteConversationButton
                      conversationId={conv.id}
                      previewText={conv.latest_text ?? ""}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
