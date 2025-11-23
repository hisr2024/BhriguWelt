'use client';

import dynamic from "next/dynamic";
import BirthInputForm from "@/components/BirthInputForm";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import QuarterlyReviewPanel from "@/components/QuarterlyReviewPanel";
import Timeline from "@/components/Timeline";
import { heroCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";
import { AetherBeltSection } from "./sections/AetherBeltSection";
import { HeroSection } from "./sections/HeroSection";
import { JourneyRail } from "./sections/JourneyRail";
import { RitualGrid } from "./sections/RitualGrid";
import { DEMO_CHART, DEMO_DASHAS, timelineNotes } from "./sections/sectionData";

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

const journeyTimeline = [
  {
    title: "Dawn: Venusian glow",
    window: "2024 Q3 - Q4",
    houseAnchor: "House 5 • Joy",
    detail: "Creative cycles brighten; save art-forward remedies to daily reminders.",
    icon: "🌅",
  },
  {
    title: "Midday: Saturn review",
    window: "2025 Q1 - Q2",
    houseAnchor: "House 10 • Karma",
    detail: "Career recalibration connected to bhava overlays—drag to fast-forward milestones.",
    icon: "🪐",
  },
  {
    title: "Evening: Lunar reflection",
    window: "2025 Q3 - Q4",
    houseAnchor: "House 12 • Rest",
    detail: "Retreat prompts and mantra streaks sync with the natal moon element you captured.",
    icon: "🌔",
  },
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
  const { navigationBody, bilingualBody, accuracyBody } = heroCopy;

  return (
    <div className="serene-page">
      <HeroSection />
      <AetherBeltSection />
      <RitualGrid />
      <JourneyRail />
      <section className="panel" id="birth-details">
        <div className="section-heading">
          <p className="eyebrow">Birth details</p>
          <h2>{t("hero.title", "Horoscope without noise")}</h2>
          <p className="muted">{t("home.grid.navigation.body", navigationBody)}</p>
        </div>
        <div className="panel__content panel__content--stacked">
          <div className="card softly cosmic-backdrop">
            <p className="microcopy">Save bilingual interpretations and export PDFs straight from the quiet interface.</p>
            <p className="microcopy">Only the essentials stay on screen: name, date, time, and place.</p>
            <ul className="soft-list">
              <li>Timezone auto-detect with friendly validation prompts.</li>
              <li>Śaka calendar preview that updates as you type.</li>
              <li>Mini 12-house chart with elemental glow for each segment.</li>
            </ul>
          </div>
          <div className="card highlight">
            <BirthInputForm />
          </div>
          <div className="card">
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

      <section className="panel softly" id="future-timeline">
        <div className="section-heading">
          <p className="eyebrow">Timeline</p>
          <h2>Future phases anchored to houses</h2>
          <p className="muted">
            Swipe through glowing milestones that map to the twelve-house foundation. Tooltips and local reminders keep seekers
            on track without feeling overwhelmed.
          </p>
        </div>
        <Timeline events={journeyTimeline} accent="amber" />
        <p className="microcopy" aria-live="polite">
          Drag horizontally to fast-forward through years; badges note which natal placements fuel each milestone.
        </p>
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
