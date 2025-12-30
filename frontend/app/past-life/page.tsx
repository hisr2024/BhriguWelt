"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { requestPrediction } from "@/lib/api";
import type { BirthDetails } from "@/types/astro";

type PastLifeResponse = {
  name?: string;
  interpretation?: string;
  interpretation_hi?: string;
  insights?: { narrative?: string; sutra_reference?: string; confidence?: number }[];
};

export default function PastLifePage() {
  const [form, setForm] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PastLifeResponse | null>(null);

  const canSubmit = useMemo(() => form.name && form.birthDate && form.birthTime && form.birthPlace, [form]);

  const handleChange = (field: keyof BirthDetails) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = (await requestPrediction("past-life", form)) as PastLifeResponse;
      setResult(response);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to fetch past-life insights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
        <h1 className="text-fluid-xl font-semibold">Past-Life Engine</h1>
        <p className="mt-2 text-sm text-slate-300">
          Enter your core birth details to unlock the past-life narrative drawn from the Bhrigu manuscripts.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <Field label="Full name" name="name" value={form.name} onChange={handleChange("name")} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Birth date / Date of birth" type="date" value={form.birthDate} onChange={handleChange("birthDate")} required />
            <Field label="Birth time / Time of birth" type="time" value={form.birthTime} onChange={handleChange("birthTime")} required />
          </div>
          <Field label="Birth place / Place of birth" value={form.birthPlace} onChange={handleChange("birthPlace")} required />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading ? "Reading folios..." : "Reveal past-life story"}
            </Button>
            {loading && <span className="text-xs text-amber-200">Aligning timelines...</span>}
          </div>
          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        </form>
      </section>

      <section className="flex flex-col gap-6">
        <div role="status" className="rounded-3xl border border-slate-800 bg-result-gradient p-6" aria-live="polite">
          <h2 className="text-lg font-semibold">Past-life results</h2>
          {!result && !loading && <p className="mt-2 text-sm text-slate-300">Submit the form to view past-life results.</p>}
          {result && (
            <div className="mt-3 grid gap-3 text-sm text-slate-100">
              <p className="font-semibold">{result.name || form.name}</p>
              <p>{result.interpretation}</p>
              {result.interpretation_hi && <p className="text-amber-200">{result.interpretation_hi}</p>}
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h3 className="text-base font-semibold">Sutra highlights</h3>
          <ul className="mt-3 grid gap-3 text-sm text-slate-300">
            {(result?.insights || []).map((insight, index) => (
              <li key={`${insight.sutra_reference}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs text-amber-200">{insight.sutra_reference || "Manuscript"}</p>
                <p>{insight.narrative}</p>
                {typeof insight.confidence === "number" && (
                  <p className="text-xs text-slate-400">Confidence: {(insight.confidence * 100).toFixed(0)}%</p>
                )}
              </li>
            ))}
            {!result?.insights?.length && <li className="text-xs text-slate-500">Insights will appear here.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
