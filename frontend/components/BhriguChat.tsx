'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { ChatContext } from "@/types/chat";
import { NatalChart } from "@/types/natal";
import { useImmersiveFeedback } from "@/lib/immersive";

type Message = {
  role: "user" | "bot";
  content: string;
};

type ChatResponse = {
  reply?: string;
  chart?: NatalChart;
  context?: ChatContext;
};

type Props = {
  chart?: NatalChart;
};

const GUIDE_NAME = "Bhrigu Samhita Guide";
const GUIDE_GLYPH = "◐";

export default function BhriguChat({ chart }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    role: "bot",
    content:
      "Namaste. I am your Bhrigu Samhita Guide. Ask about your chart and I will respond with calm, symbolic reflections.",
  }]);
  const [context, setContext] = useState<ChatContext | undefined>(
    chart ? { lastChart: chart } : undefined,
  );
  const [currentChart, setCurrentChart] = useState<NatalChart | undefined>(chart);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();

  useEffect(() => {
    if (chart) {
      setCurrentChart(chart);
      setContext((prev) => ({ ...prev, lastChart: chart }));
    }
  }, [chart]);

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isSending) return;

    triggerSubmitFeedback();

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/bhrigu-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, chart: currentChart, context }),
      });

      if (!response.ok) {
        throw new Error("Unable to reach the guide right now.");
      }

      const data: ChatResponse = await response.json();
      const reply = data.reply?.trim() ||
        "I’m here whenever you want to reflect on your Bhrigu chart or share more context.";

      setMessages((prev) => [...prev, { role: "bot", content: reply }]);

      const nextChart = data.chart || currentChart;
      const nextContext = data.context || context;
      const mergedContext =
        nextContext || context
          ? { ...(context ?? {}), ...(nextContext ?? {}) }
          : undefined;

      if (nextChart) {
        setCurrentChart(nextChart);
      }

      if (mergedContext || nextChart) {
        setContext({ ...(mergedContext || {}), lastChart: nextChart ?? mergedContext?.lastChart });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "I couldn’t reach the folios right now. Please try again shortly.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="bhrigu-chat" aria-label="Bhrigu Samhita chat">
      <header className="bhrigu-chat__header">
        <div className="bhrigu-chat__crest" aria-hidden>
          <span className="bhrigu-chat__glyph">{GUIDE_GLYPH}</span>
        </div>
        <div>
          <p className="eyebrow">{GUIDE_NAME}</p>
          <h3 className="bhrigu-chat__title">Guidance with a quiet Bharat pulse</h3>
          <p className="muted">
            Share a question or reflection. I’ll weave your message with Bhrigu-inspired calm.
          </p>
        </div>
      </header>

      <div className="bhrigu-chat__window" ref={listRef} role="log" aria-live="polite">
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`bhrigu-chat__message ${message.role === "user" ? "is-user" : "is-guide"}`.trim()}
          >
            <span className="bhrigu-chat__label">{message.role === "user" ? "You" : GUIDE_NAME}</span>
            <div className="bhrigu-chat__bubble">{message.content}</div>
          </article>
        ))}
      </div>

      <form className="bhrigu-chat__input" onSubmit={handleSend}>
        <label className="sr-only" htmlFor="bhrigu-message">
          Message for the guide
        </label>
        <input
          id="bhrigu-message"
          name="message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about the chart, remedies, or timelines"
          autoComplete="off"
        />
        <button type="submit" disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}
