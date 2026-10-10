"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function ExtractInsightsButton({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleExtract() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/conversations/${conversationId}/extract`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        window.alert(`Trích xuất thất bại: ${data.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      window.alert("Không kết nối được, thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExtract}
      disabled={loading}
      className="group inline-flex items-center gap-2 rounded-full bg-foreground py-2 pl-4 pr-2 text-sm font-medium text-background shadow-lg shadow-foreground/15 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/90 active:scale-[0.97] disabled:opacity-50"
    >
      <span>{loading ? "Đang phân tích..." : "Phân tích hội thoại"}</span>
      <span className="flex size-7 items-center justify-center rounded-full bg-background/15 transition-all duration-300 group-hover:bg-background/25">
        <Sparkles
          className={`size-3.5 stroke-[1.4] ${loading ? "animate-pulse" : ""}`}
        />
      </span>
    </button>
  );
}
