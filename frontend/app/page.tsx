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

export default function HomePage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-12">
      <OnboardingDialog />
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-10 shadow-glow">
          <p className="text-xs uppercase tracking-[0.4em] text-aurora">Bhrigu Samhita Intelligence</p>
          <h1 className="mt-4 text-fluid-2xl font-semibold">
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

    </main>
  );
}
