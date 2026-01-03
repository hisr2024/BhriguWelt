'use client';

import { FormEvent, useEffect, useRef, useState } from "react";

import { ChatContext } from "@/types/chat";
import { NatalChart } from "@/types/natal";
import { useImmersiveFeedback } from "@/lib/immersive";
import { getProfileIdentifiers, persistProfileIdentifiers } from "@/lib/profileStorage";

type Message = {
  role: "user" | "bot";
  content: string;
};

type ChatResponse = {
  reply?: string;
  chart?: NatalChart;
  context?: ChatContext;
  session?: { transcript?: { role?: string; content?: string }[] };
  profile_id?: number;
  user_id?: string;
  session_key?: string;
  fallback?: boolean;
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
  const [profileId, setProfileId] = useState<number | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [sessionKey, setSessionKey] = useState<string | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();

  useEffect(() => {
    if (chart) {
      setCurrentChart(chart);
      setContext((prev) => ({ ...prev, lastChart: chart }));
    }
  }, [chart]);

  useEffect(() => {
    const { userId: storedUserId, profileId: storedProfileId, sessionKey: storedSession } = getProfileIdentifiers();
    setUserId(storedUserId);
    setProfileId(storedProfileId);
    setSessionKey(storedSession);

    let isMounted = true;

    const hydrateSession = async () => {
      try {
        const params = new URLSearchParams({ user_id: storedUserId, session_key: storedSession });
        const response = await fetch(`/api/bhrigu-chat?${params.toString()}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const payload: ChatResponse = await response.json();

        if (!isMounted) return;

        const transcriptMessages: Message[] = (payload.session?.transcript || [])
          .filter((entry) => entry.content)
          .map((entry) => ({ role: entry.role === "user" ? "user" : "bot", content: entry.content || "" }));

        if (transcriptMessages.length) {
          setMessages((prev) => [prev[0], ...transcriptMessages]);
        }
        if (payload.profile_id) setProfileId(payload.profile_id);
        if (payload.user_id) setUserId(payload.user_id);
      } catch (error) {
        if (!isMounted) return;
        console.warn("Unable to hydrate chat session", error);
        setStatusMessage("Chat history will sync after the backend reconnects.");
      }
    };

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleChartReady = (event: Event) => {
      const custom = event as CustomEvent<{ chart?: NatalChart; details?: Record<string, unknown> }>;
      if (custom.detail?.chart && (custom.detail.chart as NatalChart).metadata) {
        setCurrentChart(custom.detail.chart as NatalChart);
        setContext((prev) => ({ ...prev, lastChart: custom.detail.chart as NatalChart }));
      }
      if (custom.detail?.details) {
        setContext((prev) => ({ ...prev, birthDetails: custom.detail.details as ChatContext["birthDetails"] }));
      }
    };

    window.addEventListener("bhrigu:chart-ready", handleChartReady);
    window.addEventListener("bhrigu:open-chat", handleChartReady);
    return () => {
      window.removeEventListener("bhrigu:chart-ready", handleChartReady);
      window.removeEventListener("bhrigu:open-chat", handleChartReady);
    };
  }, []);

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isSending) return;

    const activeSessionKey = sessionKey || getProfileIdentifiers().sessionKey;
    if (!sessionKey) {
      setSessionKey(activeSessionKey);
    }

    triggerSubmitFeedback();

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/bhrigu-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          chart: currentChart,
          context,
          userId,
          profileId,
          sessionKey: activeSessionKey,
        }),
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

      if (data.profile_id || data.user_id || data.session_key) {
        persistProfileIdentifiers({
          profileId: data.profile_id,
          userId: data.user_id,
          sessionKey: data.session_key || activeSessionKey,
        });
        if (data.profile_id) setProfileId(data.profile_id);
        if (data.user_id) setUserId(data.user_id);
        if (data.session_key) setSessionKey(data.session_key);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "I couldn’t reach the folios right now. Please try again shortly.",
        },
      ]);
      setStatusMessage("Retry once your connection stabilizes or the backend wakes up.");
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

      <div
        className="bhrigu-chat__window"
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-busy={isSending}
      >
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

      {statusMessage ? (
        <p className="microcopy" role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

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
