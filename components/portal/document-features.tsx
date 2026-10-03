import type { LucideIcon } from "lucide-react";
import { DocStatusBadge } from "@/components/status-badge";
import type { DocStatus } from "@/lib/mock-data";

interface DocumentFeature {
  icon: LucideIcon;
  title: string;
  accept: string;
  fileName: string;
  status: DocStatus;
  reason?: string;
}

export function DocumentFeatures({ items }: { items: DocumentFeature[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className="group">
          <div className="rounded-[1.5rem] bg-foreground/5 p-1.5 ring-1 ring-foreground/8 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:ring-foreground/15">
            <div className="flex aspect-[5/3] flex-col items-center justify-center gap-3 rounded-[calc(1.5rem-0.375rem)] bg-background p-6">
              <item.icon className="size-7 stroke-[1.1] text-foreground/60" />
              <span className="max-w-full truncate px-4 font-mono text-[0.65rem] text-foreground/60">
                {item.fileName}
              </span>
            </div>
          </div>

          <div className="mt-5 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-xl font-medium text-foreground">
                {item.title}
              </h3>
              <DocStatusBadge status={item.status} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/60">
              {item.status === "can_nop_lai" && item.reason ? (
                <>
                  Cần nộp lại:{" "}
                  <span className="text-[color:var(--destructive)]">
                    {item.reason}
                  </span>
                </>
              ) : (
                item.accept
              )}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
