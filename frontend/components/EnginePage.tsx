import Link from "next/link";
import { ReactNode } from "react";

import AnimatedLogo from "@/components/AnimatedLogo";
import type { EngineConfig } from "@/lib/engineConfig";

type EnginePageProps = {
  engine: EngineConfig;
  children?: ReactNode;
};

export default function EnginePage({ engine, children }: EnginePageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-12">
      <div className="glass-panel relative overflow-hidden p-8 md:p-12">
        <div className="absolute -top-24 right-0 h-60 w-60 rounded-full bg-neon-cyan/20 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-60 w-60 rounded-full bg-neon-pink/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="badge">{engine.category}</div>
            <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{engine.title}</h1>
            <p className="mt-3 text-base text-white/70">{engine.description}</p>
            <p className="mt-6 text-sm uppercase tracking-[0.3em] text-neon-cyan">{engine.highlight}</p>
          </div>
          <div className="flex items-center gap-4">
            <AnimatedLogo size="lg" />
          </div>
        </div>
      </div>

      <section className="glass-panel p-8 md:p-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Input portal</h2>
          <Link href="/" className="text-sm text-neon-cyan">
            Back to overview
          </Link>
        </div>
        {children}
      </section>
    </main>
  );
}
