'use client';

import Link from "next/link";
import dynamic from "next/dynamic";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import QuarterlyReviewPanel from "@/components/QuarterlyReviewPanel";
import { heroCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";
import { ChartHouse, DashaPeriod } from "@/types/astro";

const KundliCharts = dynamic(() => import("@/components/KundliCharts"), {
  ssr: false,
  loading: () => <div className="card softly">Drawing kundli wheel…</div>,
});

const BhriguChat = dynamic(() => import("@/components/BhriguChat"), {
  ssr: false,
  loading: () => <div className="card softly">Activating Bhrigu chat…</div>,
});

const rhythmTracks = [
  {
    title: "Himalayan dawn water",
    src: "https://cdn.pixabay.com/download/audio/2021/09/14/audio_f4a0a9d4a9.mp3?filename=calm-river-ambience-loop-6455.mp3",
    description: "Flowing water under faint temple bells and tanpura.",
  },
  {
    title: "Forest wind and chimes",
    src: "https://cdn.pixabay.com/download/audio/2022/08/26/audio_8bb3c5b7c1.mp3?filename=wind-chimes-11744.mp3",
    description: "Soft breeze, leaves, and subtle metal chimes for steady focus.",
  },
  {
    title: "Evening birds and altar",
    src: "https://cdn.pixabay.com/download/audio/2023/07/24/audio_24a3fd0f6b.mp3?filename=ambient-calm-15149.mp3",
    description: "Bird calls with distant temple bells, mixed at a gentle hush.",
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

const DEMO_CHART: ChartHouse[] = [
  { index: 1, sign: "Aries", occupants: ["Sun"], bhrigu_notes: ["Vitality and initiative rising."] },
  { index: 2, sign: "Taurus", occupants: ["Moon"], bhrigu_notes: ["Steady voice anchors resources."] },
  { index: 3, sign: "Gemini", occupants: ["Mars"], bhrigu_notes: ["Curious courage fuels siblings."] },
  { index: 4, sign: "Cancer", occupants: ["Mercury"], bhrigu_notes: ["Home conversations feel tender."] },
  { index: 5, sign: "Leo", occupants: ["Jupiter"], bhrigu_notes: ["Joy and teaching glow."], },
  { index: 6, sign: "Virgo", occupants: ["Saturn"], bhrigu_notes: ["Discipline refines health."] },
  { index: 7, sign: "Libra", occupants: ["Venus"], bhrigu_notes: ["Partnerships feel balanced."], },
  { index: 8, sign: "Scorpio", occupants: ["Ketu"], bhrigu_notes: ["Mystery inspires transformation."], },
  { index: 9, sign: "Sagittarius", occupants: ["Rahu"], bhrigu_notes: ["Travel and dharma stretch horizons."], },
  { index: 10, sign: "Capricorn", occupants: ["—"], bhrigu_notes: ["Career asks for patient structure."], },
  { index: 11, sign: "Aquarius", occupants: ["—"], bhrigu_notes: ["Allies gather around shared ideals."], },
  { index: 12, sign: "Pisces", occupants: ["—"], bhrigu_notes: ["Rest nurtures intuition."], },
];

const DEMO_DASHAS: DashaPeriod[] = [
  { lord: "Venus", start: "2024-01", end: "2026-06", anchor_rule: "Lean into artful collaboration." },
  { lord: "Sun", start: "2026-06", end: "2027-11", anchor_rule: "Claim leadership with warmth." },
  { lord: "Moon", start: "2027-11", end: "2029-02", anchor_rule: "Rest and listen to the tides." },
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
          <div className="geometry-breath">
            <span className="pill ghost">Cosmic geometry kept light</span>
            <span className="pill ghost">Pastel gradients, warm + cool</span>
            <span className="pill ghost">Nature-led layouts</span>
          </div>
        </div>
        <div className="serene-hero__visuals">
          <div
            className="aether-visual"
            role="img"
            aria-label="Pastel mountains over a river at dawn with subtle geometry"
          >
            <span className="aether-aurora" aria-hidden />
            <span className="aether-sun" aria-hidden />
            <span className="aether-peak left" aria-hidden />
            <span className="aether-peak right" aria-hidden />
            <span className="aether-water" aria-hidden />
            <span className="aether-geometry" aria-hidden />
            <span className="aether-leaf" aria-hidden />
            <span className="aether-leaf delay" aria-hidden />
          </div>
          <div className="listening-card" aria-label="Soothing music">
            <p className="eyebrow">Serene music</p>
            <h3>Let the session breathe</h3>
            <p className="muted">Layer soft water, wind, chimes, and bells beneath your readings.</p>
            <div className="sound-grid" role="list">
              {rhythmTracks.map((track, index) => (
                <div key={track.src} className="audio-tile" role="listitem">
                  <div>
                    <strong>{track.title}</strong>
                    <p className="microcopy">{track.description}</p>
                  </div>
                  <audio controls autoPlay={index === 0} loop preload="auto" aria-label={track.title}>
                    <source src={track.src} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="aether-belt softly" aria-label="Calm visual system">
        <div className="aether-belt__copy">
          <p className="eyebrow">Nature as the altar</p>
          <h2>Minimal, modern, timeless</h2>
          <p className="muted">
            Warm dawn light, gentle rivers, and geometric halos keep the interface sacred yet functional.
            Smooth transitions and high-contrast typography stay readable at every step.
          </p>
          <div className="aether-points">
            <div>
              <strong>Subtle cosmic geometry</strong>
              <p className="microcopy">Fine-line yantra hints and harmonic symmetry embedded as soft overlays.</p>
            </div>
            <div>
              <strong>Pastel gradients</strong>
              <p className="microcopy">Dawn-to-dusk hues balance cool mists and warm sand for clarity.</p>
            </div>
            <div>
              <strong>Fluid motion</strong>
              <p className="microcopy">Leaves and ripples drift slowly to signal calm without clutter.</p>
            </div>
          </div>
        </div>
        <div className="aether-belt__scene" aria-hidden>
          <div className="aether-belt__panel">
            <div className="aether-visual small">
              <span className="aether-aurora" aria-hidden />
              <span className="aether-sun" aria-hidden />
              <span className="aether-peak left" aria-hidden />
              <span className="aether-peak right" aria-hidden />
              <span className="aether-water" aria-hidden />
              <span className="aether-geometry" aria-hidden />
              <span className="aether-leaf" aria-hidden />
            </div>
            <div className="aether-belt__legend">
              <span className="pill">Mountains</span>
              <span className="pill">River</span>
              <span className="pill">Sky gradient</span>
              <span className="pill">Yantra grid</span>
            </div>
          </div>
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

      <section className="journey-rail" aria-label="Guided Jyotish journey">
        <div className="section-heading">
          <p className="eyebrow">Story-like flow</p>
          <h2>Birth input → chart → interpretations → timelines</h2>
          <p className="muted">Gentle animations, tooltips, and glossary entries keep new users confident.</p>
        </div>
        <div className="journey-rail__steps">
          <details className="journey-rail__step" open>
            <summary>
              <span className="pill">1</span>
              <div>
                <strong>Gather inputs</strong>
                <p className="microcopy">Form hints explain tithi, nakshatra, and bhava in plain language.</p>
              </div>
            </summary>
            <p className="muted">Auto-validations and timezone nudges keep the data precise.</p>
          </details>
          <details className="journey-rail__step">
            <summary>
              <span className="pill">2</span>
              <div>
                <strong>Render chart wheels</strong>
                <p className="microcopy">Kundli wheels glow softly; hover or tap to reveal micro-interpretations.</p>
              </div>
            </summary>
            <p className="muted">Graphics are lazy-loaded for performance and mobile friendliness.</p>
          </details>
          <details className="journey-rail__step">
            <summary>
              <span className="pill">3</span>
              <div>
                <strong>Explore timelines</strong>
                <p className="microcopy">Horizontal nodes expand to show dasha, transit, and remedy prompts.</p>
              </div>
            </summary>
            <p className="muted">Progress indicators and badges show what data powered each insight.</p>
          </details>
        </div>
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

      <section className="panel softly" id="visualization">
        <div className="section-heading">
          <p className="eyebrow">Data visualisation</p>
          <h2>Kundli wheels and immersive overlays</h2>
          <p className="muted">
            Graphical rāśi and bhava wheels replace text-only outputs. Hover or tap planets to expand their stories.
          </p>
        </div>
        <KundliCharts rashiChart={DEMO_CHART} bhavaChart={DEMO_CHART} dashas={DEMO_DASHAS} />
        <div className="micro-interactions" aria-label="Micro-interactions and tooltips">
          <div>
            <h4>Micro-interactions</h4>
            <p className="muted">Subtle pulses on the wheel, fade-in legends, and swipe-to-reveal overlays modernise the neon theme.</p>
          </div>
          <div>
            <h4>Progressive disclosure</h4>
            <p className="muted">Expandable overlays keep newcomers from feeling overwhelmed while still rewarding deep dives.</p>
          </div>
          <div>
            <h4>Icons for planets</h4>
            <p className="muted">Element glyphs sit atop each card—fire, earth, air, and water cues sit beside the sign badges.</p>
          </div>
        </div>
      </section>

      <section className="panel" id="assist">
        <div className="section-heading">
          <p className="eyebrow">Ask anything</p>
          <h2>Chat with the Bhrigu guide</h2>
          <p className="muted">
            Real-time feedback loop keeps seekers heard. Ask clarifying questions and capture their notes instantly.
          </p>
        </div>
        <div className="panel__content">
          <div className="card softly">
            <p className="microcopy">Supports mobile voice dictation, swipe to dismiss, and large tap targets.</p>
            <p className="microcopy">Responses thread alongside glossary hints for absolute beginners.</p>
          </div>
          <div className="card highlight">
            <BhriguChat />
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
