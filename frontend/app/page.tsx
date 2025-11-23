'use client';

import dynamic from "next/dynamic";

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

    </div>
  );
}
