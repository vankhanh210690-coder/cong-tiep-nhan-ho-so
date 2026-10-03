"use client";

import React from "react";
import { Sparkles, ChevronDown, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  from: "bot" | "user";
  text: string;
}

const quickQuestions = [
  "Dịch vụ gồm những gì?",
  "Mất bao lâu để có kết quả?",
  "Cần chuẩn bị giấy tờ gì?",
  "Chi phí dịch vụ là bao nhiêu?",
];

const initialMessages: Message[] = [
  {
    from: "bot",
    text: "Chào bạn! Mình là trợ lý ảo của DuHoc24, bạn cần hỗ trợ gì về hồ sơ du học?",
  },
];

export function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { from: "user", text: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
        }),
      });
      const data = await res.json();
      const reply = res.ok
        ? data.reply
        : "Xin lỗi, hệ thống đang bận. Bạn thử lại sau ít phút nhé.";
      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "Không kết nối được. Bạn kiểm tra mạng và thử lại nhé.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        aria-hidden={!open}
        className={cn(
          "absolute bottom-20 right-0 flex h-[30rem] w-[22rem] origin-bottom-right flex-col overflow-hidden rounded-[1.75rem] bg-background/90 shadow-2xl shadow-foreground/15 ring-1 ring-foreground/10 backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] sm:w-[24rem]",
          open
            ? "pointer-events-auto visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible translate-y-6 scale-95 opacity-0",
        )}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 border-b border-foreground/8 px-5 py-4">
          <div>
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/50">
              Hỏi đáp nhanh
            </p>
            <p className="mt-1 font-serif text-lg leading-tight">
              Trợ lý DuHoc24
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[color:var(--sage)]/15 px-2.5 py-1 text-[0.65rem] font-medium text-[color:var(--sage)]">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--sage)] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--sage)]" />
            </span>
            Online
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Đóng khung chat"
            className="flex size-8 items-center justify-center rounded-full transition-colors duration-500 hover:bg-foreground/5"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-5 py-5"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.from === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  m.from === "user"
                    ? "rounded-br-md bg-foreground text-background"
                    : "rounded-bl-md bg-foreground/5 text-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-foreground/5 px-4 py-3">
                <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-foreground/40" />
              </div>
            </div>
          )}
        </div>

        {/* Quick replies + input */}
        <div className="border-t border-foreground/8 bg-background/60 px-4 py-3">
          <div className="flex flex-wrap gap-1.5 pb-2.5">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="rounded-full border border-foreground/10 bg-background/60 px-3 py-1 text-[0.7rem] text-foreground/70 transition-all duration-500 hover:border-[color:var(--umber)]/40 hover:text-[color:var(--umber)] disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 rounded-full bg-background p-1 ring-1 ring-foreground/10"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                loading ? "Trợ lý đang trả lời..." : "Nhập câu hỏi..."
              }
              disabled={loading}
              className="h-9 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-foreground/40 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              aria-label="Gửi"
              disabled={loading || !input.trim()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-all duration-500 hover:bg-foreground/85 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <path
                  d="M4 12l16-8-4 16-4-6-8-2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Trigger button — editorial AI concierge */}
      <div className="relative inline-block">
        {/* Soft outer pulse rings — behind button, visible when closed */}
        {!open && (
          <>
            <span
              className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-[color:var(--umber)]/20"
              style={{ animationDuration: "2.6s" }}
            />
            <span className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-gradient-to-tr from-[color:var(--umber)]/15 via-transparent to-[color:var(--sage)]/15 blur-2xl" />
          </>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Đóng khung chat" : "Mở khung chat hỏi đáp"}
          className="group relative flex items-center gap-3 rounded-full bg-foreground py-2 pl-6 pr-2 text-sm text-background shadow-2xl shadow-foreground/25 ring-1 ring-foreground/20 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-foreground/92 active:scale-[0.97]"
        >
          {/* Inner gradient sheen — clipped to button shape */}
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-background/5 to-[color:var(--umber)]/20 opacity-70" />
          </span>

          <span className="relative hidden font-medium sm:inline">
            {open ? "Thu nhỏ" : "Hỏi đáp AI"}
          </span>

          {/* Icon capsule */}
          <span className="relative flex size-11 items-center justify-center rounded-full bg-[color:var(--umber)] shadow-inner shadow-background/10 ring-1 ring-background/15 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.05]">
            {open ? (
              <ChevronDown className="size-5 stroke-[1.6]" />
            ) : (
              <Sparkles
                className="size-5 stroke-[1.4] fill-background/15"
                strokeLinejoin="round"
              />
            )}
          </span>
        </button>

        {/* AI badge — in wrapper, NOT clipped by button overflow */}
        {!open && (
          <span className="pointer-events-none absolute -right-1 -top-1 z-10 flex items-center gap-1 rounded-full bg-[color:var(--sage)] px-1.5 py-0.5 shadow-lg shadow-[color:var(--sage)]/40 ring-2 ring-background">
            <span className="relative flex size-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-background opacity-80" />
              <span className="relative inline-flex size-1 rounded-full bg-background" />
            </span>
            <span className="font-mono text-[0.55rem] font-semibold uppercase tracking-wider text-background">
              AI
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
