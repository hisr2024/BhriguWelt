"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import type { Easing } from "framer-motion";
import { ArrowUpRight, Info } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { motion, useReducedMotion } from "@/lib/framer-motion";

const easeInOutCurve: Easing = [0.42, 0, 0.58, 1];
const transition = { duration: 0.35, ease: easeInOutCurve };

type EngineCardProps = {
  engine: {
    slug: string;
    title: string;
    description: string;
    category: string;
    preview: string[];
    features: string[];
    icon: ComponentType<{ className?: string }>;
    accent: string;
  };
  index: number;
};

export default function EngineCard({ engine, index }: EngineCardProps) {
  const Icon = engine.icon;
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transition, delay: 0.06 * index }}
      whileHover={{ y: -6 }}
      className="glass-card group relative flex h-full flex-col gap-5 p-6 transition hover:-translate-y-1"
    >
      <div
        className={`absolute inset-0 rounded-[1.75rem] bg-gradient-to-br ${engine.accent} opacity-0 transition group-hover:opacity-100`}
      />
      <div className="absolute inset-0 rounded-[1.75rem] bg-glass-sheen opacity-0 transition group-hover:opacity-100" />
      <div className="relative flex items-center justify-between gap-3">
        <motion.span
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-neon"
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, -6, 0],
                  rotate: [0, 3, 0],
                }
          }
          transition={{ duration: 6, repeat: Infinity, ease: easeInOutCurve }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.05, rotate: 6 }}
        >
          <Icon className="h-7 w-7" />
        </motion.span>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
            {engine.category}
          </span>
          <Tooltip content="Preview the engine highlights before you launch.">
            <Info className="h-4 w-4 text-white/50 transition group-hover:text-white" />
          </Tooltip>
        </div>
      </div>
      <div className="relative space-y-3">
        <h3 className="text-xl font-semibold text-white">{engine.title}</h3>
        <p className="text-sm text-white/70">{engine.description}</p>
      </div>
      <ul className="relative space-y-2 text-sm text-white/70">
        {engine.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-neon-cyan" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
      <div className="relative mt-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="flex items-center justify-between text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-white/50">
          Quick preview
          <span className="text-white/40">Hover insights</span>
        </div>
        <ul className="mt-3 space-y-2">
          {engine.preview.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neon-pink" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mt-auto flex flex-wrap gap-3">
        <Link
          href={`/${engine.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:opacity-90"
        >
          Explore
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/${engine.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/30"
        >
          Preview
        </Link>
      </div>
    </motion.article>
  );
}
