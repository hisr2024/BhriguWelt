"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type PastLifeResponse = {
  interpretation?: string;
  interpretation_hi?: string;
};

export default function PastLifePage() {
  const [formState, setFormState] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [result, setResult] = useState<PastLifeResponse | null>(null);
  const [status, setStatus] = useState("Enter details to unlock past-life insights.");

  const handleChange = (field: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Consulting the manuscripts…");
    try {
      const response = await fetch(`${backendBaseUrl}/past-life`, {
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
        throw new Error("Unable to fetch past-life insights.");
      }

      const data = (await response.json()) as PastLifeResponse;
      setResult(data);
      setStatus("Past-life narratives delivered.");
    } catch (err) {
      setStatus("Past-life insights are unavailable right now.");
    }
  };

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <h1 className="text-fluid-xl font-semibold">Past-Life Echoes</h1>
        <p className="mt-3 text-sm text-slate-300">
          Explore reincarnation narratives aligned with your natal chart and Bhrigu manuscripts.
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
          <button type="submit" className="mt-2 rounded-full bg-aurora px-6 py-3 text-sm font-semibold text-slate-900">
            Reveal past-life
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <p role="status" className="text-sm text-aurora">
          {status}
        </p>
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          <p>{result?.interpretation || "Awaiting the manuscript narrative."}</p>
          {result?.interpretation_hi && <p className="text-slate-300">{result.interpretation_hi}</p>}
        </div>
      </section>
    </main>
  );
}
