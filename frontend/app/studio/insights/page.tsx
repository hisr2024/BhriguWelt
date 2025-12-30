"use client";

import { useMemo, useState } from "react";

import { ChatPanel } from "@/components/ChatPanel";
import { KundliChart } from "@/components/KundliChart";
import { Button } from "@/components/ui/Button";
import { Field, TextareaField } from "@/components/ui/Field";

type StudioForm = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  question: string;
};

type ChartResponse = {
  interpretation?: string;
  interpretation_hi?: string;
  karmic_epoch?: string;
  chart?: unknown;
};

export default function StudioInsightsPage() {
  const [form, setForm] = useState<StudioForm>({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    question: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChartResponse | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const canSubmit = useMemo(() => form.name && form.birthDate && form.birthTime && form.birthPlace, [form]);

  const handleChange = (field: keyof StudioForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          birth_date: form.birthDate,
          birth_time: form.birthTime,
          birth_place: form.birthPlace,
          question: form.question,
        }),
      });
      const payload = (await response.json()) as ChartResponse & { error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Unable to generate chart");
      }
      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to generate chart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
        <h1 className="text-fluid-xl font-semibold">Studio Insights</h1>
        <p className="mt-2 text-sm text-slate-300">
          A full-screen studio for chart generation, responses, and real-time chat. Optimized for touch and PWA use.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <Field label="Full name" value={form.name} onChange={handleChange("name")} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Birth date / Date of birth" type="date" value={form.birthDate} onChange={handleChange("birthDate")} required />
            <Field label="Birth time / Time of birth" type="time" value={form.birthTime} onChange={handleChange("birthTime")} required />
          </div>
          <Field label="Birth place / Place of birth" value={form.birthPlace} onChange={handleChange("birthPlace")} required />
          <TextareaField label="Focus question" value={form.question} onChange={handleChange("question")} placeholder="What should I know about my next steps?" />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading ? "Fetching..." : "Fetch insights"}
            </Button>
            {loading && <span className="text-xs text-amber-200">Rendering chart...</span>}
            <Button variant="ghost" onClick={() => setChatOpen(true)}>
              Open chat
            </Button>
          </div>
          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        </form>
      </section>

      <section className="flex flex-col gap-6">
        <div
          role="status"
          aria-label="results"
          className="rounded-3xl border border-slate-800 bg-result-gradient p-6"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold">Response</h2>
          {!result && !loading && <p className="mt-2 text-sm text-slate-300">Submit the form to view studio results.</p>}
          {result && (
            <div className="mt-3 grid gap-3 text-sm text-slate-100">
              <p className="font-semibold">Response captured for {form.name}</p>
              {result.karmic_epoch && <p className="text-xs text-slate-300">Karmic epoch: {result.karmic_epoch}</p>}
              {result.interpretation && <p>{result.interpretation}</p>}
              {result.interpretation_hi && <p className="text-amber-200">{result.interpretation_hi}</p>}
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <KundliChart />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h3 className="text-base font-semibold">Interactive chart controls</h3>
          <p className="mt-2 text-xs text-slate-400">Pinch-zoom or swipe to review the chart panel.</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">Tap once to highlight houses.</div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">Swipe right to open navigation.</div>
          </div>
        </div>
      </section>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} chart={result?.chart} context={{ birthDetails: form }} />
    </div>
  );
}
