"use client";

import { useState } from "react";
import { motion, type Easing } from "framer-motion";
import type { EngineResult } from "@/lib/engineConfig";

const easeStandard: [number, number, number, number] = [0.2, 0.65, 0.3, 0.9];
const orbitTransition = { duration: 0.4, ease: easeStandard };

type EngineInsightOrbitProps = {
  highlights: EngineResult["highlights"];
  accent: string;
};

export default function EngineInsightOrbit({ highlights, accent }: EngineInsightOrbitProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Interactive orbit</p>
      <div className="mt-4 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="relative flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${accent} blur-2xl opacity-60`} />
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/20">
            <motion.div
              className="absolute inset-0 rounded-full border border-white/10"
              animate={{ rotate: 360 }}
              transition={orbitSpin}
              aria-hidden
            />
            <motion.span
              className="absolute h-3 w-3 rounded-full bg-white/80 shadow-glow"
              animate={{ scale: [1, 1.25, 1] }}
              transition={pulseTransition}
            />
            {highlights.map((highlight, index) => (
              <motion.button
                key={highlight.label}
                type="button"
                className={`absolute h-8 w-8 rounded-full border border-white/20 bg-slate-900/80 text-xs font-semibold text-slate-200 transition hover:text-white ${
                  index === activeIndex ? "border-indigo-400 text-white shadow-glow" : ""
                }`}
                style={{
                  transform: `rotate(${(index / highlights.length) * 360}deg) translate(0, -88px) rotate(-${
                    (index / highlights.length) * 360
                  }deg)`,
                }}
                onClick={() => setActiveIndex(index)}
                whileHover={{ scale: 1.1 }}
                transition={orbitTransition}
                aria-pressed={index === activeIndex}
                aria-label={`Select ${highlight.label}`}
              >
                {index + 1}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-slate-300">Tap the nodes to reveal the strongest insight stream.</p>
          <motion.div
            key={highlights[activeIndex]?.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={orbitTransition}
            className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{highlights[activeIndex]?.label}</p>
            <p className="mt-2 text-base font-semibold text-white">{highlights[activeIndex]?.value}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
