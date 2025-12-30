"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { getFutureProgress, requestPrediction } from "@/lib/api";
import type { BirthDetails } from "@/types/astro";

type FutureResponse = {
  name?: string;
  interpretation?: string;
  interpretation_hi?: string;
  trajectories?: { focus?: string; window?: string; certainty?: number }[];
};

type ProgressResponse = {
  karmic_resolution?: number;
  milestones?: { label?: string; completion?: number; planet?: string }[];
};

export default function FuturePage() {
  const [form, setForm] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FutureResponse | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  const canSubmit = useMemo(() => form.name && form.birthDate && form.birthTime && form.birthPlace, [form]);

  const handleChange = (field: keyof BirthDetails) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = (await requestPrediction("future", form)) as FutureResponse;
      setResult(response);
      const progressResponse = (await getFutureProgress()) as ProgressResponse;
      setProgress(progressResponse);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to fetch future insights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
        <h1 className="text-fluid-xl font-semibold">Future Engine</h1>
        <p className="mt-2 text-sm text-slate-300">
          Receive forward-looking trajectories alongside progress milestones for your karmic roadmap.
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
              {loading ? "Charting..." : "Generate future map"}
            </Button>
            {loading && <span className="text-xs text-amber-200">Calculating trajectories...</span>}
          </div>
          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        </form>
      </section>

      <section className="flex flex-col gap-6">
        <div role="status" className="rounded-3xl border border-slate-800 bg-result-gradient p-6" aria-live="polite">
          <h2 className="text-lg font-semibold">Future narrative</h2>
          {!result && !loading && <p className="mt-2 text-sm text-slate-300">Submit the form to read your future narrative.</p>}
          {result && (
            <div className="mt-3 grid gap-3 text-sm text-slate-100">
              <p className="font-semibold">{result.name || form.name}</p>
              <p>{result.interpretation}</p>
              {result.interpretation_hi && <p className="text-amber-200">{result.interpretation_hi}</p>}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h3 className="text-base font-semibold">Trajectory focus</h3>
          <ul className="mt-3 grid gap-3 text-sm text-slate-300">
            {(result?.trajectories || []).map((trajectory, index) => (
              <li key={`${trajectory.focus}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs text-amber-200">{trajectory.window || "Upcoming phase"}</p>
                <p className="font-semibold text-slate-100">{trajectory.focus}</p>
                {typeof trajectory.certainty === "number" && (
                  <p className="text-xs text-slate-400">Certainty: {(trajectory.certainty * 100).toFixed(0)}%</p>
                )}
              </li>
            ))}
            {!result?.trajectories?.length && <li className="text-xs text-slate-500">Trajectories will appear here.</li>}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h3 className="text-base font-semibold">Karmic progress</h3>
          {progress ? (
            <div className="mt-3 grid gap-3 text-sm text-slate-300">
              <p className="text-sm text-slate-100">Resolution score: {progress.karmic_resolution ?? 0}%</p>
              {(progress.milestones || []).map((milestone, index) => (
                <div key={`${milestone.label}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs text-amber-200">{milestone.planet}</p>
                  <p className="font-semibold text-slate-100">{milestone.label}</p>
                  <p className="text-xs text-slate-400">Completion: {milestone.completion ?? 0}%</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Progress data will load after your reading.</p>
          )}
        </div>
      </section>
    </div>
  );
}
