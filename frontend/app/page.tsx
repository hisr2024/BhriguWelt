import Navigation from "@/components/navigation/Navigation";

const engineCards = [
  {
    title: "Astro Insight Engine",
    description:
      "Transforms birth data into layered life-cycle predictions, transit windows, and timing forecasts.",
    icon: "🪐",
  },
  {
    title: "Synapse Matcher",
    description:
      "Maps compatibility scores and shared growth arcs with dynamic relationship matrices.",
    icon: "🤝",
  },
  {
    title: "Karma Ledger",
    description:
      "Tracks patterns, strengths, and friction points using behavior and habit inputs.",
    icon: "📜",
  },
  {
    title: "Vastu Aura",
    description:
      "Audits spatial flow, energy nodes, and layout improvements for any environment.",
    icon: "🏡",
  },
  {
    title: "Career Compass",
    description:
      "Aligns skills, ambitions, and planetary strengths to craft tailored career routes.",
    icon: "🧭",
  },
  {
    title: "Wellness Pulse",
    description:
      "Highlights wellness checkpoints, rest cycles, and recovery rituals.",
    icon: "💫",
  },
];

const inputs = [
  "Birth details & location",
  "Personal goals & preferences",
  "Lifestyle patterns",
  "Project timelines",
  "Environment snapshots",
];

const outputs = [
  "Personalized forecasts",
  "Actionable rituals",
  "Decision dashboards",
  "Compatibility matrices",
  "Engine-to-engine insights",
];

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-slate-950 text-white">
      <Navigation />
      <main className="scroll-smooth">
        <section className="relative overflow-hidden bg-hero-gradient pb-24 pt-32">
          <div className="absolute inset-0 bg-cosmic-radial opacity-80" />
          <div className="absolute right-10 top-24 hidden h-60 w-60 rounded-full bg-cosmic-glow blur-3xl md:block" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6">
            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.4em] text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                AI-augmented astrology
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Real-time insight engines
              </span>
            </div>
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-4">
                  <div className="logo-reveal flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/5 text-lg font-semibold">
                    BW
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                      BhriguWelt
                    </p>
                    <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                      The intelligence layer for cosmic decisions.
                    </h1>
                  </div>
                </div>
                <p className="max-w-xl text-base text-white/70 sm:text-lg">
                  Animated insight engines that blend astrology, behavioral data, and spatial
                  intelligence into one cohesive, mobile-first platform. Feed the inputs, launch
                  the engines, and receive guided outputs you can act on instantly.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-glow">
                    Start with your inputs
                  </button>
                  <button className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white">
                    Watch engine demo
                  </button>
                </div>
                <div className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.3em] text-white/50">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Live insight streams
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    Adaptive timing windows
                  </span>
                </div>
              </div>
              <div className="grid gap-4">
                {[
                  "99.8% forecast precision",
                  "12+ engine clusters",
                  "24/7 guided rituals",
                ].map((item) => (
                  <div
                    key={item}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-white/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white/80">
                        {item}
                      </span>
                      <span className="text-xl opacity-70 transition group-hover:opacity-100">
                        ✨
                      </span>
                    </div>
                    <div className="mt-4 h-1 w-full rounded-full bg-white/10">
                      <div className="h-1 w-3/4 rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-sky-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="engines" className="relative -mt-16 px-6 pb-20">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-card-gradient p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  Engines
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  A grid of intelligent engines, built for every life domain.
                </h2>
              </div>
              <button className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/60 hover:text-white">
                View all engines
              </button>
            </div>
            <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible lg:grid-cols-3">
              {engineCards.map((engine) => (
                <article
                  key={engine.title}
                  className="group w-72 flex-shrink-0 snap-center rounded-3xl border border-white/10 bg-slate-950/70 p-6 transition duration-300 hover:-translate-y-2 hover:border-white/40 hover:bg-slate-900/80 md:w-auto"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{engine.icon}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/50 transition group-hover:border-white/40 group-hover:text-white/80">
                      Engine
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">
                    {engine.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/60">
                    {engine.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.3em] text-white/40">
                      Swipe
                    </span>
                    <span className="text-lg transition group-hover:translate-x-1">→</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="inputs" className="px-6 pb-20">
          <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Inputs</p>
              <h3 className="text-2xl font-semibold text-white">
                Bring everything in: data, intent, and context.
              </h3>
              <p className="text-sm text-white/60">
                Each engine invites specific signals. Personal data becomes a
                personalized blueprint, while contextual cues fuel adaptive guidance.
              </p>
              <div className="flex flex-wrap gap-3">
                {inputs.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 transition hover:border-white/40 hover:text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-result-gradient p-8 shadow-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Input preview
              </p>
              <div className="mt-6 space-y-4 text-sm text-white/80">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Birth chart seed</span>
                  <span className="text-white/50">verified</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Personal priorities</span>
                  <span className="text-white/50">4 focus areas</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Environment scan</span>
                  <span className="text-white/50">synced</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="outputs" className="px-6 pb-20">
          <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/60">
                <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
                Outputs
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">
                Outputs that feel like a co-pilot.
              </h3>
              <p className="mt-3 text-sm text-white/60">
                Every output blends narrative clarity with actionable next steps, so
                you can move from insight to action quickly.
              </p>
              <div className="mt-6 grid gap-3">
                {outputs.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:border-white/40 hover:text-white"
                  >
                    <span>{item}</span>
                    <span className="text-white/40">↗</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Why it works</p>
              <h3 className="text-3xl font-semibold text-white">
                Adaptive micro-animations and gradients that feel alive.
              </h3>
              <p className="text-sm text-white/60">
                Micro-interactions guide attention and make each engine feel tactile,
                even on mobile. Swipe through cards, tap for details, and watch the
                outputs respond with calming transitions.
              </p>
              <button className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/60 hover:text-white">
                Explore outputs
              </button>
            </div>
          </div>
        </section>

        <section id="workflow" className="px-6 pb-24">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-slate-950/80 p-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Workflow</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Inputs → Engines → Outputs. Everything connected.
                </h3>
              </div>
              <div className="flex gap-3">
                <button className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70 transition hover:border-white/60 hover:text-white">
                  View pipeline
                </button>
                <button className="rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:-translate-y-0.5">
                  Build a ritual
                </button>
              </div>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Input Studio",
                  detail: "Collect, validate, and enrich personal data in minutes.",
                },
                {
                  title: "Engine Orchestration",
                  detail: "Trigger multiple engines, stack insights, and sync outputs.",
                },
                {
                  title: "Output Scenes",
                  detail: "Deliver a guided story, ritual checklist, and timing map.",
                },
              ].map((step, index) => (
                <div
                  key={step.title}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-white/40"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    0{index + 1}
                  </p>
                  <h4 className="mt-3 text-lg font-semibold text-white">
                    {step.title}
                  </h4>
                  <p className="mt-2 text-sm text-white/60">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="px-6 pb-24">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-card-gradient p-10 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Ready</p>
            <h3 className="mt-3 text-3xl font-semibold text-white">
              Launch the next-generation BhriguWelt experience.
            </h3>
            <p className="mt-4 text-sm text-white/60">
              Designed for the best web apps, mobile experiences, and AI-first
              platforms, BhriguWelt connects every engine to the insights your users
              need most.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-glow">
                Request early access
              </button>
              <button className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/60 hover:text-white">
                Meet the team
              </button>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .logo-reveal {
          position: relative;
          overflow: hidden;
        }

        .logo-reveal::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          transform: translateX(-120%);
          animation: shimmer 3.5s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-120%);
          }
          50% {
            transform: translateX(120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
      `}</style>
    </div>
  );
}
