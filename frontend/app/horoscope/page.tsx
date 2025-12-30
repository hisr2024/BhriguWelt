"use client";

import { useMemo, useState } from "react";

import { KundliChart } from "@/components/KundliChart";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SelectField } from "@/components/ui/Select";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { requestPrediction } from "@/lib/api";
import type { BirthDetails } from "@/types/astro";

type HoroscopeResponse = {
  name?: string;
  interpretation?: string;
  interpretation_hi?: string;
  karmic_epoch?: string;
};

export default function HoroscopePage() {
  const [form, setForm] = useState<BirthDetails>(DEFAULT_BIRTH_DETAILS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HoroscopeResponse | null>(null);

  const canSubmit = useMemo(() => {
    return Boolean(form.name && form.birthDate && form.birthTime && form.birthPlace);
  }, [form]);

  const handleChange = (field: keyof BirthDetails) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let value: string | boolean = event.target.value;
    if (event.target.type === "checkbox") {
      value = (event.target as HTMLInputElement).checked;
    }
    if (field === "rahuAspectsAscendant") {
      value = event.target.value === "yes";
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const localResponse = await fetch("/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          birth_date: form.birthDate,
          birth_time: form.birthTime,
          birth_place: form.birthPlace,
          lunar_tithi: form.lunarTithi,
          mars_house: form.marsHouse,
          saturn_house: form.saturnHouse,
          venus_house: form.venusHouse,
          rahu_aspects_ascendant: form.rahuAspectsAscendant,
        }),
      });
      if (localResponse.ok) {
        const response = (await localResponse.json()) as HoroscopeResponse;
        setResult(response);
      } else {
        const response = (await requestPrediction("horoscope", form)) as HoroscopeResponse;
        setResult(response);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to fetch horoscope");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
        <h1 className="text-fluid-xl font-semibold">Horoscope Engine</h1>
        <p className="mt-2 text-sm text-slate-300">
          Capture your birth details and generate a bilingual reading. Designed for one-hand mobile use with sticky actions.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" value={form.name} onChange={handleChange("name")} required />
            <Field
              label="Birth date / Date of birth"
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={handleChange("birthDate")}
              required
            />
            <Field
              label="Birth time / Time of birth"
              name="birthTime"
              type="time"
              value={form.birthTime}
              onChange={handleChange("birthTime")}
              required
            />
            <Field
              label="Birth place / Place of birth"
              name="birthPlace"
              value={form.birthPlace}
              onChange={handleChange("birthPlace")}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lunar tithi" name="lunarTithi" value={form.lunarTithi} onChange={handleChange("lunarTithi")} />
            <Field label="Mars house" name="marsHouse" value={form.marsHouse} onChange={handleChange("marsHouse")} />
            <Field label="Saturn house" name="saturnHouse" value={form.saturnHouse} onChange={handleChange("saturnHouse")} />
            <Field label="Venus house" name="venusHouse" value={form.venusHouse} onChange={handleChange("venusHouse")} />
            <SelectField
              label="Rahu aspects"
              name="rahuAspectsAscendant"
              value={form.rahuAspectsAscendant ? "yes" : "no"}
              onChange={handleChange("rahuAspectsAscendant")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </SelectField>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading ? "Generating..." : "Generate reading · Fetch insights"}
            </Button>
            {loading && <span className="text-xs text-amber-200">Reading in progress...</span>}
          </div>
          {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
        </form>
      </section>

      <section className="flex flex-col gap-6">
        <div
          role="status"
          className="rounded-3xl border border-slate-800 bg-result-gradient p-6"
          aria-live="polite"
        >
          <h2 className="text-lg font-semibold">Reading status</h2>
          {!result && !loading && <p className="mt-2 text-sm text-slate-300">Submit the form to view the manuscripts.</p>}
          {loading && <p className="mt-2 text-sm text-amber-200">Reading captured, aligning interpretations...</p>}
          {result && (
            <div className="mt-3 grid gap-3 text-sm text-slate-100">
              <p className="font-semibold">Reading captured for {result.name || form.name}</p>
              {result.karmic_epoch && <p className="text-xs text-slate-300">Karmic epoch: {result.karmic_epoch}</p>}
            </div>
          )}
        </div>

        <div className="grid gap-4 rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold">Interpretation</h3>
            <div className="flex gap-2">
              <Button variant="ghost">Ask in chat</Button>
              <Button variant="ghost">Save PDF</Button>
            </div>
          </div>
          {result ? (
            <div className="grid gap-3 text-sm text-slate-200">
              <p>{result.interpretation || "No interpretation yet."}</p>
              {result.interpretation_hi && <p className="text-sm text-amber-200">{result.interpretation_hi}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Interpretation will appear after the engine responds.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h3 className="text-base font-semibold">Kundli chart</h3>
          <p className="mt-2 text-xs text-slate-400">Chart remains square for mobile clarity.</p>
          <div className="mt-4 flex justify-center">
            <KundliChart />
          </div>
        </div>
      </section>
    </div>
  );
}
