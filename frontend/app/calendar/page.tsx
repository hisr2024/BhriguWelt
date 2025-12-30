"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type CalendarResponse = {
  gregorian?: string;
  bharat_traditional?: string;
};

export default function CalendarPage() {
  const [formState, setFormState] = useState({
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [result, setResult] = useState<CalendarResponse | null>(null);
  const [status, setStatus] = useState("Convert a moment into Śaka calendar context.");

  const handleChange = (field: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Converting calendar…");
    try {
      const response = await fetch(`${backendBaseUrl}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth_date: formState.birthDate,
          birth_time: formState.birthTime,
          birth_place: formState.birthPlace,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to convert calendar.");
      }

      const data = (await response.json()) as CalendarResponse;
      setResult(data);
      setStatus("Calendar conversion complete.");
    } catch (err) {
      setStatus("Calendar conversion unavailable. Please retry later.");
    }
  };

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <h1 className="text-fluid-xl font-semibold">Śaka Calendar Converter</h1>
        <p className="mt-3 text-sm text-slate-300">
          Align Gregorian dates with traditional lunar markers for ritual planning and family calendars.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
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
          <button
            type="submit"
            className="mt-2 rounded-full bg-aurora px-6 py-3 text-sm font-semibold text-slate-900"
          >
            Convert date
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <p role="status" className="text-sm text-aurora">
          {status}
        </p>
        <div className="mt-4 grid gap-3 text-sm text-slate-200">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            Gregorian: {result?.gregorian || "Pending"}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            Śaka: {result?.bharat_traditional || "Pending"}
          </div>
        </div>
      </section>
    </main>
  );
}
