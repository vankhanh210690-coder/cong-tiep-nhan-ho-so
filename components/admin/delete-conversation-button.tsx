"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  conversationId: string;
  previewText: string;
}

export function DeleteConversationButton({ conversationId, previewText }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleDelete() {
    const snippet = previewText.slice(0, 60);
    const ok = window.confirm(
      `Xoá hội thoại này?\n\n"${snippet}${previewText.length > 60 ? "..." : ""}"\n\nHành động không thể hoàn tác.`,
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(`Xoá thất bại: ${data.error ?? res.statusText}`);
        return;
      }
      // Refresh server component để fetch lại list mới
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
      onClick={handleDelete}
      disabled={loading}
      aria-label="Xoá hội thoại"
      className="inline-flex size-7 items-center justify-center rounded-full text-foreground/40 transition-all duration-300 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
    >
      <Trash2 className="size-3.5 stroke-[1.3]" />
    </button>
  );
}
