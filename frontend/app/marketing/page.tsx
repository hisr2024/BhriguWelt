import Link from "next/link";

const engines = [
  {
    title: "Horoscope Engine",
    description: "Manuscript-backed readings with chart overlays and evidence citations.",
  },
  {
    title: "Past-Life Engine",
    description: "Reconstruct past-life themes and connect them to present-day patterns.",
  },
  {
    title: "Future Directives Engine",
    description: "Month-by-month guidance with confidence and assumption markers.",
  },
  {
    title: "Matchmaking Engine",
    description: "Compatibility scores tuned for modern preferences and family harmony.",
  },
  {
    title: "Śaka Calendar Conversion",
    description: "Gregorian to Śaka conversion with auspicious windows and planner mode.",
  },
];

const retentionFeatures = [
  {
    title: "Bhrigu Chat",
    description: "Session-based guidance with remedies, summaries, and explain-why citations.",
  },
  {
    title: "Wisdom Bot Export",
    description: "Shareable briefs in Markdown, PDF, or link format for families.",
  },
  {
    title: "Profiles & Sessions",
    description: "Persist readings, history, and preferences across every device.",
  },
  {
    title: "Dasha Alerts",
    description: "Gentle reminders for key windows with frictionless snooze controls.",
  },
  {
    title: "Admin Analytics",
    description: "Engine usage funnels and accuracy feedback for confident iteration.",
  },
];

const onboardingSteps = [
  "Birth details with timezone validation",
  "Goals selection (career, love, health, spiritual)",
  "Language + reading style preferences",
  "Consent + disclaimer",
  "Glossary quick tour with learn-later option",
];

const faqs = [
  {
    question: "Is the guidance rooted in traditional manuscripts?",
    answer: "Yes. Every engine references Bhrigu Samhita principles with transparent citations.",
  },
  {
    question: "Can I switch languages mid-reading?",
    answer: "The language toggle persists preferences across sessions (EN/हिंदी/Español/தமிழ்).",
  },
  {
    question: "Does BhriguWelt work offline?",
    answer: "Offline mode previews keep recent readings available even without connectivity.",
  },
];

export default function MarketingPage() {
  return (
    <main id="main" tabIndex={-1} className="bg-hero-gradient text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-10 shadow-glow">
            <p className="text-xs uppercase tracking-[0.4em] text-aurora">BhriguWelt Marketing</p>
            <h1 className="mt-4 text-fluid-2xl font-semibold">
              A premium, mystical-but-grounded astrology platform for seekers and families.
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              Showcase every engine, retention layer, and trust signal with an end-to-end website narrative that
              converts new visitors into long-term seekers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/horoscope" className="rounded-full bg-aurora px-5 py-2 text-sm font-semibold text-slate-900">
                Start a reading
              </Link>
              <Link
                href="/studio/insights"
                className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-100"
              >
                Open dashboard
              </Link>
            </div>
            <div className="mt-8 grid gap-4 text-xs uppercase tracking-[0.3em] text-slate-400 sm:grid-cols-3">
              <span>10+ ritual screens</span>
              <span>Multi-language UX</span>
              <span>Offline-first preview</span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Social proof</p>
            <h2 className="mt-3 text-xl font-semibold">Trust-building credibility blocks</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200">“Our families finally have a shared dashboard for decisions.”</p>
                <p className="mt-3 text-xs text-slate-400">– Seeker community, placeholder</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200">“The explain-why citations make every insight feel grounded.”</p>
                <p className="mt-3 text-xs text-slate-400">– Mentor circle, placeholder</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-slate-200">“Offline access keeps rituals consistent during travel.”</p>
                <p className="mt-3 text-xs text-slate-400">– Mobile pilot, placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Core engines</p>
            <h2 className="mt-3 text-2xl font-semibold">Five pillars of BhriguWelt intelligence</h2>
            <p className="mt-2 text-sm text-slate-300">
              Each engine is surfaced as a studio page with evidence, remedies, and next-step actions.
            </p>
          </div>
          <Link href="/engines" className="text-sm text-aurora">
            Explore all engines →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {engines.map((engine) => (
            <div key={engine.title} className="rounded-3xl border border-white/10 bg-card-gradient p-6">
              <h3 className="text-lg font-semibold">{engine.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{engine.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-aurora/40 bg-aurora/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-aurora">
                Engine live
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Retention layers</p>
              <h2 className="mt-3 text-2xl font-semibold">Design for continuity and trust</h2>
              <p className="mt-3 text-sm text-slate-300">
                Build sticky rituals with chat sessions, shareable reports, and alerts that align to the seeker’s
                timeline.
              </p>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                {retentionFeatures.map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-xs text-slate-300">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Onboarding journey</p>
                <ol className="mt-4 list-decimal space-y-3 pl-4 text-sm text-slate-200">
                  {onboardingSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Trust & transparency</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li>Inputs used + confidence markers</li>
                  <li>Manuscript citations + explain-why drawer</li>
                  <li>Gentle remedial suggestions</li>
                  <li>Consent + disclaimer baked into flows</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">How it works</p>
            <h3 className="mt-3 text-xl font-semibold">From birth details to guided action</h3>
            <p className="mt-2 text-sm text-slate-300">
              Capture precise inputs, generate evidence-backed readings, and keep seekers engaged through alerts.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Privacy & consent</p>
            <h3 className="mt-3 text-xl font-semibold">Grounded, respectful guidance</h3>
            <p className="mt-2 text-sm text-slate-300">
              Every reading includes a non-medical, non-financial disclaimer with transparent data usage.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pricing</p>
            <h3 className="mt-3 text-xl font-semibold">Flexible plans for seekers</h3>
            <p className="mt-2 text-sm text-slate-300">
              Placeholder tiers for free rituals, premium guidance, and family dashboards.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">FAQ</p>
              <h2 className="mt-3 text-2xl font-semibold">Answer common concerns quickly</h2>
              <p className="mt-2 text-sm text-slate-300">
                Make it easy to trust BhriguWelt before a visitor ever clicks “Start a reading.”
              </p>
            </div>
            <Link href="/webapp" className="rounded-full bg-aurora px-5 py-2 text-sm font-semibold text-slate-900">
              See the webapp
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-base font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
