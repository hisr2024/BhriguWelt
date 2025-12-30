import Link from "next/link";

import KundliChart from "./components/KundliChart";
import OnboardingDialog from "./components/OnboardingDialog";

const quickLinks = [
  {
    title: "Horoscope Studio",
    description: "Generate manuscript-backed chart readings with bilingual insights.",
    href: "/horoscope",
  },
  {
    title: "Insights Dashboard",
    description: "Connect the full chart, remedies, and real-time chat guidance.",
    href: "/studio/insights",
  },
  {
    title: "Matchmaking",
    description: "Compare compatibility and harmony markers for modern partnerships.",
    href: "/matchmaking",
  },
  {
    title: "Sacred Calendar",
    description: "Convert Gregorian dates into Śaka-aligned spiritual timing.",
    href: "/calendar",
  },
];

const experienceLinks = [
  {
    title: "Webapp Experience",
    description: "Navigate every engine, dashboard, and session flow in the full studio.",
    href: "/webapp",
  },
  {
    title: "Marketing Website",
    description: "High-converting storytelling for seekers, families, and mentors.",
    href: "/marketing",
  },
  {
    title: "Mobile App",
    description: "Native-first guidance with offline mode, alerts, and one-handed rituals.",
    href: "/mobile",
  },
];

const studioRoles = [
  {
    title: "Stacks Engineer",
    description: "Architecting resilient systems, data flows, and layered interfaces for scale.",
    tag: "Systems · Cloud · APIs",
  },
  {
    title: "UI/UX Specialist",
    description: "Crafting intuitive journeys with tactile touchpoints and accessible navigation.",
    tag: "Research · Interaction · Flow",
  },
  {
    title: "Animation Specialist",
    description: "Breathing motion into every overlay, transition, and ritual cue.",
    tag: "Motion · Micro-interactions",
  },
  {
    title: "Graphics & App Designer",
    description: "Composing brand visuals, mobile-first layouts, and luminous assets.",
    tag: "Brand · Visuals · Mobile",
  },
];

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12">
      <OnboardingDialog />
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-10 shadow-glow">
          <p className="text-xs uppercase tracking-[0.4em] text-aurora">Bhrigu Samhita Intelligence</p>
          <h1 className="mt-4 text-fluid-2xl font-semibold font-display">
            The world-class astrology command center for seekers, mentors, and families.
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            BhriguWelt unifies horoscope, past-life, future, and matchmaking engines into a single ritual-ready
            studio. Each dashboard keeps manuscripts, charts, and remedies connected across devices.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/horoscope"
              className="rounded-full bg-aurora px-5 py-2 text-sm font-semibold text-slate-900"
            >
              Start a reading
            </Link>
            <Link
              href="/studio/insights"
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-100"
            >
              Open dashboard
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live chart preview</p>
              <h2 className="mt-2 text-xl">Kundli overlays</h2>
            </div>
            <span className="rounded-full border border-aurora/40 bg-aurora/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-aurora">
              Real time
            </span>
          </div>
          <div className="mt-6 flex items-center justify-center text-aurora">
            <KundliChart className="h-44 w-44" />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Square chart geometry is preserved across mobile, tablet, and desktop layouts.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/70 p-8 shadow-sm">
        <div className="absolute inset-0 bg-bricks opacity-40" aria-hidden="true" />
        <div className="absolute -right-24 -top-20 h-48 w-48 rounded-full bg-aurora/25 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Studio craft</p>
            <h2 className="text-2xl font-semibold text-slate-900 font-display">
              Animated logos, bricks, and overlays for every creative discipline.
            </h2>
            <p className="text-sm text-slate-600">
              A modular identity system highlights each discipline with stacked logos, animated blocks, and layered
              glass overlays so the experience feels tangible from web to app.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {studioRoles.map((role) => (
              <div
                key={role.title}
                className="card-with-overlay relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur"
              >
                <span className="card-overlay" aria-hidden="true" />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="logo-stack">
                    <span className="logo-orbit" aria-hidden="true" />
                    <span className="logo-block logo-block--one" aria-hidden="true" />
                    <span className="logo-block logo-block--two" aria-hidden="true" />
                    <span className="logo-block logo-block--three" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{role.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">{role.description}</p>
                    <span className="mt-3 inline-flex rounded-full bg-slate-900/5 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">
                      {role.tag}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-aurora/50"
          >
            <h3 className="text-lg font-semibold text-white group-hover:text-aurora">{link.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{link.description}</p>
            <span className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-slate-400">
              Enter experience →
            </span>
          </Link>
        ))}
      </section>

      <section className="rounded-3xl border border-white/10 bg-card-gradient p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Platform experiences</p>
            <h2 className="mt-3 text-2xl font-semibold">Create for web, marketing, and mobile</h2>
            <p className="mt-3 text-sm text-slate-300">
              Launch the full BhriguWelt ecosystem with a cohesive webapp, premium marketing site, and native mobile
              rituals built around the same manuscript intelligence.
            </p>
          </div>
          <Link href="/marketing" className="rounded-full bg-aurora px-5 py-2 text-sm font-semibold text-slate-900">
            Explore platform
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {experienceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-aurora/50"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-aurora">{link.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{link.description}</p>
              <span className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-slate-400">
                See blueprint →
              </span>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}
