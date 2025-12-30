'use client';

import Link from "next/link";
import { motion, type Transition } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { engineCards } from "@/lib/engineConfig";

const transition: Transition = { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] };

export default function HomePage() {
  return (
    <div className="space-y-12">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="space-y-6"
      >
        <div className="chip">BhriguWelt Engines</div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              World-class astrology experiences in a focused, dark-first command center.
            </h1>
            <p className="max-w-2xl text-base text-slate-300">
              Explore every engine with zero clutter, crisp motion, and results that feel premium on every device.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Open dashboard
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30"
              >
                Start chat
              </Link>
            </div>
          </div>
          <div className="glass-panel p-6">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Today’s pulse</p>
              <h2 className="text-2xl font-semibold text-white">Lunar clarity with rising intuition.</h2>
              <p className="text-sm text-slate-300">
                Capture your next insight across every engine with seamless transitions and clean results.
              </p>
              <div className="grid gap-2 text-sm text-slate-200">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Next transit alert</span>
                  <span className="font-semibold text-white">21:10 IST</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Daily remedy</span>
                  <span className="font-semibold text-white">Water ritual</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">All engines</h2>
          <p className="text-sm text-slate-400">Tap any card to launch the experience.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {engineCards.map((engine, index) => {
            const Icon = engine.icon;
            return (
              <motion.article
                key={engine.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.08 * index }}
                whileHover={{ y: -6 }}
                className="glass-panel flex h-full flex-col gap-5 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Engine
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white">{engine.title}</h3>
                  <p className="text-sm text-slate-300">{engine.description}</p>
                </div>
                <ul className="space-y-2 text-sm text-slate-300">
                  {engine.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Link
                    href={`/${engine.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white"
                  >
                    Explore {engine.title}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
