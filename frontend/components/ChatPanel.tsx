"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  chart?: unknown;
  context?: unknown;
}

export function ChatPanel({ open, onClose, chart, context }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bhrigu-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, chart, context, sessionKey: "studio" }),
      });
      const payload = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Unable to send message");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: payload.reply || "Acknowledged." }]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "Unable to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className={`fixed right-0 top-0 z-40 h-full w-full max-w-md border-l border-slate-800 bg-slate-950/95 px-5 py-6 shadow-2xl transition-all sm:w-[420px] ${
        open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 invisible pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bhrigu Chat</h3>
        <Button variant="ghost" onClick={onClose} aria-label="Close chat">
          ✕
        </Button>
      </div>
      <div className="mt-4 flex h-[70vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm">
        {messages.length === 0 && <p className="text-slate-400">Ask about the chart to start the conversation.</p>}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              message.role === "user" ? "self-end bg-amber-400 text-slate-900" : "self-start bg-slate-800 text-slate-100"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      {error && <p className="mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
      <div className="mt-4 flex gap-3">
        <input
          className="flex-1 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
          placeholder="Ask about the chart"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void sendMessage();
            }
          }}
        />
        <Button onClick={sendMessage} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </Button>
      </div>
    </aside>
  );
}
