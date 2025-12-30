"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { requestCalendar } from "@/lib/api";
import type { CalendarDetails, CalendarPayload } from "@/types/astro";

export default function CalendarPage() {
  const [form, setForm] = useState<CalendarDetails>({ birthDate: "", birthTime: "", birthPlace: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalendarPayload | null>(null);

  const canSubmit = useMemo(() => form.birthDate && form.birthTime && form.birthPlace, [form]);

  const handleChange = (field: keyof CalendarDetails) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await requestCalendar(form);
      setResult(response as CalendarPayload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to fetch calendar conversion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
        <h1 className="text-fluid-xl font-semibold">Śaka Calendar Converter</h1>
        <p className="mt-2 text-sm text-slate-300">
          Convert Gregorian inputs into Śaka calendar insights with mobile-first conversion results.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Birth date / Date of birth" type="date" value={form.birthDate} onChange={handleChange("birthDate")} required />
            <Field label="Birth time / Time of birth" type="time" value={form.birthTime} onChange={handleChange("birthTime")} required />
          </div>
          <Field label="Birth place / Place of birth" value={form.birthPlace} onChange={handleChange("birthPlace")} required />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading ? "Converting..." : "Convert calendar"}
            </Button>
            {loading && <span className="text-xs text-amber-200">Calculating Śaka date...</span>}
          </div>
          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        </form>
      </section>

      <section className="flex flex-col gap-6">
        <div role="status" className="rounded-3xl border border-slate-800 bg-result-gradient p-6" aria-live="polite">
          <h2 className="text-lg font-semibold">Conversion results</h2>
          {!result && !loading && <p className="mt-2 text-sm text-slate-300">Submit the form to view Śaka calendar results.</p>}
          {result && (
            <div className="mt-3 grid gap-3 text-sm text-slate-100">
              <p className="font-semibold">Śaka date: {result.saka_date?.day ?? "—"} {result.saka_date?.month ?? ""} {result.saka_date?.year ?? ""}</p>
              {result.tithi_name && <p className="text-xs text-slate-300">Tithi: {result.tithi_name}</p>}
              {result.weekday && <p className="text-xs text-slate-300">Weekday: {result.weekday}</p>}
              {result.interpretation && <p>{result.interpretation}</p>}
              {result.interpretation_hi && <p className="text-amber-200">{result.interpretation_hi}</p>}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h3 className="text-base font-semibold">Observation details</h3>
          {result ? (
            <ul className="mt-3 grid gap-3 text-sm text-slate-300">
              <li className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">Nakshatra: {result.nakshatra ?? "—"}</li>
              <li className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">Yoga: {result.yoga ?? "—"}</li>
              <li className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">Karana: {result.karana ?? "—"}</li>
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Observation details will appear after conversion.</p>
          )}
        </div>
      </section>
    </div>
  );
}
