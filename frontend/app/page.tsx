'use client';

import Link from "next/link";
import dynamic from "next/dynamic";

import CalendarForm from "@/components/CalendarForm";
import BirthInputForm from "@/components/BirthInputForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import QuarterlyReviewPanel from "@/components/QuarterlyReviewPanel";
import Timeline from "@/components/Timeline";
import { useI18n } from "@/lib/i18n";
import { DEMO_CHART, DEMO_DASHAS, journeyTimeline } from "./sections/sectionData";

const KundliCharts = dynamic(() => import("@/components/KundliCharts"), {
  ssr: false,
  loading: () => <div className="surface">Drawing kundli wheel…</div>,
});

const BhriguChat = dynamic(() => import("@/components/BhriguChat"), {
  ssr: false,
  loading: () => <div className="surface">Activating Bhrigu chat…</div>,
});

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="minimal-page">
      <section className="minimal-hero">
        <p className="pill subtle">Bhrigu engines</p>
        <h1>Minimal guidance for every journey</h1>
        <p className="muted">A calm, distraction-free layer over the horoscope, calendar, matchmaking, and chat engines.</p>
        <div className="hero-actions">
          <Link className="button-link" href="/matchmaking">
            {t("nav.cta", "Start a session")}
          </Link>
          <Link className="button-link ghost-link" href="/dashboard">
            Dashboard view
          </Link>
          <Link className="ghost-link" href="#tools">
            Browse tools
          </Link>
        </div>
      </section>

      <section id="tools" className="minimal-grid">
        <div className="surface surface--stack" id="birth">
          <header className="surface__header">
            <h3>Birth profile</h3>
            <p className="muted">Essentials only: identity, time, place, and timezone-aware validation.</p>
          </header>
          <BirthInputForm />
        </div>

        <div className="surface surface--stack" id="calendar">
          <header className="surface__header">
            <h3>Śaka ↔ Gregorian</h3>
            <p className="muted">Fast conversions with simple hints for tithi and nakshatra.</p>
          </header>
          <CalendarForm />
        </div>

        <div className="surface surface--stack" id="matchmaking">
          <header className="surface__header">
            <h3>Matchmaking</h3>
            <p className="muted">Collect two profiles, review guna balance, and send a calm recommendation.</p>
          </header>
          <MatchmakingForm />
        </div>
      </section>

      <section className="minimal-grid two-col">
        <div className="surface surface--stack">
          <header className="surface__header">
            <h3>Timeline</h3>
            <p className="muted">Swipe through the next phases without extra chrome.</p>
          </header>
          <Timeline events={journeyTimeline} accent="aqua" />
        </div>
        <div className="surface surface--stack">
          <header className="surface__header">
            <h3>Quarterly focus</h3>
            <p className="muted">Light prompts that keep seekers moving without narration.</p>
          </header>
          <QuarterlyReviewPanel />
        </div>
      </section>

      <section className="minimal-grid two-col">
        <div className="surface surface--stack">
          <header className="surface__header">
            <h3>Charts</h3>
            <p className="muted">Clean kundli wheels with hoverable placements.</p>
          </header>
          <KundliCharts rashiChart={DEMO_CHART} bhavaChart={DEMO_CHART} dashas={DEMO_DASHAS} />
        </div>
        <div className="surface surface--stack">
          <header className="surface__header">
            <h3>Bhrigu chat</h3>
            <p className="muted">Short replies, inline glossary, and export-ready threads.</p>
          </header>
          <BhriguChat />
          <div className="surface__actions">
            <PredictionForm
              engine="horoscope"
              title={t("pages.horoscope.title", "Holistic horoscope")}
              description="Quick prompts for new seekers."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
