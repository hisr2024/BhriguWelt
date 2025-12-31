"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { AggregatedWeight, KarmicMetric, TransitPosition } from "@/lib/analytics";

type Props = {
  karmicMetrics: KarmicMetric[];
  elementBalance: { water: number; earth: number; fire: number; air: number };
  transitOverlay: { labels: string[]; degrees: number[]; positions: TransitPosition[] };
  principleWeights: AggregatedWeight[];
};

function useChart(
  canvas: RefObject<HTMLCanvasElement>,
  configFactory: (Chart: typeof import("chart.js/auto")) => Record<string, unknown>,
  deps: unknown[],
) {
  useEffect(() => {
    let chart: { destroy: () => void } | null = null;
    let mounted = true;

    const load = async () => {
      const module = await import("chart.js/auto");
      if (!mounted || !canvas.current) return;
      const config = configFactory(module);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart = new (module.default as any)(canvas.current, config);
    };

    load();

    return () => {
      mounted = false;
      if (chart) chart.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default function AnalyticsCharts({ karmicMetrics, elementBalance, transitOverlay, principleWeights }: Props) {
  const karmicCanvas = useRef<HTMLCanvasElement>(null);
  const elementsCanvas = useRef<HTMLCanvasElement>(null);
  const transitCanvas = useRef<HTMLCanvasElement>(null);
  const weightsCanvas = useRef<HTMLCanvasElement>(null);

  useChart(
    karmicCanvas,
    () => ({
      type: "radar",
      data: {
        labels: karmicMetrics.map((metric) => metric.label),
        datasets: [
          {
            label: "Karmic resonance",
            data: karmicMetrics.map((metric) => metric.value),
            borderColor: "#8B5CF6",
            backgroundColor: "rgba(139, 92, 246, 0.25)",
            pointBackgroundColor: "#A78BFA",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 1,
            ticks: { display: false },
          },
        },
      },
    }),
    [karmicMetrics],
  );

  useChart(
    elementsCanvas,
    () => ({
      type: "bar",
      data: {
        labels: ["Water", "Earth", "Fire", "Air"],
        datasets: [
          {
            label: "Element balance",
            data: [elementBalance.water, elementBalance.earth, elementBalance.fire, elementBalance.air],
            backgroundColor: ["#38BDF8", "#22C55E", "#F97316", "#E2E8F0"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    }),
    [elementBalance],
  );

  useChart(
    transitCanvas,
    () => ({
      type: "line",
      data: {
        labels: transitOverlay.labels,
        datasets: [
          {
            label: "Transit degrees",
            data: transitOverlay.degrees,
            borderColor: "#0EA5E9",
            backgroundColor: "rgba(14, 165, 233, 0.2)",
            tension: 0.35,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 360 },
        },
      },
    }),
    [transitOverlay],
  );

  useChart(
    weightsCanvas,
    () => ({
      type: "bar",
      data: {
        labels: principleWeights.map((weight) => weight.label),
        datasets: [
          {
            label: "Samhita principle weights",
            data: principleWeights.map((weight) => weight.value),
            backgroundColor: "#F59E0B",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 1 },
        },
      },
    }),
    [principleWeights],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <h3>Karmic resonance radar</h3>
        <p className="muted">Weighted by core wisdom metrics and Nadi overlays.</p>
        <canvas ref={karmicCanvas} className="mt-4 w-full" />
      </div>
      <div className="card">
        <h3>Elemental balance</h3>
        <p className="muted">Rashi distribution summarized from the natal chart.</p>
        <canvas ref={elementsCanvas} className="mt-4 w-full" />
      </div>
      <div className="card">
        <h3>Transit overlay</h3>
        <p className="muted">Exact planetary degrees for transit precision.</p>
        <canvas ref={transitCanvas} className="mt-4 w-full" />
      </div>
      <div className="card">
        <h3>Samhita principle weights</h3>
        <p className="muted">Aggregate weights computed from bhrigu_data corpus.</p>
        <canvas ref={weightsCanvas} className="mt-4 w-full" />
      </div>
    </div>
  );
}
