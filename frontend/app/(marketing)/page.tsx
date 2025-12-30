import Link from "next/link";
import { engineConfigs } from "@/lib/engineConfig";

const rituals = [
  {
    title: "Live orchestration",
    description: "Keep every engine in sync with a shared studio timeline and unified intent tracking.",
  },
  {
    title: "Guided rituals",
    description: "Preview mantra, remedies, and guidance in a single, focused reading surface.",
  },
  {
    title: "Insight assurance",
    description: "Capture every engine output with status markers and share-ready export options.",
  },
];

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-10 shadow-glow">
          <p className="text-xs uppercase tracking-[0.4em] text-aurora">BhriguWelt Studio</p>
          <h1 className="mt-4 text-fluid-2xl font-semibold">
            A single studio interface for every horoscope, ritual, and celestial decision.
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            Meet the new Studio UI: a cohesive workspace that unifies engine discovery, insight capture,
            and real-time guidance across teams and seekers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/engines"
              className="rounded-full bg-aurora px-5 py-2 text-sm font-semibold text-slate-900"
            >
              Explore engines
            </Link>
            <Link
              href="/studio/insights"
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-100"
            >
              Open studio
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Studio posture</p>
          <h2 className="mt-3 text-xl font-semibold">Studio-ready interfaces for modern seekers.</h2>
          <p className="mt-4 text-sm text-slate-300">
            Bring intelligence to every ritual: a calm surface for engine inputs, shared insights, and
            synchronized team workflows.
          </p>
          <div className="mt-6 space-y-4 text-sm text-slate-200">
            {rituals.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Engine directory</p>
            <h2 className="mt-3 text-fluid-xl font-semibold">Thirteen engines, one cohesive studio.</h2>
          </div>
          <Link
            href="/engines"
            className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
          >
            Open directory
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {engineConfigs.slice(0, 6).map((engine) => (
            <Link
              key={engine.slug}
              href={`/engines/${engine.slug}`}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{engine.category}</p>
              <h3 className="mt-3 text-lg font-semibold text-white">{engine.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{engine.cardDescription}</p>
              <span className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-aurora">
                Launch studio →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
