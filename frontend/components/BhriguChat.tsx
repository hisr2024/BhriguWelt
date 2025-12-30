'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { ChatContext } from "@/types/chat";
import { NatalChart } from "@/types/natal";
import { useImmersiveFeedback } from "@/lib/immersive";
import { resolveChatSocketUrl } from "@/lib/chatSocket";
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
  profile?: {
    id?: number;
    user_id?: string;
    full_name?: string;
    date_of_birth?: string;
    time_of_birth?: string;
    place_of_birth?: string;
  };
  profile_id?: number;
  user_id?: string;
  session_key?: string;
  fallback?: boolean;
};

type Props = {
  chart?: NatalChart;
};

type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResultLike = { 0: SpeechRecognitionAlternative; length: number };
type SpeechRecognitionResultListLike = ArrayLike<SpeechRecognitionResultLike>;
type SpeechRecognitionEventLike = Event & { results: SpeechRecognitionResultListLike };
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechRecognitionWindow = typeof window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const GUIDE_NAME = "Bhrigu Samhita Guide";
const GUIDE_GLYPH = "◐";
const CHAT_ENDPOINT = "/api/bhrigu-chat";
const BASE_MESSAGE: Message = {
  role: "bot",
  content:
    "Namaste. I am your Bhrigu Samhita Guide. Ask about your chart and I will respond with calm, symbolic reflections.",
};
const STORAGE_KEY = "bhrigu-chat-transcript";
const DOCK_KEY = "bhrigu-chat-dock";

export default function BhriguChat({ chart }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([BASE_MESSAGE]);
  const [context, setContext] = useState<ChatContext | undefined>(
    chart ? { lastChart: chart } : undefined,
  );
  const [currentChart, setCurrentChart] = useState<NatalChart | undefined>(chart);
  const [isSending, setIsSending] = useState(false);
  const [profileId, setProfileId] = useState<number | undefined>();
  const [userId, setUserId] = useState<string | undefined>();
  const [sessionKey, setSessionKey] = useState<string | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<"idle" | "connecting" | "connected" | "closed" | "error">("idle");
  const [isDockOpen, setIsDockOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechSeedRef = useRef<string>("");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedRef = useRef(false);
  const { triggerSubmitFeedback } = useImmersiveFeedback();
  const socketUrl = resolveChatSocketUrl();

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

    if (typeof window !== "undefined") {
      const cachedMessages = window.localStorage.getItem(STORAGE_KEY);
      if (cachedMessages) {
        try {
          const parsed = JSON.parse(cachedMessages) as Message[];
          if (parsed.length) {
            setMessages([BASE_MESSAGE, ...parsed.filter((entry) => entry.content)]);
          }
        } catch (error) {
          console.warn("Unable to restore chat transcript", error);
        }
      }

      const storedDock = window.localStorage.getItem(DOCK_KEY);
      if (storedDock === "closed") {
        setIsDockOpen(false);
      }
    }

    const hydrateSession = async () => {
      try {
        const params = new URLSearchParams({ user_id: storedUserId, session_key: storedSession });
        const response = await fetch(`${CHAT_ENDPOINT}?${params.toString()}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const payload: ChatResponse = await response.json();
        const transcriptMessages: Message[] = (payload.session?.transcript || [])
          .filter((entry) => entry.content)
          .map((entry) => ({ role: entry.role === "user" ? "user" : "bot", content: entry.content || "" }));

        if (transcriptMessages.length) {
          setMessages([BASE_MESSAGE, ...transcriptMessages]);
        }
        const hydratedProfileId = payload.profile?.id ?? payload.profile_id;
        const hydratedUserId = payload.profile?.user_id ?? payload.user_id;

        if (payload.profile?.full_name || payload.profile?.date_of_birth) {
          setContext((prev) => ({
            ...prev,
            birthDetails: {
              name: payload.profile?.full_name || prev?.birthDetails?.name || "",
              dateOfBirth: payload.profile?.date_of_birth || prev?.birthDetails?.dateOfBirth || "",
              timeOfBirth: payload.profile?.time_of_birth || prev?.birthDetails?.timeOfBirth || "",
              placeOfBirth: payload.profile?.place_of_birth || prev?.birthDetails?.placeOfBirth || "",
            },
          }));
        }

        if (hydratedProfileId || hydratedUserId) {
          persistProfileIdentifiers({
            profileId: hydratedProfileId,
            userId: hydratedUserId,
            sessionKey: storedSession,
          });
        }

        if (hydratedProfileId) setProfileId(hydratedProfileId);
        if (hydratedUserId) setUserId(hydratedUserId);
      } catch (error) {
        console.warn("Unable to hydrate chat session", error);
        setStatusMessage("Chat history will sync after the backend reconnects.");
      } finally {
        hasHydratedRef.current = true;
      }
    };

    void hydrateSession();
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === "undefined") return;
    const stored = messages.filter((entry) => entry.role !== "bot" || entry.content !== BASE_MESSAGE.content);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(-40)));
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join("")
        .trim();
      const base = speechSeedRef.current;
      const next = [base, transcript].filter(Boolean).join(" ").trim();
      setInput(next);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setStatusMessage("Microphone access is unavailable. Please type your question instead.");
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
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

  const applyChatResponse = useCallback(
    (data: ChatResponse) => {
      const reply =
        data.reply?.trim() ||
        "I’m here whenever you want to reflect on your Bhrigu chart or share more context.";

      setMessages((prev) => [...prev, { role: "bot", content: reply }]);

      if (data.chart) {
        setCurrentChart(data.chart);
      }

      if (data.context || data.chart) {
        setContext((prev) => {
          const merged = { ...(prev ?? {}), ...(data.context ?? {}) };
          const resolvedChart = data.chart || merged.lastChart;
          if (resolvedChart) {
            merged.lastChart = resolvedChart;
          }
          return Object.keys(merged).length ? merged : undefined;
        });
      }

      if (data.profile_id || data.user_id || data.session_key) {
        const nextSessionKey = data.session_key || sessionKey || getProfileIdentifiers().sessionKey;
        persistProfileIdentifiers({
          profileId: data.profile_id,
          userId: data.user_id,
          sessionKey: nextSessionKey,
        });
        if (data.profile_id) setProfileId(data.profile_id);
        if (data.user_id) setUserId(data.user_id);
        if (data.session_key) setSessionKey(data.session_key);
      }

      setIsSending(false);
    },
    [sessionKey],
  );

  useEffect(() => {
    if (!socketUrl) return;

    let shouldReconnect = true;

    const connect = () => {
      setSocketStatus("connecting");
      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setSocketStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as ChatResponse & { error?: string };
          if (payload.error) {
            setStatusMessage(payload.error);
            setIsSending(false);
            return;
          }
          applyChatResponse(payload);
        } catch (error) {
          console.warn("Unable to parse chat socket payload", error);
          setStatusMessage("Live chat update was malformed.");
          setIsSending(false);
        }
      };

      socket.onerror = () => {
        setSocketStatus("error");
      };

      socket.onclose = () => {
        setSocketStatus("closed");
        if (shouldReconnect) {
          reconnectTimerRef.current = setTimeout(connect, 3500);
        }
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [applyChatResponse, socketUrl]);

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
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            message: trimmed,
            chart: currentChart,
            context,
            user_id: userId,
            profile_id: profileId,
            session_key: activeSessionKey,
          }),
        );
        return;
      }

      const response = await fetch(CHAT_ENDPOINT, {
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
      applyChatResponse(data);
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
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        setIsSending(false);
      }
    }
  };

  const handleDockToggle = () => {
    setIsDockOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DOCK_KEY, next ? "open" : "closed");
      }
      return next;
    });
  };

  const handleMicToggle = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      return;
    }
    speechSeedRef.current = input.trim();
    setStatusMessage(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.warn("Unable to start speech recognition", error);
    }
  };

  return (
    <div
      className={`bhrigu-chat-dock ${isDockOpen ? "is-open" : "is-closed"}`.trim()}
      data-bhrigu-chat
    >
      <button
        type="button"
        className="bhrigu-chat-dock__toggle"
        aria-expanded={isDockOpen}
        onClick={handleDockToggle}
      >
        <span aria-hidden>◐</span>
        <span>{isDockOpen ? "Hide chat" : "Open chat"}</span>
      </button>

      {isDockOpen ? (
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
            <span
              className={`bhrigu-chat__status bhrigu-chat__status--${socketStatus}`.trim()}
              aria-live="polite"
            >
              {socketStatus === "connected" ? "Live" : "Fallback"}
            </span>
            <button type="button" className="bhrigu-chat__collapse" onClick={handleDockToggle}>
              Collapse
            </button>
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
            {speechSupported ? (
              <button
                type="button"
                className={`bhrigu-chat__mic ${isListening ? "is-listening" : ""}`.trim()}
                onClick={handleMicToggle}
              >
                {isListening ? "Listening…" : "Mic"}
              </button>
            ) : null}
            <button type="submit" disabled={isSending}>
              {isSending ? "Sending..." : "Send"}
            </button>
          </form>

          <div className="bhrigu-chat__disclaimer">
            <p>
              This chat is reflective and spiritual in tone. It is not medical, legal, or financial advice. Keep
              private details to a minimum.
            </p>
            <p>Session memory is stored on this device and synced when the guide reconnects.</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
