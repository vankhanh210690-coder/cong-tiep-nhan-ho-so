"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

type Status = "cho_duyet" | "da_duyet" | "tu_choi";

export function RequestActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: Status;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function update(status: Status) {
    if (loading || status === currentStatus) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(`Lỗi: ${data.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } catch {
      window.alert("Không kết nối được.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={() => update("da_duyet")}
        disabled={loading || currentStatus === "da_duyet"}
        aria-label="Duyệt"
        className="inline-flex size-7 items-center justify-center rounded-full text-[color:var(--sage)] transition-all duration-300 hover:bg-[color:var(--sage)]/15 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Check className="size-3.5 stroke-[2]" />
      </button>
      <button
        onClick={() => update("tu_choi")}
        disabled={loading || currentStatus === "tu_choi"}
        aria-label="Từ chối"
        className="inline-flex size-7 items-center justify-center rounded-full text-foreground/50 transition-all duration-300 hover:bg-destructive/10 hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <X className="size-3.5 stroke-[2]" />
      </button>
    </div>
  );
}
