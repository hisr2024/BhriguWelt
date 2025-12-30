"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ZoomIn } from "lucide-react";

import { AnimatePresence, motion, useReducedMotion } from "@/lib/framer-motion";

const baseSignals = [65, 78, 52, 88, 71, 94, 60];

type EngineZoomChartProps = {
  accent: string;
};

export default function EngineZoomChart({ accent }: EngineZoomChartProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const signals = useMemo(() => baseSignals.map((value) => Math.min(100, Math.round(value * zoom))), [zoom]);
  const shouldAnimate = !reduceMotion;
  const activeSignal = hoveredIndex !== null ? { value: signals[hoveredIndex], index: hoveredIndex } : null;

  const chartVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08, duration: 0.35 },
    },
  };

  const barVariants = {
    hidden: { opacity: 0, scaleY: 0.8 },
    visible: (index: number) => ({
      opacity: 1,
      scaleY: 1,
      transition: { delay: index * 0.04, duration: 0.4, ease: [0, 0, 0.58, 1] },
    }),
  };

  return (
    <div className="relative rounded-3xl border border-white/10 bg-slate-950/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Interactive chart</p>
          <h4 className="text-lg font-semibold text-white">Zoomable signal map</h4>
        </div>
        <ZoomIn className="h-5 w-5 text-indigo-300" />
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-300">
        <span>Zoom</span>
        <input
          type="range"
          min="0.7"
          max="1.4"
          step="0.05"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="flex-1 accent-indigo-400"
          aria-label="Zoom signal chart"
        />
        <span className="w-10 text-right text-white">{Math.round(zoom * 100)}%</span>
      </div>
      <AnimatePresence>
        {activeSignal ? (
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[6.5rem] z-10 w-44 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-center text-[0.7rem] text-slate-100 shadow-xl"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">Signal {activeSignal.index + 1}</p>
            <p className="text-sm font-semibold text-white">{activeSignal.value}% intensity</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <motion.div
        className="mt-5 grid grid-cols-7 gap-2"
        variants={shouldAnimate ? chartVariants : undefined}
        initial={shouldAnimate ? "hidden" : false}
        animate={shouldAnimate ? "visible" : false}
      >
        {signals.map((value, index) => (
          <div key={`signal-${index}`} className="flex flex-col items-center gap-2">
            <div className="h-24 w-full rounded-full bg-white/5">
              <motion.div
                className={`w-full rounded-full bg-gradient-to-t ${accent}`}
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-[0.65rem] text-slate-400">S{index + 1}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
