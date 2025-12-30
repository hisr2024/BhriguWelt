import Link from "next/link";

const pillars = [
  {
    title: "Command-center dashboard",
    description: "Today card, engine grid, and continuity preview in three stacked zones.",
  },
  {
    title: "Engine studios",
    description: "Horoscope, Past-Life, Future, Matchmaking, and Calendar workflows with evidence tabs.",
  },
  {
    title: "Bhrigu Chat",
    description: "Context-aware sessions with explain-why, summaries, and remedial suggestions.",
  },
  {
    title: "Profiles + sessions",
    description: "Persistent readings across web and mobile with multi-language preferences.",
  },
  {
    title: "Analytics + alerts",
    description: "Admin funnels, accuracy feedback, and dasha reminders for retention.",
  },
];

const journeys = [
  {
    title: "Start a reading",
    steps: [
      "Landing → onboarding (birth details + consent)",
      "Generate chart → results hub tabs",
      "Ask a question → Bhrigu Chat with context",
    ],
  },
  {
    title: "Returning seeker",
    steps: [
      "Open dashboard → resume session",
      "Adjust alerts and reminders",
      "Share/export via Wisdom Bot",
    ],
  },
  {
    title: "Matchmaking decision",
    steps: [
      "Create Person A/B profiles",
      "Run compatibility engine",
      "Review harmony score + action plan",
    ],
  },
];

const trustSignals = [
  "Inputs used + assumptions",
  "Manuscript citations on evidence cards",
  "Confidence indicator chips",
  "Explain-why drawer in chat",
];

export default function WebappPage() {
  return (
    <main id="main" tabIndex={-1} className="bg-hero-gradient text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-10 shadow-glow">
            <p className="text-xs uppercase tracking-[0.4em] text-aurora">BhriguWelt Webapp</p>
            <h1 className="mt-4 text-fluid-2xl font-semibold">A full-stack astrology studio with every engine.</h1>
            <p className="mt-4 text-sm text-slate-300">
              The webapp is the command center for horoscopes, past-life stories, future directives, matchmaking, and
              calendar conversion.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-full bg-aurora px-5 py-2 text-sm font-semibold text-slate-900">
                Open dashboard
              </Link>
              <Link href="/marketing" className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-100">
                View marketing site
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              <span className="rounded-full border border-white/10 px-3 py-1">Multi-language</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Kundli overlays</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Offline preview</span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Primary navigation</p>
            <h2 className="mt-3 text-xl font-semibold">Five tabs that match the product pillars</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200">Home · Dashboard · Horoscope · Matchmaking · Calendar</p>
                <p className="mt-2 text-xs text-slate-400">Secondary actions live in the Dashboard.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200">Multi-language toggle always visible.</p>
                <p className="mt-2 text-xs text-slate-400">English / हिंदी / Español / தமிழ்</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-3xl border border-white/10 bg-card-gradient p-6">
              <h3 className="text-lg font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Key journeys</p>
          <h2 className="mt-3 text-2xl font-semibold">Design the flows that convert and retain</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {journeys.map((journey) => (
              <div key={journey.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-base font-semibold">{journey.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {journey.steps.map((step) => (
                    <li key={step}>• {step}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Trust UI</p>
              <h2 className="mt-3 text-2xl font-semibold">Explain why, show evidence, build confidence</h2>
              <p className="mt-2 text-sm text-slate-300">
                The webapp highlights manuscript citations and confidence chips so seekers understand every insight.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-aurora">
                {trustSignals.map((signal) => (
                  <span key={signal} className="rounded-full border border-aurora/40 bg-aurora/10 px-3 py-1">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next steps</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li>Connect to Bhrigu Chat for clarifying questions.</li>
                <li>Set dasha alerts from any engine page.</li>
                <li>Export Wisdom Bot summaries for sharing.</li>
              </ul>
              <Link href="/mobile" className="mt-6 inline-flex text-sm text-aurora">
                Explore the mobile app →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
