"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const timeframeOptions = ["Last 24 hours", "7 days", "30 days", "90 days"];
const regionOptions = ["Global", "India", "Southeast Asia", "Europe", "Americas"];
const channelOptions = ["All channels", "Web", "Mobile", "API", "Partner"];
const engineOptions = [
  "All engines",
  "Horoscope Engine",
  "Past-Life Engine",
  "Future Engine",
  "Matchmaking Engine",
  "Saka Calendar Engine",
];

const baseSeries = [120, 132, 148, 160, 172, 165, 190, 210, 198, 220, 240, 260];

const engineSnapshots = [
  {
    name: "Horoscope Engine",
    status: "Healthy",
    latency: 280,
    volume: "34.6k",
    accuracy: 96,
  },
  {
    name: "Past-Life Engine",
    status: "Scaling",
    latency: 340,
    volume: "18.4k",
    accuracy: 93,
  },
  {
    name: "Future Engine",
    status: "Healthy",
    latency: 310,
    volume: "27.2k",
    accuracy: 94,
  },
  {
    name: "Matchmaking Engine",
    status: "Optimizing",
    latency: 360,
    volume: "11.3k",
    accuracy: 92,
  },
  {
    name: "Saka Calendar Engine",
    status: "Healthy",
    latency: 190,
    volume: "9.1k",
    accuracy: 99,
  },
];

const inputSources = [
  { label: "Birth details form", value: 42, accent: "from-cyan-400 to-blue-500" },
  { label: "Matchmaking profiles", value: 28, accent: "from-fuchsia-400 to-pink-500" },
  { label: "Calendar conversions", value: 18, accent: "from-amber-400 to-orange-500" },
  { label: "Legacy API sync", value: 12, accent: "from-emerald-400 to-teal-500" },
];

const outputQuality = [
  {
    label: "Citation coverage",
    value: "98%",
    delta: "+2.4%",
    accent: "bg-emerald-400",
  },
  {
    label: "Narrative depth",
    value: "92%",
    delta: "+1.3%",
    accent: "bg-sky-400",
  },
  {
    label: "Insight clarity",
    value: "94%",
    delta: "+0.8%",
    accent: "bg-purple-400",
  },
];

const liveFeed = [
  {
    input: "Panchanga intake · Delhi",
    output: "Horoscope insight delivered",
    confidence: "0.94",
    status: "Sent",
  },
  {
    input: "Matchmaking preference update",
    output: "Compatibility matrix refreshed",
    confidence: "0.91",
    status: "Processed",
  },
  {
    input: "Future engine query · mobile",
    output: "Actionable directives ranked",
    confidence: "0.89",
    status: "Queued",
  },
  {
    input: "Śaka calendar conversion",
    output: "Regional date translated",
    confidence: "0.97",
    status: "Sent",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function buildLinePath(points: number[], width: number, height: number) {
  const max = Math.max(...points, 1);
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - (point / max) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function CollapsiblePanel({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 text-left md:pointer-events-none"
      >
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
          ) : null}
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition md:hidden">
          <svg
            className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.086l3.71-3.855a.75.75 0 1 1 1.08 1.04l-4.24 4.4a.75.75 0 0 1-1.08 0l-4.24-4.4a.75.75 0 0 1 .02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>
      <div className={`${open ? "mt-6" : "mt-6 hidden"} md:block`}>
        {children}
      </div>
    </section>
  );
}

function LineChart({
  points,
  accent,
  chartId,
}: {
  points: number[];
  accent: string;
  chartId: string;
}) {
  const width = 420;
  const height = 160;
  const path = buildLinePath(points, width, height);
  const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      id={chartId}
      viewBox={`0 0 ${width} ${height}`}
      className="h-44 w-full"
    >
      <defs>
        <linearGradient id={`${chartId}-gradient`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.6" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#${chartId}-gradient)`}
        className="transition-all duration-700 ease-out"
      />
      <path
        d={path}
        fill="none"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState(timeframeOptions[1]);
  const [region, setRegion] = useState(regionOptions[0]);
  const [channel, setChannel] = useState(channelOptions[0]);
  const [engine, setEngine] = useState(engineOptions[0]);
  const [search, setSearch] = useState("");
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [series, setSeries] = useState(baseSeries);
  const [pulse, setPulse] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");

  useEffect(() => {
    if (!liveUpdates) {
      return undefined;
    }

    const id = setInterval(() => {
      setSeries((prev) =>
        prev.map((value) =>
          clamp(Math.round(value * (0.93 + Math.random() * 0.12)), 90, 320)
        )
      );
      setPulse((value) => value + 1);
      setLastUpdated(new Date().toLocaleTimeString());
    }, 3500);

    return () => clearInterval(id);
  }, [liveUpdates]);

  const totals = useMemo(() => {
    const total = series.reduce((sum, value) => sum + value, 0);
    const average = Math.round(total / series.length);
    const peak = Math.max(...series);

    return {
      total,
      average,
      peak,
    };
  }, [series]);

  const feedMatches = liveFeed.filter(
    (item) =>
      item.input.toLowerCase().includes(search.toLowerCase()) ||
      item.output.toLowerCase().includes(search.toLowerCase())
  );

  const exportPayload = useMemo(
    () =>
      JSON.stringify(
        {
          timeframe,
          region,
          channel,
          engine,
          totals,
          updated: lastUpdated,
        },
        null,
        2
      ),
    [timeframe, region, channel, engine, totals, lastUpdated]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/80 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.6)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">BhriguWelt analytics</p>
              <h1 className="mt-2 text-3xl font-semibold">Insight dashboard overview</h1>
              <p className="mt-2 text-sm text-slate-300">
                Monitor live engine throughput, narrative performance, and operational velocity in one quiet workspace.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Last synced</span>
              <strong className="text-lg text-white">{lastUpdated}</strong>
              <p className="text-xs text-slate-400">Pulse #{pulse}</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Timeframe
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
              >
                {timeframeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Region
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                {regionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Channel
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
              >
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Engine
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                value={engine}
                onChange={(event) => setEngine(event.target.value)}
              >
                {engineOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <CollapsiblePanel title="Engine throughput" subtitle="Real-time request velocity">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Requests</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{totals.total.toLocaleString()}</h3>
                    <p className="mt-2 text-xs text-slate-400">Average {totals.average} / interval</p>
                  </div>
                  <div className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    Peak {totals.peak}
                  </div>
                </div>
                <LineChart points={series} accent="#34d399" chartId="engine-series" />
              </div>
              <div className="flex flex-col gap-4">
                {engineSnapshots.map((engineSnapshot) => (
                  <div key={engineSnapshot.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{engineSnapshot.name}</p>
                        <p className="text-xs text-slate-400">{engineSnapshot.status}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-200">
                        {engineSnapshot.latency} ms
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-300">
                      <div>
                        <p className="text-slate-400">Volume</p>
                        <p className="text-sm font-semibold text-white">{engineSnapshot.volume}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Accuracy</p>
                        <p className="text-sm font-semibold text-white">{engineSnapshot.accuracy}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Input sources" subtitle="Where new charts are originating">
            <div className="grid gap-4">
              {inputSources.map((source) => (
                <div key={source.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white">{source.label}</p>
                    <span className="text-sm font-semibold text-white">{source.value}%</span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${source.accent}`}
                      style={{ width: `${source.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CollapsiblePanel>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <CollapsiblePanel title="Output quality" subtitle="Narrative clarity & delivery health">
            <div className="grid gap-4 md:grid-cols-3">
              {outputQuality.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-2xl font-semibold text-white">{item.value}</p>
                    <span className={`rounded-full px-2 py-1 text-xs text-slate-900 ${item.accent}`}>
                      {item.delta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel title="Export" subtitle="Snapshot current metrics">
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Export a quick summary for reporting, sharing, or saving in your analytics archive.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => downloadFile("bhriguwelt-dashboard.json", exportPayload, "application/json")}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  Download JSON
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile("bhriguwelt-dashboard.txt", exportPayload, "text/plain")}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white"
                >
                  Download TXT
                </button>
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={liveUpdates}
                    onChange={(event) => setLiveUpdates(event.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-slate-950"
                  />
                  Live updates
                </label>
              </div>
            </div>
          </CollapsiblePanel>
        </div>

        <CollapsiblePanel title="Live feed" subtitle="Recent events and streaming updates">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-slate-950 px-4 py-2 text-sm text-slate-300">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Search</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter inputs or outputs"
                  className="w-full bg-transparent text-white outline-none"
                />
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Showing {feedMatches.length} / {liveFeed.length}
              </div>
            </div>
            <div className="grid gap-3">
              {feedMatches.map((item) => (
                <div key={item.input} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm text-white">{item.input}</p>
                      <p className="text-xs text-slate-400">{item.output}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="rounded-full border border-white/10 px-3 py-1">{item.status}</span>
                      <span className="text-white">{item.confidence}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsiblePanel>
      </section>
    </main>
  );
}
