"use client";

import { KundliChart } from "@/components/KundliChart";
import { OnboardingDialog } from "@/components/OnboardingDialog";
import { LinkButton } from "@/components/ui/LinkButton";

const engines = [
  {
    title: "Horoscope Engine",
    description: "Panchanga-aligned intake with chart visuals and bilingual reading output.",
    href: "/horoscope",
  },
  {
    title: "Past-Life Engine",
    description: "Narrative regressions, sutra references, and karmic memory highlights.",
    href: "/past-life",
  },
  {
    title: "Future Engine",
    description: "Trajectory map, milestone tracker, and long-range planning prompts.",
    href: "/future",
  },
  {
    title: "Matchmaking Engine",
    description: "Dual-profile compatibility with modern preference tags and clarity metrics.",
    href: "/matchmaking",
  },
  {
    title: "Śaka Calendar",
    description: "Global calendar conversions with culturally grounded guidance.",
    href: "/calendar",
  },
  {
    title: "Studio Insights",
    description: "Chart + chat studio for real-time Bhrigu consultation.",
    href: "/studio/insights",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <OnboardingDialog />
      <section className="grid gap-8 rounded-3xl border border-slate-800 bg-hero-gradient p-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Bhrigu Welt Studio</p>
          <h1 className="text-fluid-2xl font-semibold text-white">
            Explore the Bhrigu Samhita engines—built for mobile seekers, powered by real-time charting.
          </h1>
          <p className="text-sm text-slate-200">
            A modern sanctuary for horoscope, past-life, future, matchmaking, and calendar insights. Designed with touch-first
            gestures, responsive dashboards, and a PWA-ready experience.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/horoscope">Start with Horoscope</LinkButton>
            <LinkButton href="/studio/insights" variant="ghost">
              Enter Studio
            </LinkButton>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <KundliChart />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h2 className="text-fluid-lg font-semibold">Quick guidance</h2>
          <p className="mt-2 text-sm text-slate-300">
            Jump into an engine and keep the outputs centered. Each workflow is tuned for small screens and full functionality.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/past-life">Past-Life</LinkButton>
            <LinkButton href="/future" variant="ghost">
              Future
            </LinkButton>
            <LinkButton href="/matchmaking" variant="ghost">
              Matchmaking
            </LinkButton>
          </div>
          <div className="mt-6 grid gap-4 rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>Touch gestures</span>
              <span className="font-semibold text-amber-200">Swipe to open menu</span>
            </div>
            <div className="flex items-center justify-between">
              <span>PWA ready</span>
              <span className="font-semibold text-emerald-200">Installable experience</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Live engines</span>
              <span className="font-semibold text-sky-200">Backend + offline fallback</span>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-card-gradient p-6">
          <h3 className="text-lg font-semibold">Live previews</h3>
          <ul className="mt-4 grid gap-3 text-sm text-slate-200">
            <li className="flex items-start gap-2">
              <span className="text-amber-200">◆</span>
              Mobile-first cards keep inputs and results legible in portrait mode.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-200">◆</span>
              Results stay anchored with sticky action bars and clear status signals.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-200">◆</span>
              Engine outputs map to charts, future timelines, and matchmaking scores.
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {engines.map((engine) => (
          <Link
            key={engine.title}
            href={engine.href}
            className="group rounded-3xl border border-slate-800 bg-card-gradient p-5 transition hover:border-amber-300/60"
          >
            <h3 className="text-lg font-semibold text-white group-hover:text-amber-200">{engine.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{engine.description}</p>
            <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
              Open engine
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
