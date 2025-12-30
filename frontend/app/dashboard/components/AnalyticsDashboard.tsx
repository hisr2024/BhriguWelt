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
    const sum = series.reduce((acc, value) => acc + value, 0);
    const avg = Math.round(sum / series.length);
    return {
      total: sum.toLocaleString(),
      avg: avg.toLocaleString(),
      throughput: clamp(Math.round(avg * 1.2), 120, 320),
    };
  }, [series]);

  const filteredEngines = useMemo(() => {
    return engineSnapshots.filter((item) =>
      `${item.name} ${item.status}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const chartAccent = "#38bdf8";

  const handleExportSummary = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total requests", totals.total],
      ["Avg. hourly volume", totals.avg],
      ["Throughput index", totals.throughput.toString()],
      ["Timeframe", timeframe],
      ["Region", region],
      ["Channel", channel],
      ["Engine", engine],
    ];
    const content = rows.map((row) => row.join(",")).join("\n");
    downloadFile("bhriguwelt-analytics.csv", content, "text/csv");
  };

  const handleExportLive = () => {
    const payload = {
      updatedAt: lastUpdated,
      timeframe,
      region,
      channel,
      engine,
      series,
    };
    downloadFile(
      "bhriguwelt-analytics.json",
      JSON.stringify(payload, null, 2),
      "application/json"
    );
  };

  const handleExportChart = () => {
    const svg = document.getElementById("usage-line-chart");
    if (!(svg instanceof SVGSVGElement)) {
      return;
    }
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    downloadFile("bhriguwelt-usage-chart.svg", source, "image/svg+xml");
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 shadow-[0_30px_70px_rgba(14,116,144,0.35)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
                BhriguWelt Analytics Hub
              </p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Live intelligence for every engine input, output, and result.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                Monitor realtime insights, filter by region or channel, and export
                delivery-ready summaries. Every chart reacts instantly as the
                engines update so teams can tune experiences without leaving the
                dashboard.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Live updates
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold">{lastUpdated}</span>
                  <button
                    type="button"
                    onClick={() => setLiveUpdates((value) => !value)}
                    className={`flex h-9 w-16 items-center rounded-full border border-white/10 p-1 transition ${
                      liveUpdates
                        ? "bg-emerald-500/30"
                        : "bg-white/10"
                    }`}
                    aria-pressed={liveUpdates}
                  >
                    <span
                      className={`h-7 w-7 rounded-full bg-white transition ${
                        liveUpdates ? "translate-x-7" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Pulse ID: {pulse}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Export ready
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportSummary}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-cyan-400/80 hover:bg-cyan-500/20"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleExportLive}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-purple-400/80 hover:bg-purple-500/20"
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleExportChart}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-emerald-400/80 hover:bg-emerald-500/20"
                  >
                    Export Chart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <CollapsiblePanel
          title="Filters, segments, and scenario controls"
          subtitle="Refine engine input sources and spotlight outputs across devices."
        >
          <div className="grid gap-4 lg:grid-cols-5">
            <label className="flex flex-col gap-2 text-sm">
              Timeframe
              <select
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              >
                {timeframeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Region
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              >
                {regionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Channel
              <select
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              >
                {channelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Engine
              <select
                value={engine}
                onChange={(event) => setEngine(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              >
                {engineOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter by engine or status"
                className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white"
              />
            </label>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Total requests
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {totals.total}
              </p>
              <p className="mt-1 text-xs text-emerald-300">
                +12% vs previous period
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Avg hourly volume
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {totals.avg}
              </p>
              <p className="mt-1 text-xs text-sky-300">Steady across devices</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Throughput index
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {totals.throughput}
              </p>
              <p className="mt-1 text-xs text-purple-300">
                Engine queues stable
              </p>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Traffic and engagement patterns"
          subtitle="Animated charts summarize app inputs and sessions in real time."
          defaultOpen
        >
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Engagement volume</p>
                  <p className="text-xs text-slate-400">
                    Active users across channels
                  </p>
                </div>
                <div className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                  Live
                </div>
              </div>
              <div className="mt-4">
                <LineChart
                  points={series}
                  accent={chartAccent}
                  chartId="usage-line-chart"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Mobile (52%)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  Desktop (31%)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  API (17%)
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-sm font-semibold">Channel split</p>
              <p className="text-xs text-slate-400">
                Inputs captured from every app surface
              </p>
              <div className="mt-6 space-y-4">
                {inputSources.map((source) => (
                  <div key={source.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{source.label}</span>
                      <span className="text-slate-300">{source.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${source.accent} transition-all duration-700`}
                        style={{ width: `${source.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Engine health and outcome readiness"
          subtitle="Track the engines powering inputs, processing, and outputs."
        >
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
              <div className="grid grid-cols-4 border-b border-white/10 bg-white/5 px-5 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Engine</span>
                <span>Status</span>
                <span>Latency</span>
                <span>Output score</span>
              </div>
              <div className="divide-y divide-white/5">
                {filteredEngines.map((engineItem) => (
                  <div
                    key={engineItem.name}
                    className="grid grid-cols-4 items-center px-5 py-4 text-sm"
                  >
                    <span className="font-medium text-white">
                      {engineItem.name}
                    </span>
                    <span className="text-emerald-300">
                      {engineItem.status}
                    </span>
                    <span className="text-slate-300">
                      {engineItem.latency} ms
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-white">{engineItem.accuracy}%</span>
                      <span className="text-xs text-slate-400">
                        {engineItem.volume}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-sm font-semibold">Output quality radar</p>
              <p className="text-xs text-slate-400">
                Experience signals from generated insights
              </p>
              <div className="mt-6 space-y-4">
                {outputQuality.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${item.accent}`} />
                    <div>
                      <p className="text-sm">{item.label}</p>
                      <p className="text-xs text-slate-400">
                        {item.value} · {item.delta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="text-white">Output focus</p>
                <p className="mt-2 text-xs text-slate-300">
                  Prioritize high-confidence narratives with contextual citations
                  for every engine response.
                </p>
              </div>
            </div>
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Real-time input → output stream"
          subtitle="Monitor the flow from app inputs through engine outputs."
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-sm font-semibold">Live stream</p>
              <p className="text-xs text-slate-400">
                Latest engine outputs and delivery status
              </p>
              <div className="mt-6 space-y-4">
                {liveFeed.map((item) => (
                  <div
                    key={`${item.input}-${item.status}`}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm font-medium text-white">{item.input}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.output}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
                      <span>Confidence {item.confidence}</span>
                      <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em]">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
              <p className="text-sm font-semibold">Action center</p>
              <p className="text-xs text-slate-400">
                Operational guidance for teams
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-transparent p-4">
                  <p className="text-sm font-semibold text-white">
                    Engine queue balance
                  </p>
                  <p className="mt-2 text-xs text-slate-200">
                    Redistribute 12% of traffic from Matchmaking to Horoscope to
                    maintain sub-320ms latency during peak hours.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-transparent p-4">
                  <p className="text-sm font-semibold text-white">
                    Input validation
                  </p>
                  <p className="mt-2 text-xs text-slate-200">
                    Add a guided reminder for missing birth time entries on
                    mobile. Expected improvement: +6% completeness.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-transparent p-4">
                  <p className="text-sm font-semibold text-white">
                    Output assurance
                  </p>
                  <p className="mt-2 text-xs text-slate-200">
                    Enable auto-citation mode for future engine outputs to keep
                    narrative confidence above 0.9.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsiblePanel>
      </div>
    </div>
  );
}
