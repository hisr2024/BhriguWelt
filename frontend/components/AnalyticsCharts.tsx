"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion } from "framer-motion";
import type { AggregatedWeight, KarmicMetric, TransitPosition } from "@/lib/analytics";

type Props = {
  karmicMetrics: KarmicMetric[];
  elementBalance: { water: number; earth: number; fire: number; air: number };
  transitOverlay: { labels: string[]; degrees: number[]; positions: TransitPosition[] };
  principleWeights: AggregatedWeight[];
};

function useChart(
  canvas: RefObject<HTMLCanvasElement | null>,
  configFactory: (ChartModule: typeof import("chart.js/auto")) => Record<string, unknown>,
  deps: unknown[],
) {
  useEffect(() => {
    let chart: { destroy: () => void } | null = null;
    let mounted = true;

    const load = async () => {
      const chartModule = await import("chart.js/auto");
      if (!mounted || !canvas.current) return;
      const config = configFactory(chartModule);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chart = new (chartModule.default as any)(canvas.current, config);
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      className="grid gap-6 lg:grid-cols-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="card analytics-card" variants={cardVariants} whileHover={{ scale: 1.02 }}>
        <div className="card-header">
          <div className="icon-wrapper karmic-icon">🔮</div>
          <div>
            <h3>Karmic resonance radar</h3>
            <p className="muted">Weighted by core wisdom metrics and Nadi overlays.</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <canvas ref={karmicCanvas} className="mt-4 w-full" />
        </motion.div>
      </motion.div>
      
      <motion.div className="card analytics-card" variants={cardVariants} whileHover={{ scale: 1.02 }}>
        <div className="card-header">
          <div className="icon-wrapper elements-icon">🌊</div>
          <div>
            <h3>Elemental balance</h3>
            <p className="muted">Rashi distribution summarized from the natal chart.</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <canvas ref={elementsCanvas} className="mt-4 w-full" />
        </motion.div>
      </motion.div>
      
      <motion.div className="card analytics-card" variants={cardVariants} whileHover={{ scale: 1.02 }}>
        <div className="card-header">
          <div className="icon-wrapper transit-icon">🌟</div>
          <div>
            <h3>Transit overlay</h3>
            <p className="muted">Exact planetary degrees for transit precision.</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <canvas ref={transitCanvas} className="mt-4 w-full" />
        </motion.div>
      </motion.div>
      
      <motion.div className="card analytics-card" variants={cardVariants} whileHover={{ scale: 1.02 }}>
        <div className="card-header">
          <div className="icon-wrapper weights-icon">⚖️</div>
          <div>
            <h3>Samhita principle weights</h3>
            <p className="muted">Aggregate weights computed from bhrigu_data corpus.</p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <canvas ref={weightsCanvas} className="mt-4 w-full" />
        </motion.div>
      </motion.div>

      <style jsx>{`
        .analytics-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(14, 165, 233, 0.05));
          border: 1px solid rgba(139, 92, 246, 0.2);
          transition: all 0.3s ease;
        }

        .analytics-card:hover {
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .icon-wrapper {
          font-size: 2rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float 3s ease-in-out infinite;
        }

        .karmic-icon {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.2));
        }

        .elements-icon {
          background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(34, 197, 94, 0.2));
        }

        .transit-icon {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(6, 182, 212, 0.2));
        }

        .weights-icon {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 191, 36, 0.2));
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </motion.div>
  );
}
