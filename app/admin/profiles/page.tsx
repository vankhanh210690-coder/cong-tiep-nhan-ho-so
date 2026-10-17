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
import { DocStatusBadge } from "@/components/status-badge";
import { getAdminClient } from "@/lib/supabase-server";
import type { DocStatus } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProfileRow {
  session_id: string;
  full_name: string | null;
  identity_name: string | null;
  ielts_name: string | null;
  date_of_birth: string | null;
  identity_dob: string | null;
  gpa: number | null;
  ielts_overall: number | null;
  identity_number: string | null;
  updated_at: string;
}

interface DocRow {
  session_id: string;
  doc_type: "transcript" | "ielts" | "identity";
  status: DocStatus;
}

async function fetchData() {
  const supabase = getAdminClient();
  const [profilesRes, docsRes] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("session_id, full_name, identity_name, ielts_name, date_of_birth, identity_dob, gpa, ielts_overall, identity_number, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase.from("documents").select("session_id, doc_type, status"),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const docs = (docsRes.data ?? []) as DocRow[];

  const docsBySession = new Map<string, Record<string, DocStatus>>();
  docs.forEach((d) => {
    const existing = docsBySession.get(d.session_id) ?? {};
    existing[d.doc_type] = d.status;
    docsBySession.set(d.session_id, existing);
  });

  return profiles.map((p) => ({
    ...p,
    docs: docsBySession.get(p.session_id) ?? {},
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

export default async function AdminProfilesPage() {
  const profiles = await fetchData();
  const withData = profiles.filter(
    (p) => p.full_name || p.identity_number || p.gpa != null || p.ielts_overall != null,
  );

  return (
    <>
      <AdminPageHeader
        title="Hồ sơ học viên"
        description={`${profiles.length} session cổng hồ sơ (${withData.length} đã có dữ liệu trích xuất), mới nhất trước.`}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Ngày sinh</TableHead>
              <TableHead>Số GT</TableHead>
              <TableHead>GPA</TableHead>
              <TableHead>IELTS</TableHead>
              <TableHead>Bảng điểm</TableHead>
              <TableHead>IELTS</TableHead>
              <TableHead>CCCD</TableHead>
              <TableHead>Cập nhật</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Chưa có hồ sơ nào.
                </TableCell>
              </TableRow>
            )}
            {profiles.map((p) => {
              const displayName = p.full_name ?? p.identity_name ?? p.ielts_name;
              const displayDob = p.date_of_birth ?? p.identity_dob;
              return (
                <TableRow key={p.session_id}>
                  <TableCell className="font-mono text-xs text-foreground/60">
                    {p.session_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {displayName ?? <span className="text-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {displayDob ?? <span className="text-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs text-foreground/70">
                    {p.identity_number ?? <span className="text-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {p.gpa != null ? Number(p.gpa).toFixed(1) : <span className="text-foreground/40">—</span>}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {p.ielts_overall != null ? Number(p.ielts_overall).toFixed(1) : <span className="text-foreground/40">—</span>}
                  </TableCell>
                  {(["transcript", "ielts", "identity"] as const).map((t) => (
                    <TableCell key={t}>
                      {p.docs[t] ? (
                        <DocStatusBadge status={p.docs[t]} />
                      ) : (
                        <span className="font-mono text-[0.65rem] text-foreground/40">
                          chưa nộp
                        </span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-muted-foreground">
                    {formatTime(p.updated_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
