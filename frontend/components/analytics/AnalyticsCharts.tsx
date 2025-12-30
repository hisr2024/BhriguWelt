"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { motion } from "@/lib/framer-motion";
import Chart from "chart.js/auto";
import type { ChartData, ChartOptions } from "chart.js";

type EngineUsage = {
  label: string;
  value: number;
};

type PersonaMix = {
  label: string;
  value: number;
};

type AnalyticsChartsProps = {
  labels: string[];
  activitySeries: number[];
  sessionSeries: number[];
  engineUsage: EngineUsage[];
  personaMix: PersonaMix[];
};

type ChartCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-w-[280px] flex-1 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{title}</p>
        <p className="text-sm text-slate-300">{description}</p>
      </div>
      <div className="mt-6 h-60">{children}</div>
    </motion.div>
  );
}

type ChartCanvasProps = {
  type: "line" | "bar" | "doughnut";
  data: ChartData;
  options: ChartOptions;
};

function ChartCanvas({ type, data, options }: ChartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type,
      data,
      options,
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [data, options, type]);

  return <canvas ref={canvasRef} className="h-full w-full" />;
}

export default function AnalyticsCharts({
  labels,
  activitySeries,
  sessionSeries,
  engineUsage,
  personaMix,
}: AnalyticsChartsProps) {
  const lineData = useMemo<ChartData>(
    () => ({
      labels,
      datasets: [
        {
          label: "Daily engagement",
          data: activitySeries,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99, 102, 241, 0.25)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Sessions",
          data: sessionSeries,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.2)",
          fill: true,
          tension: 0.3,
          pointRadius: 2.5,
          pointHoverRadius: 4,
        },
      ],
    }),
    [activitySeries, labels, sessionSeries],
  );

  const barData = useMemo<ChartData>(
    () => ({
      labels: engineUsage.map((item) => item.label),
      datasets: [
        {
          label: "Weekly engine usage",
          data: engineUsage.map((item) => item.value),
          backgroundColor: [
            "rgba(129, 140, 248, 0.8)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(251, 191, 36, 0.7)",
            "rgba(244, 114, 182, 0.7)",
            "rgba(45, 212, 191, 0.7)",
          ],
          borderRadius: 12,
        },
      ],
    }),
    [engineUsage],
  );

  const doughnutData = useMemo<ChartData>(
    () => ({
      labels: personaMix.map((item) => item.label),
      datasets: [
        {
          label: "Persona mix",
          data: personaMix.map((item) => item.value),
          backgroundColor: [
            "rgba(99, 102, 241, 0.85)",
            "rgba(236, 72, 153, 0.8)",
            "rgba(14, 165, 233, 0.8)",
            "rgba(34, 197, 94, 0.75)",
          ],
          borderWidth: 0,
        },
      ],
    }),
    [personaMix],
  );

  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#cbd5f5",
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: "rgba(148, 163, 184, 0.4)",
        borderWidth: 1,
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148, 163, 184, 0.08)" },
      },
      y: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148, 163, 184, 0.08)" },
      },
    },
  };

  return (
    <section>
      <div
        className="flex gap-5 overflow-x-auto pb-3"
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
      >
        <ChartCard
          title="Engagement wave"
          description="Real-time engagement and session volume for the selected cohort."
        >
          <ChartCanvas type="line" data={lineData} options={baseOptions} />
        </ChartCard>
        <ChartCard
          title="Engine usage"
          description="Top engines powering Gen Z curiosity this cycle."
        >
          <ChartCanvas type="bar" data={barData} options={baseOptions} />
        </ChartCard>
        <ChartCard
          title="Persona mix"
          description="Gen Z personas interacting with BhriguWelt right now."
        >
          <ChartCanvas
            type="doughnut"
            data={doughnutData}
            options={{
              ...baseOptions,
              scales: {},
            }}
          />
        </ChartCard>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Tip: On mobile, pinch to zoom or swipe sideways to explore full-width charts.
      </p>
    </section>
  );
}
