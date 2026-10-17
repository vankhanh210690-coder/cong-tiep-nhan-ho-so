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
  user_id: string;
  email: string;
  full_name: string | null;
  gpa: number | null;
  ielts: number | null;
  updated_at: string;
}

interface DocRow {
  user_id: string;
  doc_type: "transcript" | "ielts" | "identity";
  status: DocStatus;
}

async function fetchData() {
  const supabase = getAdminClient();
  const [profilesRes, docsRes] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("user_id, email, full_name, gpa, ielts, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase.from("documents").select("user_id, doc_type, status"),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileRow[];
  const docs = (docsRes.data ?? []) as DocRow[];

  const docsByUser = new Map<string, Record<string, DocStatus>>();
  docs.forEach((d) => {
    const existing = docsByUser.get(d.user_id) ?? {};
    existing[d.doc_type] = d.status;
    docsByUser.set(d.user_id, existing);
  });

  return profiles.map((p) => ({
    ...p,
    docs: docsByUser.get(p.user_id) ?? {},
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

  return (
    <>
      <AdminPageHeader
        title="Hồ sơ học viên"
        description={`${profiles.length} học viên đã đăng nhập cổng hồ sơ, sắp xếp theo cập nhật mới nhất.`}
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>GPA</TableHead>
              <TableHead>IELTS</TableHead>
              <TableHead>Bảng điểm</TableHead>
              <TableHead>IELTS doc</TableHead>
              <TableHead>CCCD</TableHead>
              <TableHead>Cập nhật</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Chưa có học viên nào đăng nhập cổng hồ sơ.
                </TableCell>
              </TableRow>
            )}
            {profiles.map((p) => (
              <TableRow key={p.user_id}>
                <TableCell className="font-medium">{p.email}</TableCell>
                <TableCell>
                  {p.full_name ?? <span className="text-foreground/40">—</span>}
                </TableCell>
                <TableCell className="tabular-nums">
                  {p.gpa != null ? Number(p.gpa).toFixed(1) : <span className="text-foreground/40">—</span>}
                </TableCell>
                <TableCell className="tabular-nums">
                  {p.ielts != null ? Number(p.ielts).toFixed(1) : <span className="text-foreground/40">—</span>}
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
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
