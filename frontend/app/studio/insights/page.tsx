"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import KundliChart from "../../components/KundliChart";

type InsightResponse = {
  interpretation?: string;
  name?: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function InsightsStudioPage() {
  const [formState, setFormState] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [statusMessage, setStatusMessage] = useState("Awaiting your birth details.");
  const [response, setResponse] = useState<InsightResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${backendBaseUrl}/horoscope`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          birth_date: formState.birthDate,
          birth_time: formState.birthTime,
          birth_place: formState.birthPlace,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to fetch insights.");
      }

      const data = (await response.json()) as InsightResponse;
      setResponse(data);
      setStatusMessage(`Response ready for ${data.name || formState.name || "Seeker"}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setStatusMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const message = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: message }]);
    setChatInput("");

    try {
      const response = await fetch(`${backendBaseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Unable to reach chat.");
      }

      const data = (await response.json()) as { reply?: string };
      if (data.reply) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply || "" }]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "We could not connect to chat right now." },
      ]);
    }
  };

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <h1 className="text-fluid-xl font-semibold">Insights Dashboard</h1>
          <p className="mt-3 text-sm text-slate-300">
            Connect the core horoscope, live chat, and ritual guidance in a single studio experience.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm">
              Full name
              <input
                value={formState.name}
                onChange={handleChange("name")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Birth date
              <input
                type="date"
                value={formState.birthDate}
                onChange={handleChange("birthDate")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Birth time
              <input
                type="time"
                value={formState.birthTime}
                onChange={handleChange("birthTime")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Birth place
              <input
                value={formState.birthPlace}
                onChange={handleChange("birthPlace")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                required
              />
            </label>
            <button
              type="submit"
              className="mt-2 rounded-full bg-aurora px-6 py-3 text-sm font-semibold text-slate-900"
            >
              {loading ? "Fetching…" : "Fetch insights"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Results summary</p>
              <p role="status" aria-label="Results" className="mt-2 text-sm text-aurora">
                Response · {statusMessage}
              </p>
            </div>
            <KundliChart className="h-20 w-20 text-aurora" />
          </div>
          <div className="mt-6 space-y-4 text-sm text-slate-200">
            <p className="font-semibold">Response narrative</p>
            <p>{response?.interpretation || "Run a reading to generate the latest manuscript response."}</p>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
            Bhrigu insight blending chart dynamics with manuscript context. Export summaries or share with mentors.
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Live chart conversation</h2>
            <p className="text-sm text-slate-300">Ask about transits, remedies, or pacing.</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
            onClick={() => setChatOpen((prev) => !prev)}
          >
            {chatOpen ? "Close chat" : "Open chat"}
          </button>
        </div>

        {chatOpen && (
          <div className="mt-6 grid gap-4">
            <div className="max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
              {chatMessages.length === 0 && (
                <p className="text-slate-400">Ask about the chart to start your transcript.</p>
              )}
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user" ? "bg-aurora/10 text-aurora" : "bg-white/10 text-slate-200"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask about the chart"
                className="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm"
              />
              <button
                type="button"
                className="rounded-full bg-aurora px-6 py-3 text-sm font-semibold text-slate-900"
                onClick={handleSendChat}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
