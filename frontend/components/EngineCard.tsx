"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { motion, type Easing } from "framer-motion";
import { ArrowUpRight, Info } from "lucide-react";
import Tooltip from "@/components/Tooltip";

const transition = { duration: 0.35, ease: [0.2, 0.65, 0.3, 0.9] as Easing };

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
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            {engine.category}
          </span>
          <Tooltip content="Preview the engine highlights before you launch.">
            <Info className="h-4 w-4 text-slate-400 transition group-hover:text-white" />
          </Tooltip>
        </div>
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
      <div className="relative mt-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="flex items-center justify-between text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Quick preview
          <span className="text-slate-500">Hover insights</span>
        </div>
        <ul className="mt-3 space-y-2">
          {engine.preview.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative mt-auto flex flex-wrap gap-3">
        <Link
          href={`/${engine.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-indigo-400"
        >
          Explore
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
