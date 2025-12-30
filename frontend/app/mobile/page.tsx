import Link from "next/link";

const tabs = ["Home", "Dashboard", "Horoscope", "Matchmaking", "Calendar"];

const mobileFeatures = [
  {
    title: "Offline mode preview",
    description: "Keep the most recent readings and chart views available without connectivity.",
  },
  {
    title: "Alert scheduling",
    description: "Create dasha reminders with calendar + timeline views and gentle snooze controls.",
  },
  {
    title: "One-handed input",
    description: "Large tap targets, stacked fields, and smart defaults for rapid onboarding.",
  },
  {
    title: "Kundli gestures",
    description: "Pinch, zoom, and lock the square chart geometry across every device.",
  },
  {
    title: "Haptics + voice",
    description: "Subtle confirmations for actions and optional voice guidance prompts.",
  },
];

const screenSet = [
  "Onboarding flow",
  "Horoscope Studio",
  "Past-Life Studio",
  "Future Directives",
  "Matchmaking",
  "Śaka Calendar",
  "Bhrigu Chat",
  "Wisdom Bot",
  "Alerts",
  "Profile & sessions",
];

export default function MobilePage() {
  return (
    <main id="main" tabIndex={-1} className="bg-hero-gradient text-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-10 shadow-glow">
            <p className="text-xs uppercase tracking-[0.4em] text-aurora">BhriguWelt Mobile</p>
            <h1 className="mt-4 text-fluid-2xl font-semibold">Native-first rituals for every seeker, anywhere.</h1>
            <p className="mt-4 text-sm text-slate-300">
              Translate the full webapp into a mobile-first experience with bottom tabs, offline previews, and
              confidence-forward guidance.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/marketing" className="rounded-full bg-aurora px-5 py-2 text-sm font-semibold text-slate-900">
                View marketing site
              </Link>
              <Link
                href="/studio/insights"
                className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-100"
              >
                Open dashboard
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              <span className="rounded-full border border-white/10 px-3 py-1">iOS + Android ready</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Offline-first</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Haptic guidance</span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Bottom tab navigation</p>
            <h2 className="mt-3 text-xl font-semibold">Five core tabs</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <span
                  key={tab}
                  className="rounded-full border border-aurora/40 bg-aurora/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-aurora"
                >
                  {tab}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-300">
              Secondary entry points live inside the Dashboard: Past-Life, Future, Chat, Wisdom Bot, Alerts, and
              Profile.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-6 md:grid-cols-2">
          {mobileFeatures.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-white/10 bg-card-gradient p-6">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Screen set</p>
              <h2 className="mt-3 text-2xl font-semibold">Everything from onboarding to analytics</h2>
              <p className="mt-2 text-sm text-slate-300">
                The mobile app mirrors the webapp studios while prioritizing thumb-friendly interactions.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                {screenSet.map((screen) => (
                  <div key={screen} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    {screen}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Offline UX</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li>Cached chart previews + last session transcript</li>
                  <li>Graceful reconnect prompts with retry controls</li>
                  <li>Background sync for saved alerts</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Gesture guidance</p>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li>Pinch/zoom on Kundli overlays</li>
                  <li>Swipe between result tabs</li>
                  <li>Long-press to reveal explain-why citations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Launch CTA</p>
              <h2 className="mt-3 text-2xl font-semibold">Ready the mobile rollout</h2>
              <p className="mt-2 text-sm text-slate-300">
                Pair the native app with the web dashboard and marketing site for a unified rollout.
              </p>
            </div>
            <Link href="/webapp" className="rounded-full bg-aurora px-5 py-2 text-sm font-semibold text-slate-900">
              Review webapp
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
