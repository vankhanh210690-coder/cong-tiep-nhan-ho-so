"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function ExtractAllButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    if (pendingCount === 0) return;
    const ok = window.confirm(
      `Phân tích ${pendingCount} hội thoại chưa có insight?\n\n` +
        `Mỗi hội thoại tốn 1 Gemini API call, có thể mất 30-60 giây tùy số lượng.`,
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/conversations/extract-pending", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(`Lỗi: ${data.error ?? res.statusText}`);
        return;
      }
      const msg = data.failed > 0
        ? `Hoàn tất: ${data.processed}/${data.total} thành công, ${data.failed} lỗi.`
        : `Hoàn tất: đã phân tích ${data.processed} hội thoại.`;
      window.alert(msg);
      router.refresh();
    } catch (err) {
      console.error(err);
      window.alert("Không kết nối được, thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  if (pendingCount === 0) return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="group inline-flex items-center gap-2 rounded-full bg-foreground py-2 pl-4 pr-2 text-sm font-medium text-background shadow-lg shadow-foreground/15 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/90 active:scale-[0.97] disabled:opacity-50"
    >
      <span>
        {loading
          ? `Đang phân tích ${pendingCount}...`
          : `Phân tích ${pendingCount} hội thoại chưa có`}
      </span>
      <span className="flex size-7 items-center justify-center rounded-full bg-background/15 transition-all duration-300 group-hover:bg-background/25">
        <Sparkles
          className={`size-3.5 stroke-[1.4] ${loading ? "animate-pulse" : ""}`}
        />
      </span>
    </button>
  );
}
