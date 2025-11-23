'use client';

import Link from "next/link";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import QuarterlyReviewPanel from "@/components/QuarterlyReviewPanel";
import { heroCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

const rhythmTracks = [
  {
    title: "Morning tanpura loop",
    src: "https://cdn.pixabay.com/download/audio/2022/10/23/audio_719f1f4f0d.mp3?filename=calm-meditation-11936.mp3",
    description: "Soft drone to keep readings serene.",
  },
];

const ritualCards = [
  {
    title: "Daily jyotish glance",
    body: "Capture date, time, and place without distraction. Let the reading surface instantly in English and Hindi.",
    action: "Check horoscope",
    href: "/horoscope",
  },
  {
    title: "Śaka calendar ready",
    body: "Convert Gregorian to Śaka quietly before sharing remedies or timings.",
    action: "Open converter",
    href: "#calendar-conversion",
  },
  {
    title: "Kindred matches",
    body: "Explore compatibility as a calm flow with factors, not noise.",
    action: "Start matchmaking",
    href: "#matchmaking",
  },
];

const timelineNotes = [
  { label: "Dasha", value: "Venus → Sun", detail: "harmonising", tone: "sunrise" },
  { label: "Transit", value: "Saturn review", detail: "slow and steady", tone: "sand" },
  { label: "Remedy", value: "Sandal dhup", detail: "light daily", tone: "lotus" },
];

export default function HomePage() {
  const { t } = useI18n();
  const { heroBody, navigationBody, bilingualBody, accuracyBody } = heroCopy;

  return (
    <div className="serene-page">
      <section className="serene-hero" id="overview">
        <div className="serene-hero__copy">
          <p className="eyebrow">Bharatcentric • Minimal</p>
          <h1>{t("hero.title", "BhriguWelt, now quietly reset")}</h1>
          <p className="muted hero-lede">
            {t(
              "hero.body",
              heroBody ||
                "A soft astrology workspace to collect details, convert calendars, and share bilingual remedies without clutter."
            )}
          </p>
          <div className="hero-actions">
            <Link href="#birth-details" className="button-link">
              {t("hero.cta.horoscope", "Begin horoscope")}
            </Link>
            <Link href="#matchmaking" className="ghost-button">
              {t("hero.cta.matchmaking", "Check compatibility")}
            </Link>
          </div>
          <div className="subtle-pill-row">
            <span className="pill">Śaka friendly</span>
            <span className="pill">English + हिंदी</span>
            <span className="pill">PDF ready</span>
          </div>
        </div>
        <div className="listening-card" aria-label="Soothing music">
          <p className="eyebrow">Serene music</p>
          <h3>Let the session breathe</h3>
          <p className="muted">A gentle track plays by default. Adjust volume as you settle in.</p>
          {rhythmTracks.map((track) => (
            <div key={track.src} className="audio-tile">
              <div>
                <strong>{track.title}</strong>
                <p className="microcopy">{track.description}</p>
              </div>
              <audio controls autoPlay loop preload="auto" aria-label={track.title}>
                <source src={track.src} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          ))}
        </div>
      </section>

      <section className="card-grid" aria-label="Core rituals">
        {ritualCards.map((card) => (
          <article className="card" key={card.title}>
            <p className="eyebrow">Ritual</p>
            <h3>{card.title}</h3>
            <p className="muted">{card.body}</p>
            <Link href={card.href} className="ghost-link">
              {card.action}
            </Link>
          </article>
        ))}
      </section>

      <section className="panel" id="birth-details">
        <div className="section-heading">
          <p className="eyebrow">Birth details</p>
          <h2>{t("hero.title", "Horoscope without noise")}</h2>
          <p className="muted">{t("home.grid.navigation.body", navigationBody)}</p>
        </div>
        <div className="panel__content">
          <div className="card softly">
            <p className="microcopy">Save bilingual interpretations and export PDFs straight from the quiet interface.</p>
            <p className="microcopy">Only the essentials stay on screen: name, date, time, and place.</p>
          </div>
          <div className="card highlight">
            <PredictionForm
              engine="horoscope"
              title={t("pages.horoscope.title", "Holistic horoscope")}
              description="Enter details at your pace and receive calm guidance."
            />
          </div>
        </div>
      </section>

      <section className="panel" id="calendar-conversion">
        <div className="section-heading">
          <p className="eyebrow">Śaka ready</p>
          <h2>Gregorian ↔ Śaka</h2>
          <p className="muted">{t("home.grid.bilingual.body", bilingualBody)}</p>
        </div>
        <div className="panel__content">
          <div className="card softly">
            <p className="microcopy">Reference tithi and nakshatra without extra chrome.</p>
            <div className="timeline-chips" role="list">
              {timelineNotes.map((note) => (
                <div className={`timeline-chip ${note.tone}`} key={note.label} role="listitem">
                  <span className="pill">{note.label}</span>
                  <strong>{note.value}</strong>
                  <p className="microcopy">{note.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card highlight">
            <CalendarForm />
          </div>
        </div>
      </section>

      <section className="panel" id="matchmaking">
        <div className="section-heading">
          <p className="eyebrow">Matchmaking</p>
          <h2>Aligned companionship</h2>
          <p className="muted">{t("home.grid.accuracy.body", accuracyBody)}</p>
        </div>
        <div className="panel__content">
          <div className="card softly">
            <h4>What we check</h4>
            <ul className="soft-list">
              <li>Śaka-aware rituals for celebrations</li>
              <li>Guna blend alongside lifestyle preferences</li>
              <li>Weekday-compatible remedies to try together</li>
            </ul>
          </div>
          <div className="card highlight">
            <MatchmakingForm />
          </div>
        </div>
      </section>

      <section className="panel softly" id="insights">
        <div className="section-heading">
          <p className="eyebrow">Quarterly lens</p>
          <h2>Guidance that stays gentle</h2>
          <p className="muted">Lean on structured reviews while keeping the interface restful.</p>
        </div>
        <QuarterlyReviewPanel />
      </section>
    </div>
  );
}
