"use client";

import { FormEvent, useState } from "react";

import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import {
  fetchQuarterlyReviews,
  getFutureProgress,
  getTimeline,
  getVarshaphal,
  requestCalendar,
  requestCoreWisdom,
  requestMatchmaking,
  requestPrediction,
  requestTransits,
} from "@/lib/api";
import { BirthDetails, CalendarDetails, MatchmakingDetails, PredictionEngine } from "@/types/astro";

const moonElements = ["water", "fire", "earth", "air", "ether"];

function JsonPanel({ data }: { data: unknown }) {
  if (!data) return null;
  return (
    <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-xs text-white/70">
      <pre className="whitespace-pre-wrap break-words">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function useBirthDetails() {
  const [details, setDetails] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  return { details, setDetails };
}

function BirthDetailsFields({ details, onChange }: { details: BirthDetails; onChange: (next: BirthDetails) => void }) {
  return (
    <div className="section-grid">
      <div className="space-y-4">
        <input
          className="input-field"
          placeholder="Full name"
          value={details.name}
          onChange={(event) => onChange({ ...details, name: event.target.value })}
        />
        <input
          className="input-field"
          type="date"
          value={details.birthDate}
          onChange={(event) => onChange({ ...details, birthDate: event.target.value })}
        />
        <input
          className="input-field"
          type="time"
          value={details.birthTime}
          onChange={(event) => onChange({ ...details, birthTime: event.target.value })}
        />
        <input
          className="input-field"
          placeholder="Place of birth"
          value={details.birthPlace}
          onChange={(event) => onChange({ ...details, birthPlace: event.target.value })}
        />
        <input
          className="input-field"
          placeholder="Timezone (e.g. Asia/Kolkata)"
          value={details.timezone || ""}
          onChange={(event) => onChange({ ...details, timezone: event.target.value })}
        />
      </div>
      <div className="space-y-4">
        <select
          className="input-field"
          value={details.tradition || "universal"}
          onChange={(event) => onChange({ ...details, tradition: event.target.value })}
        >
          <option value="universal">Universal</option>
          <option value="vedic">Vedic</option>
          <option value="tropical">Tropical</option>
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input
            className="input-field"
            placeholder="Lunar tithi"
            value={details.lunarTithi}
            onChange={(event) => onChange({ ...details, lunarTithi: event.target.value })}
          />
          <select
            className="input-field"
            value={details.moonElement}
            onChange={(event) => onChange({ ...details, moonElement: event.target.value })}
          >
            {moonElements.map((element) => (
              <option key={element} value={element}>
                {element}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input
            className="input-field"
            placeholder="Mars house"
            value={details.marsHouse}
            onChange={(event) => onChange({ ...details, marsHouse: event.target.value })}
          />
          <input
            className="input-field"
            placeholder="Saturn house"
            value={details.saturnHouse}
            onChange={(event) => onChange({ ...details, saturnHouse: event.target.value })}
          />
          <input
            className="input-field"
            placeholder="Venus house"
            value={details.venusHouse}
            onChange={(event) => onChange({ ...details, venusHouse: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input
            className="input-field"
            placeholder="Ketu house"
            value={details.ketuHouse || ""}
            onChange={(event) => onChange({ ...details, ketuHouse: event.target.value })}
          />
          <input
            className="input-field"
            placeholder="Mercury house"
            value={details.mercuryHouse || ""}
            onChange={(event) => onChange({ ...details, mercuryHouse: event.target.value })}
          />
          <input
            className="input-field"
            placeholder="Jupiter house"
            value={details.jupiterHouse || ""}
            onChange={(event) => onChange({ ...details, jupiterHouse: event.target.value })}
          />
        </div>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={details.rahuAspectsAscendant}
            onChange={(event) => onChange({ ...details, rahuAspectsAscendant: event.target.checked })}
          />
          Rahu aspects ascendant
        </label>
        <label className="flex items-center gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={details.saturnRetrograde ?? false}
            onChange={(event) => onChange({ ...details, saturnRetrograde: event.target.checked })}
          />
          Saturn retrograde
        </label>
      </div>
    </div>
  );
}

export function PredictionForm({ engine }: { engine: PredictionEngine }) {
  const { details, setDetails } = useBirthDetails();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [payload, setPayload] = useState<unknown>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    try {
      const response = await requestPrediction(engine, details);
      setPayload(response);
      setStatus("success");
    } catch (error) {
      setPayload({ error: error instanceof Error ? error.message : "Request failed" });
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BirthDetailsFields details={details} onChange={setDetails} />
      <button
        type="submit"
        className="w-full rounded-2xl bg-neon-cyan/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-cyan/30"
      >
        {status === "loading" ? "Synthesizing..." : "Generate"}
      </button>
      <JsonPanel data={payload} />
    </form>
  );
}

export function CoreWisdomForm() {
  const { details, setDetails } = useBirthDetails();
  const [focusAreas, setFocusAreas] = useState("purpose, relationships, prosperity");
  const [payload, setPayload] = useState<unknown>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await requestCoreWisdom(
      details,
      focusAreas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    );
    setPayload(response);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BirthDetailsFields details={details} onChange={setDetails} />
      <input
        className="input-field"
        value={focusAreas}
        onChange={(event) => setFocusAreas(event.target.value)}
        placeholder="Focus areas (comma separated)"
      />
      <button
        type="submit"
        className="w-full rounded-2xl bg-neon-purple/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-purple/30"
      >
        Reveal Core Wisdom
      </button>
      <JsonPanel data={payload} />
    </form>
  );
}

export function CalendarForm() {
  const [details, setDetails] = useState<CalendarDetails>({
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [payload, setPayload] = useState<unknown>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await requestCalendar(details);
    setPayload(response);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="section-grid">
        <div className="space-y-4">
          <input
            className="input-field"
            type="date"
            value={details.birthDate}
            onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
          />
          <input
            className="input-field"
            type="time"
            value={details.birthTime}
            onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
          />
        </div>
        <input
          className="input-field"
          placeholder="Birth location"
          value={details.birthPlace}
          onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-2xl bg-neon-cyan/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-cyan/30"
      >
        Convert Calendar
      </button>
      <JsonPanel data={payload} />
    </form>
  );
}

export function MatchmakingForm() {
  const [details, setDetails] = useState<MatchmakingDetails>({
    primary: { ...DEFAULT_BIRTH_DETAILS },
    partner: { ...DEFAULT_BIRTH_DETAILS },
    modernPreferences: "shared values, adventurous, grounded",
  });
  const [payload, setPayload] = useState<unknown>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await requestMatchmaking(details.primary, details.partner, details.modernPreferences);
    setPayload(response);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/50">Primary profile</p>
        <BirthDetailsFields
          details={details.primary}
          onChange={(next) => setDetails({ ...details, primary: next })}
        />
      </div>
      <div>
        <p className="mb-4 text-sm uppercase tracking-[0.4em] text-white/50">Partner profile</p>
        <BirthDetailsFields
          details={details.partner}
          onChange={(next) => setDetails({ ...details, partner: next })}
        />
      </div>
      <input
        className="input-field"
        value={details.modernPreferences}
        onChange={(event) => setDetails({ ...details, modernPreferences: event.target.value })}
        placeholder="Modern preferences (comma separated)"
      />
      <button
        type="submit"
        className="w-full rounded-2xl bg-neon-pink/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-pink/30"
      >
        Compare Charts
      </button>
      <JsonPanel data={payload} />
    </form>
  );
}

export function TransitsForm() {
  const { details, setDetails } = useBirthDetails();
  const [transit, setTransit] = useState({ transitDate: "", transitTime: "", timezone: "" });
  const [payload, setPayload] = useState<unknown>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await requestTransits(details, transit);
    setPayload(response);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BirthDetailsFields details={details} onChange={setDetails} />
      <div className="section-grid">
        <div className="space-y-4">
          <input
            className="input-field"
            type="date"
            value={transit.transitDate}
            onChange={(event) => setTransit({ ...transit, transitDate: event.target.value })}
          />
          <input
            className="input-field"
            type="time"
            value={transit.transitTime}
            onChange={(event) => setTransit({ ...transit, transitTime: event.target.value })}
          />
        </div>
        <input
          className="input-field"
          placeholder="Transit timezone (optional)"
          value={transit.timezone}
          onChange={(event) => setTransit({ ...transit, timezone: event.target.value })}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-2xl bg-neon-cyan/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-cyan/30"
      >
        Fetch Transits
      </button>
      <JsonPanel data={payload} />
    </form>
  );
}

export function TimelinePanel() {
  const [payload, setPayload] = useState<unknown>(null);

  async function handleLoad() {
    const response = await getTimeline();
    setPayload(response);
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleLoad}
        className="w-full rounded-2xl bg-neon-purple/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-purple/30"
      >
        Load Timeline
      </button>
      <JsonPanel data={payload} />
    </div>
  );
}

export function VarshaphalPanel() {
  const [year, setYear] = useState(2025);
  const [payload, setPayload] = useState<unknown>(null);

  async function handleLoad() {
    const response = await getVarshaphal(year);
    setPayload(response);
  }

  return (
    <div className="space-y-6">
      <input
        className="input-field"
        type="number"
        value={year}
        onChange={(event) => setYear(Number(event.target.value))}
      />
      <button
        type="button"
        onClick={handleLoad}
        className="w-full rounded-2xl bg-neon-pink/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-pink/30"
      >
        Fetch Varshaphal
      </button>
      <JsonPanel data={payload} />
    </div>
  );
}

export function DashboardPanel() {
  const [payload, setPayload] = useState<unknown>(null);

  async function handleLoad() {
    const response = await getFutureProgress();
    setPayload(response);
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleLoad}
        className="w-full rounded-2xl bg-neon-lime/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-lime/30"
      >
        Sync Dashboard
      </button>
      <JsonPanel data={payload} />
    </div>
  );
}

export function AlertsPanel() {
  const [payload, setPayload] = useState<unknown>(null);
  const [userId, setUserId] = useState("");
  const [sessionKey, setSessionKey] = useState("default");

  async function handleLoad() {
    const response = await fetch(`/api/bhrigu-chat?user_id=${encodeURIComponent(userId)}&session_key=${encodeURIComponent(sessionKey)}`);
    const data = await response.json();
    setPayload(data);
  }

  return (
    <div className="space-y-6">
      <input
        className="input-field"
        placeholder="User ID"
        value={userId}
        onChange={(event) => setUserId(event.target.value)}
      />
      <input
        className="input-field"
        placeholder="Session key"
        value={sessionKey}
        onChange={(event) => setSessionKey(event.target.value)}
      />
      <button
        type="button"
        onClick={handleLoad}
        className="w-full rounded-2xl bg-neon-cyan/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-cyan/30"
      >
        Retrieve Alerts
      </button>
      <JsonPanel data={payload} />
    </div>
  );
}

export function AnalyticsPanel() {
  const [payload, setPayload] = useState<unknown>(null);

  async function handleLoad() {
    const response = await fetchQuarterlyReviews();
    setPayload(response);
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={handleLoad}
        className="w-full rounded-2xl bg-neon-purple/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-purple/30"
      >
        Load Analytics
      </button>
      <JsonPanel data={payload} />
    </div>
  );
}

export function ChatPanel() {
  const [message, setMessage] = useState("");
  const [payload, setPayload] = useState<unknown>(null);
  const { details, setDetails } = useBirthDetails();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chatBirthDetails = {
      name: details.name,
      dateOfBirth: details.birthDate,
      timeOfBirth: details.birthTime,
      placeOfBirth: details.birthPlace,
    };
    const response = await fetch("/api/bhrigu-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context: { birthDetails: chatBirthDetails } }),
    });
    const data = await response.json();
    setPayload(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BirthDetailsFields details={details} onChange={setDetails} />
      <textarea
        className="input-field min-h-[120px]"
        placeholder="Ask the Bhrigu guide anything..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button
        type="submit"
        className="w-full rounded-2xl bg-neon-lime/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-neon-lime/30"
      >
        Send Message
      </button>
      <JsonPanel data={payload} />
    </form>
  );
}
