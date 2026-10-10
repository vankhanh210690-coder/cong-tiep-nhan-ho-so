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
import { getAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ConversationWithLatest {
  id: string;
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
  latest_text: string | null;
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

  // Fetch latest message snippet cho mỗi conversation
  const ids = convs.map((c) => c.id);
  if (ids.length === 0) return [];

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

  return convs.map((c) => ({
    ...c,
    latest_text: latestByConv.get(c.id) ?? null,
  }));
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
              <TableHead>Số tin</TableHead>
              <TableHead>Tin nhắn gần nhất</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Cập nhật</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                <TableCell className="tabular-nums">
                  {conv.message_count}
                </TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">
                  {conv.latest_text ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTime(conv.started_at)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTime(conv.last_message_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
