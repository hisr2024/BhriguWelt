"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type FutureResponse = {
  interpretation?: string;
  interpretation_hi?: string;
};

export default function FuturePage() {
  const [formState, setFormState] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [result, setResult] = useState<FutureResponse | null>(null);
  const [status, setStatus] = useState("Generate your future trajectory.");

  const handleChange = (field: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Mapping future cycles…");
    try {
      const response = await fetch(`${backendBaseUrl}/future`, {
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
        throw new Error("Unable to fetch future insights.");
      }

      const data = (await response.json()) as FutureResponse;
      setResult(data);
      setStatus("Future guidance delivered.");
    } catch (err) {
      setStatus("Future insights are unavailable right now.");
    }
  };

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <h1 className="text-fluid-xl font-semibold">Future Pathway</h1>
        <p className="mt-3 text-sm text-slate-300">
          View upcoming cycles, recommended remedies, and timeline anchors in one streamlined experience.
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
            Reveal future
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <p role="status" className="text-sm text-aurora">
          {status}
        </p>
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          <p>{result?.interpretation || "Future insights will populate here."}</p>
          {result?.interpretation_hi && <p className="text-slate-300">{result.interpretation_hi}</p>}
        </div>
      </section>
    </main>
  );
}
