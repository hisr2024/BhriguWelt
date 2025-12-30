"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field, TextareaField } from "@/components/ui/Field";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { requestMatchmaking } from "@/lib/api";
import type { BirthDetails } from "@/types/astro";

type MatchmakingResponse = {
  summary?: string;
  compatibility_score?: number;
  highlights?: { title?: string; detail?: string }[];
};

export default function MatchmakingPage() {
  const [primary, setPrimary] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS);
  const [partner, setPartner] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS);
  const [preferences, setPreferences] = useState("values, career, family, travel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchmakingResponse | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(primary.name && primary.birthDate && primary.birthTime && primary.birthPlace && partner.name && partner.birthDate && partner.birthTime && partner.birthPlace);
  }, [primary, partner]);

  const updatePrimary = (field: keyof BirthDetails) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrimary((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const updatePartner = (field: keyof BirthDetails) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPartner((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = (await requestMatchmaking(primary, partner, preferences)) as MatchmakingResponse;
      setResult(response);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to fetch matchmaking insights");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
        <h1 className="text-fluid-xl font-semibold">Matchmaking Engine</h1>
        <p className="mt-2 text-sm text-slate-300">
          Compare two charts with modern preference tags. All inputs stay responsive on mobile side-by-side stacks.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
          <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-semibold text-amber-200">Primary profile</h2>
            <Field label="Full name" value={primary.name} onChange={updatePrimary("name")} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Birth date / Date of birth" type="date" value={primary.birthDate} onChange={updatePrimary("birthDate")} required />
              <Field label="Birth time / Time of birth" type="time" value={primary.birthTime} onChange={updatePrimary("birthTime")} required />
            </div>
            <Field label="Birth place / Place of birth" value={primary.birthPlace} onChange={updatePrimary("birthPlace")} required />
          </div>

          <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
            <h2 className="text-sm font-semibold text-amber-200">Partner profile</h2>
            <Field label="Full name" value={partner.name} onChange={updatePartner("name")} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Birth date / Date of birth" type="date" value={partner.birthDate} onChange={updatePartner("birthDate")} required />
              <Field label="Birth time / Time of birth" type="time" value={partner.birthTime} onChange={updatePartner("birthTime")} required />
            </div>
            <Field label="Birth place / Place of birth" value={partner.birthPlace} onChange={updatePartner("birthPlace")} required />
          </div>

          <TextareaField
            label="Modern preferences"
            value={preferences}
            onChange={(event) => setPreferences(event.target.value)}
            placeholder="values, family, career, travel"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading ? "Matching..." : "Generate compatibility"}
            </Button>
            {loading && <span className="text-xs text-amber-200">Aligning charts...</span>}
          </div>
          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        </form>
      </section>

      <section className="flex flex-col gap-6">
        <div role="status" className="rounded-3xl border border-slate-800 bg-result-gradient p-6" aria-live="polite">
          <h2 className="text-lg font-semibold">Compatibility summary</h2>
          {!result && !loading && <p className="mt-2 text-sm text-slate-300">Submit both profiles to see the match quality.</p>}
          {result && (
            <div className="mt-3 grid gap-3 text-sm text-slate-100">
              <p>{result.summary || "Compatibility overview ready."}</p>
              {typeof result.compatibility_score === "number" && (
                <p className="text-xs text-slate-300">Score: {Math.round(result.compatibility_score * 100)}%</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h3 className="text-base font-semibold">Highlights</h3>
          <ul className="mt-3 grid gap-3 text-sm text-slate-300">
            {(result?.highlights || []).map((highlight, index) => (
              <li key={`${highlight.title}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs text-amber-200">{highlight.title}</p>
                <p>{highlight.detail}</p>
              </li>
            ))}
            {!result?.highlights?.length && <li className="text-xs text-slate-500">Highlights will appear here.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}
