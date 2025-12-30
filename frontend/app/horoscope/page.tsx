"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

import KundliChart from "../components/KundliChart";

type HoroscopeResponse = {
  name?: string;
  interpretation?: string;
  interpretation_hi?: string | null;
  karmic_epoch?: string;
};

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function HoroscopePage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    lunarTithi: "",
    marsHouse: "",
    saturnHouse: "",
    venusHouse: "",
    rahuAspects: "no",
  });
  const [statusMessage, setStatusMessage] = useState("Enter your details to generate a reading.");
  const [response, setResponse] = useState<HoroscopeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useAdvanced = useMemo(() => {
    return [formState.lunarTithi, formState.marsHouse, formState.saturnHouse, formState.venusHouse].some(
      (value) => value.trim() !== "",
    );
  }, [formState]);

  const handleChange =
    (field: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        name: formState.name,
        birth_date: formState.birthDate,
        birth_time: formState.birthTime,
        birth_place: formState.birthPlace,
        lunar_tithi: formState.lunarTithi,
        mars_house: formState.marsHouse,
        saturn_house: formState.saturnHouse,
        venus_house: formState.venusHouse,
        rahu_aspects_ascendant: formState.rahuAspects === "yes",
      };

      const endpoint = useAdvanced ? `${backendBaseUrl}/horoscope` : "/api/chart";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to fetch horoscope.");
      }

      const data = (await response.json()) as HoroscopeResponse;
      setResponse(data);
      const name = data.name || formState.name || "Seeker";
      const epoch = data.karmic_epoch || "sadhana";
      setStatusMessage(`Reading captured for ${name}. Karmic epoch: ${epoch}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setStatusMessage("We could not generate your reading yet.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <h1 className="text-fluid-xl font-semibold">Horoscope Studio</h1>
          <p className="mt-3 text-sm text-slate-300">
            Generate a manuscript-backed reading with bilingual guidance and immediate follow-up actions.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm">
              Full name
              <input
                value={formState.name}
                onChange={handleChange("name")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                placeholder="Aarya Sen"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Date of birth / Birth date
              <input
                type="date"
                value={formState.birthDate}
                onChange={handleChange("birthDate")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Time of birth / Birth time
              <input
                type="time"
                value={formState.birthTime}
                onChange={handleChange("birthTime")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                required
              />
            </label>
            <label className="grid gap-2 text-sm">
              Place of birth / Birth place
              <input
                value={formState.birthPlace}
                onChange={handleChange("birthPlace")}
                className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                placeholder="Varanasi"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Lunar tithi
                <input
                  value={formState.lunarTithi}
                  onChange={handleChange("lunarTithi")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  placeholder="5"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Mars house
                <input
                  value={formState.marsHouse}
                  onChange={handleChange("marsHouse")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  placeholder="10"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Saturn house
                <input
                  value={formState.saturnHouse}
                  onChange={handleChange("saturnHouse")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  placeholder="2"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Venus house
                <input
                  value={formState.venusHouse}
                  onChange={handleChange("venusHouse")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  placeholder="2"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Rahu aspects
                <select
                  value={formState.rahuAspects}
                  onChange={handleChange("rahuAspects")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 rounded-full bg-aurora px-6 py-3 text-sm font-semibold text-slate-900"
              disabled={isLoading}
            >
              {isLoading ? "Generating…" : "Fetch insights · Generate reading"}
            </button>
          </form>
          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        </div>

        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reading status</p>
              <p role="status" className="mt-2 text-sm text-aurora">
                {statusMessage}
              </p>
            </div>
            <KundliChart className="h-20 w-20 text-aurora" />
          </div>
          <div className="mt-6 space-y-4 text-sm text-slate-200">
            <p className="font-semibold">Interpretation</p>
            <p>{response?.interpretation || "Submit the form to see your interpretation."}</p>
            {response?.interpretation_hi && <p className="text-sm text-slate-300">{response.interpretation_hi}</p>}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
              onClick={() => router.push("/studio/insights")}
            >
              Ask in chat
            </button>
            <button
              type="button"
              className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.2em]"
            >
              Download PDF
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
