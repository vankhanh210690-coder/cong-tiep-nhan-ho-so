import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestActions } from "@/components/admin/request-actions";
import { getAdminClient } from "@/lib/supabase-server";
import { servicePackages } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface QuoteRow {
  id: string;
  country: string;
  degree_level: string;
  package: string;
  email: string;
  phone: string;
  quote_amount: number;
  status: "cho_duyet" | "da_duyet" | "tu_choi";
  created_at: string;
}

function formatVnd(value: number) {
  return value.toLocaleString("vi-VN") + "₫";
}

function packageLabel(id: string) {
  return servicePackages.find((p) => p.id === id)?.name ?? id;
}

function degreeLabel(id: string) {
  return (
    { thpt: "THPT", dai_hoc: "Đại học", thac_si: "Thạc sĩ" }[id] ?? id
  );
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

async function fetchQuotes(): Promise<QuoteRow[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Fetch quotes failed:", error);
    return [];
  }
  return (data ?? []) as QuoteRow[];
}

export default async function AdminRequestsPage() {
  const quotes = await fetchQuotes();

  return (
    <>
      <AdminPageHeader
        title="Yêu cầu báo giá"
        description={`${quotes.length} yêu cầu từ form báo giá trang chủ, mới nhất trước.`}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>SĐT</TableHead>
              <TableHead>Quốc gia</TableHead>
              <TableHead>Bậc / Gói</TableHead>
              <TableHead>Báo giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="w-24 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Chưa có yêu cầu nào. Khách điền form báo giá trên trang chủ sẽ hiện ở đây.
                </TableCell>
              </TableRow>
            )}
            {quotes.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium tabular-nums">{q.email}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{q.phone}</TableCell>
                <TableCell>{q.country}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {degreeLabel(q.degree_level)} · {packageLabel(q.package)}
                </TableCell>
                <TableCell className="tabular-nums font-medium">
                  {formatVnd(q.quote_amount)}
                </TableCell>
                <TableCell>
                  <RequestStatusBadge status={q.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTime(q.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <RequestActions id={q.id} currentStatus={q.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
