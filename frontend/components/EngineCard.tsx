"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const transition = { duration: 0.35, ease: [0.2, 0.65, 0.3, 0.9] };

type EngineCardProps = {
  engine: {
    slug: string;
    title: string;
    description: string;
    features: string[];
    icon: ComponentType<{ className?: string }>;
    accent: string;
  };
  index: number;
};

export default function EngineCard({ engine, index }: EngineCardProps) {
  const Icon = engine.icon;
  const shouldReduceMotion = useReducedMotion();
  const iconFloat = shouldReduceMotion
    ? undefined
    : {
        y: [0, -5, 0],
        boxShadow: [
          "0 0 0 rgba(99,102,241,0)",
          "0 0 16px rgba(99,102,241,0.35)",
          "0 0 0 rgba(99,102,241,0)",
        ],
      };
  const iconRotate = shouldReduceMotion ? undefined : { rotate: [0, 6, 0] };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transition, delay: 0.06 * index }}
      whileHover={{ y: -6 }}
      className="group relative flex h-full flex-col gap-5 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_25px_60px_rgba(2,6,23,0.55)]"
    >
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${engine.accent} opacity-0 transition group-hover:opacity-100`} />
      <div className="relative flex items-center justify-between">
        <motion.span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white"
          animate={iconFloat}
          transition={{
            duration: 3.6,
            ease: "easeInOut",
            repeat: shouldReduceMotion ? 0 : Infinity,
            delay: index * 0.1,
          }}
        >
          <motion.span
            animate={iconRotate}
            transition={{
              duration: 4.8,
              ease: "easeInOut",
              repeat: shouldReduceMotion ? 0 : Infinity,
              delay: index * 0.1,
            }}
          >
            <Icon className="h-6 w-6" />
          </motion.span>
        </motion.span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
          Engine
        </span>
      </div>
      <div className="relative space-y-3">
        <h3 className="text-xl font-semibold text-white">{engine.title}</h3>
        <p className="text-sm text-slate-300">{engine.description}</p>
      </div>
      <ul className="relative space-y-2 text-sm text-slate-300">
        {engine.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
      <div className="relative mt-auto flex flex-wrap gap-3">
        <Link
          href={`/${engine.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-indigo-400"
        >
          Launch
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <Link
          href={`/${engine.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/30"
        >
          Preview
        </Link>
      </div>
    </motion.article>
  );
}
