'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type HoroscopeFormState = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  lunarTithi: string;
  moonElement: string;
  marsHouse: string;
  saturnHouse: string;
  venusHouse: string;
  rahuAspectsAscendant: string;
};

type ManuscriptCitation = {
  source: string;
  reference?: string;
  excerpt?: string;
};

type ResultSection = {
  title: string;
  narrative: string;
  citations: ManuscriptCitation[];
};

type HoroscopeResponse = {
  name?: string;
  karmic_epoch?: string;
  interpretation?: string;
  sections?: Array<{
    title?: string;
    narrative?: string;
    citations?: ManuscriptCitation[];
  }>;
  manuscript_citations?: ManuscriptCitation[];
  principles?: Array<{ title?: string; detail?: string; citations?: ManuscriptCitation[] }>;
  remedies?: Array<{ title?: string; detail?: string; citations?: ManuscriptCitation[] }>;
  past_life_insights?: Array<{ title?: string; detail?: string; citations?: ManuscriptCitation[] }>;
  future_trajectories?: Array<{ title?: string; detail?: string; citations?: ManuscriptCitation[] }>;
};

const STORAGE_KEY_FORM = "bhrigu:horoscope-form";
const STORAGE_KEY_RESULT = "bhrigu:horoscope-result";

const defaultForm: HoroscopeFormState = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  lunarTithi: "",
  moonElement: "",
  marsHouse: "",
  saturnHouse: "",
  venusHouse: "",
  rahuAspectsAscendant: "no",
};

function normalizeSections(response: HoroscopeResponse | null): ResultSection[] {
  if (!response) return [];

  const fromSections = response.sections
    ?.filter((section) => section?.title || section?.narrative)
    .map((section) => ({
      title: section.title ?? "Manuscript guidance",
      narrative: section.narrative ?? "",
      citations: section.citations ?? [],
    }));

  if (fromSections?.length) return fromSections;

  const grouped: Array<{ title: string; entries?: Array<{ title?: string; detail?: string; citations?: ManuscriptCitation[] }> }>
    = [
      { title: "Principles", entries: response.principles },
      { title: "Remedies", entries: response.remedies },
      { title: "Past-life insights", entries: response.past_life_insights },
      { title: "Future trajectories", entries: response.future_trajectories },
    ];

  const derived = grouped
    .filter((group) => group.entries?.length)
    .map((group) => ({
      title: group.title,
      narrative: group.entries
        ?.map((entry) => `${entry.title ? `${entry.title}: ` : ""}${entry.detail ?? ""}`)
        .join("\n\n")
        .trim() ?? "",
      citations:
        group.entries
          ?.flatMap((entry) => entry.citations ?? [])
          .filter((citation) => citation.source) ?? [],
    }))
    .filter((section) => section.narrative);

  if (derived.length) return derived;

  const fallbackCitations = response.manuscript_citations ?? [];
  const fallbackNarrative = response.interpretation ?? "No interpretation returned yet.";

  return [
    {
      title: "Horoscope overview",
      narrative: fallbackNarrative,
      citations: fallbackCitations,
    },
  ];
}

export default function HoroscopeSession() {
  const [form, setForm] = useState<HoroscopeFormState>(defaultForm);
  const [result, setResult] = useState<HoroscopeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedForm = window.localStorage.getItem(STORAGE_KEY_FORM);
    const savedResult = window.localStorage.getItem(STORAGE_KEY_RESULT);

    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm) as HoroscopeFormState;
        setForm({ ...defaultForm, ...parsed });
      } catch (formError) {
        console.warn("Unable to parse saved horoscope form", formError);
      }
    }

    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult) as HoroscopeResponse);
      } catch (resultError) {
        console.warn("Unable to parse saved horoscope result", resultError);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!result) return;
    window.localStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(result));
  }, [result]);

  const sections = useMemo(() => normalizeSections(result), [result]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: form.name,
        birth_date: form.birthDate,
        birth_time: form.birthTime,
        birth_place: form.birthPlace,
        lunar_tithi: form.lunarTithi ? Number(form.lunarTithi) : null,
        moon_element: form.moonElement,
        mars_house: form.marsHouse ? Number(form.marsHouse) : null,
        saturn_house: form.saturnHouse ? Number(form.saturnHouse) : null,
        venus_house: form.venusHouse ? Number(form.venusHouse) : null,
        rahu_aspects_ascendant: form.rahuAspectsAscendant === "yes",
      };

      const response = await fetch("/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const data = (await response.json()) as HoroscopeResponse;
      setResult(data);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to fetch horoscope.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof HoroscopeFormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <section
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-3xl border border-indigo-200/50 bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-950 px-6 py-10 text-slate-100 shadow-[0_25px_80px_rgba(15,23,42,0.55)]"
      aria-label="Horoscope form and results"
    >
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200/80">Manuscript-guided horoscope</p>
        <h2 className="text-3xl font-semibold text-amber-100">Cosmic profile intake</h2>
        <p className="text-sm text-indigo-100/80">
          Provide your birth details to reveal manuscript citations and curated guidance in calm, cosmic tones.
        </p>
      </header>

      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 rounded-2xl border border-indigo-400/30 bg-indigo-950/60 p-6 shadow-inner">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Full name
              <input
                aria-label="Full name"
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50 placeholder:text-indigo-200/50"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="e.g. Asha Rao"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Birth date
              <input
                aria-label="Birth date"
                type="date"
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.birthDate}
                onChange={handleChange("birthDate")}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Birth time
              <input
                aria-label="Birth time"
                type="time"
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.birthTime}
                onChange={handleChange("birthTime")}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Birth place
              <input
                aria-label="Birth place"
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.birthPlace}
                onChange={handleChange("birthPlace")}
                placeholder="City, Country"
                required
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Lunar tithi
              <input
                aria-label="Lunar tithi"
                type="number"
                min={0}
                max={30}
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.lunarTithi}
                onChange={handleChange("lunarTithi")}
                placeholder="0-30"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Moon element
              <input
                aria-label="Moon element"
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.moonElement}
                onChange={handleChange("moonElement")}
                placeholder="Water, Fire, Earth"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Mars house
              <input
                aria-label="Mars house"
                type="number"
                min={1}
                max={12}
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.marsHouse}
                onChange={handleChange("marsHouse")}
                placeholder="1-12"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Saturn house
              <input
                aria-label="Saturn house"
                type="number"
                min={1}
                max={12}
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.saturnHouse}
                onChange={handleChange("saturnHouse")}
                placeholder="1-12"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Venus house
              <input
                aria-label="Venus house"
                type="number"
                min={1}
                max={12}
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.venusHouse}
                onChange={handleChange("venusHouse")}
                placeholder="1-12"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-indigo-100">
              Rahu aspects ascendant
              <select
                aria-label="Rahu aspects ascendant"
                className="rounded-lg border border-indigo-300/40 bg-indigo-950/60 px-4 py-2 text-sm text-amber-50"
                value={form.rahuAspectsAscendant}
                onChange={handleChange("rahuAspectsAscendant")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-full border border-amber-200/60 bg-amber-200/20 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-200/30"
          aria-label="Submit horoscope request"
          disabled={loading}
        >
          {loading ? "Consulting the manuscripts…" : "Reveal horoscope"}
        </button>
      </form>

      <div className="rounded-2xl border border-indigo-400/30 bg-indigo-950/40 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">Results</p>
          {error ? (
            <p role="alert" className="text-sm text-rose-200">
              {error}
            </p>
          ) : result ? (
            <div role="status" className="space-y-2 text-sm text-indigo-100">
              <p>
                <span className="font-semibold text-amber-100">Name:</span> {result.name || form.name}
              </p>
              <p>
                <span className="font-semibold text-amber-100">Karmic epoch:</span> {result.karmic_epoch || "Awaiting"}
              </p>
            </div>
          ) : (
            <p role="status" className="text-sm text-indigo-200/70">
              Submit the form to see manuscript guidance.
            </p>
          )}
        </div>

        {sections.length > 0 && (
          <div className="mt-6 space-y-6">
            {sections.map((section, index) => (
              <article
                key={`${section.title}-${index}`}
                className="rounded-2xl border border-indigo-400/20 bg-indigo-950/30 p-5"
              >
                <h3 className="text-lg font-semibold text-amber-100">{section.title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm text-indigo-100/90">{section.narrative}</p>
                {section.citations.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-amber-200/60">Manuscript citations</p>
                    <ul className="mt-2 space-y-2 text-xs text-indigo-100/80">
                      {section.citations.map((citation, citationIndex) => (
                        <li key={`${citation.source}-${citationIndex}`} className="rounded-lg border border-indigo-300/20 bg-indigo-950/40 p-3">
                          <p className="font-semibold text-amber-100">{citation.source}</p>
                          {citation.reference && <p className="text-indigo-100/80">{citation.reference}</p>}
                          {citation.excerpt && <p className="mt-1 text-indigo-200/80">“{citation.excerpt}”</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
