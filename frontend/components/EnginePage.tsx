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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-10">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-card-gradient p-8">
        <div className="absolute -top-24 right-0 h-60 w-60 rounded-full bg-neon-cyan/20 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-60 w-60 rounded-full bg-neon-pink/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="badge">{engine.category}</div>
            <h1 className="mt-4 text-3xl font-semibold md:text-4xl">{engine.title}</h1>
            <p className="mt-3 text-base text-white/70">{engine.description}</p>
            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-neon-cyan">{engine.highlight}</p>
          </div>
          <div className="flex items-center gap-4">
            <AnimatedLogo size="lg" />
            <Link
              href="/engines"
              className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Back to directory
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Input blueprint</h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
              Studio standard
            </span>
          </div>
          <p className="mt-3 text-sm text-white/70">{engine.formDescription}</p>
          <form className="mt-6 grid gap-4">
            {engine.fields.map((field) => (
              <label key={field.name} className="grid gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
                {field.label}
                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
                    placeholder={field.placeholder}
                  />
                ) : field.type === "select" ? (
                  <select className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white">
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white"
                    placeholder={field.placeholder}
                  />
                )}
                {field.helper ? <span className="text-xs text-white/40">{field.helper}</span> : null}
              </label>
            ))}
            <button
              type="button"
              className="rounded-full bg-aurora px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-slate-900"
            >
              {engine.cta}
            </button>
          </form>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Preview</p>
            <h3 className="mt-3 text-lg font-semibold">{engine.resultTitle}</h3>
            <p className="mt-3 text-sm text-white/70">{engine.resultSummary}</p>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              {engine.resultHighlights.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span className="text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Next steps</p>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {engine.nextSteps.map((step) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-aurora" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
