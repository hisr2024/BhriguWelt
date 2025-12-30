"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type MatchmakingResponse = {
  compatibility?: string;
  summary?: string;
};

export default function MatchmakingPage() {
  const [primary, setPrimary] = useState({ name: "", birthDate: "", birthTime: "", birthPlace: "" });
  const [partner, setPartner] = useState({ name: "", birthDate: "", birthTime: "", birthPlace: "" });
  const [preferences, setPreferences] = useState("");
  const [result, setResult] = useState<MatchmakingResponse | null>(null);
  const [status, setStatus] = useState("Pair two profiles to explore compatibility.");

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<typeof primary>>, field: keyof typeof primary) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Calculating harmony…");
    try {
      const response = await fetch(`${backendBaseUrl}/matchmaking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary: {
            name: primary.name,
            birth_date: primary.birthDate,
            birth_time: primary.birthTime,
            birth_place: primary.birthPlace,
          },
          partner: {
            name: partner.name,
            birth_date: partner.birthDate,
            birth_time: partner.birthTime,
            birth_place: partner.birthPlace,
          },
          modern_preferences: preferences.split(",").map((item) => item.trim()),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to fetch matchmaking insights.");
      }

      const data = (await response.json()) as MatchmakingResponse;
      setResult(data);
      setStatus("Compatibility delivered.");
    } catch (err) {
      setStatus("Compatibility unavailable. Please retry later.");
    }
  };

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <h1 className="text-fluid-xl font-semibold">Matchmaking Compass</h1>
        <p className="mt-3 text-sm text-slate-300">
          Compare two birth charts and align them with modern relationship preferences.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Primary</p>
              <label className="mt-4 grid gap-2 text-sm">
                Full name
                <input
                  value={primary.name}
                  onChange={handleChange(setPrimary, "name")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  required
                />
              </label>
              <label className="mt-3 grid gap-2 text-sm">
                Birth date
                <input
                  type="date"
                  value={primary.birthDate}
                  onChange={handleChange(setPrimary, "birthDate")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  required
                />
              </label>
              <label className="mt-3 grid gap-2 text-sm">
                Birth time
                <input
                  type="time"
                  value={primary.birthTime}
                  onChange={handleChange(setPrimary, "birthTime")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  required
                />
              </label>
              <label className="mt-3 grid gap-2 text-sm">
                Birth place
                <input
                  value={primary.birthPlace}
                  onChange={handleChange(setPrimary, "birthPlace")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  required
                />
              </label>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Partner</p>
              <label className="mt-4 grid gap-2 text-sm">
                Full name
                <input
                  value={partner.name}
                  onChange={handleChange(setPartner, "name")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  required
                />
              </label>
              <label className="mt-3 grid gap-2 text-sm">
                Birth date
                <input
                  type="date"
                  value={partner.birthDate}
                  onChange={handleChange(setPartner, "birthDate")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  required
                />
              </label>
              <label className="mt-3 grid gap-2 text-sm">
                Birth time
                <input
                  type="time"
                  value={partner.birthTime}
                  onChange={handleChange(setPartner, "birthTime")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  required
                />
              </label>
              <label className="mt-3 grid gap-2 text-sm">
                Birth place
                <input
                  value={partner.birthPlace}
                  onChange={handleChange(setPartner, "birthPlace")}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                  required
                />
              </label>
            </div>
          </div>
          <label className="grid gap-2 text-sm">
            Modern preferences (comma-separated)
            <input
              value={preferences}
              onChange={(event) => setPreferences(event.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
              placeholder="shared ambitions, family rituals"
            />
          </label>
          <button type="submit" className="rounded-full bg-aurora px-6 py-3 text-sm font-semibold text-slate-900">
            Reveal compatibility
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <p role="status" className="text-sm text-aurora">
          {status}
        </p>
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          <p>{result?.summary || "Alignment summary will appear here."}</p>
          <p className="text-slate-300">{result?.compatibility || "Compatibility signals ready for synthesis."}</p>
        </div>
      </section>
    </main>
  );
}
