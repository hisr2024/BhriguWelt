'use client';

import Link from "next/link";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import QuarterlyReviewPanel from "@/components/QuarterlyReviewPanel";
import { heroCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

const houseRows = [
  { house: "1", sign: "Aries", focus: "Self & vitality" },
  { house: "2", sign: "Taurus", focus: "Resources & voice" },
  { house: "3", sign: "Gemini", focus: "Kin & courage" },
  { house: "4", sign: "Cancer", focus: "Home & roots" },
  { house: "5", sign: "Leo", focus: "Learning & joy" },
  { house: "6", sign: "Virgo", focus: "Health & discipline" },
  { house: "7", sign: "Libra", focus: "Partnerships" },
  { house: "8", sign: "Scorpio", focus: "Mysteries & transformation" },
  { house: "9", sign: "Sagittarius", focus: "Dharma & travel" },
  { house: "10", sign: "Capricorn", focus: "Career & karma" },
  { house: "11", sign: "Aquarius", focus: "Allies & networks" },
  { house: "12", sign: "Pisces", focus: "Rest & subconscious" },
];

const insightCards = [
  {
    scope: "Today",
    title: "Moonlit teal focus",
    body: "Steady the morning with breathwork; avoid impulsive travel asks.",
    why: "Śaka tithi Dwadashi brings inward momentum—ground before outreach.",
  },
  {
    scope: "This week",
    title: "Glassy collaboration",
    body: "Partners align when you present clear timelines and soft gradients of choice.",
    why: "Transit overlay shows allies in 11th house responding to calm prompts.",
  },
  {
    scope: "This month",
    title: "Sacred-yet-modern routines",
    body: "Commit to a twilight reading window; track remedies alongside cardio.",
    why: "Bhav moves through Virgo; discipline and devotion pair well now.",
  },
];

const timelineNodes = [
  { label: "Dasha", value: "Venus → Sun", meta: "Day", pill: "today" },
  { label: "Transit", value: "Saturn retro review", meta: "Week", pill: "focus" },
  { label: "Remedy", value: "Sandal dhup", meta: "Month", pill: "remedy" },
  { label: "Consult", value: "Elder session", meta: "Quarter", pill: "deep" },
];

const compatibilityFactors = [
  "Śaka-aware timeline sync",
  "Guna blend with lifestyle",
  "Shared rituals on weekends",
  "Motion reduction ready",
];

export default function HomePage() {
  const { t } = useI18n();
  const { heroBody, navigationBody, deployBody, accessibilityBody } = heroCopy;

  return (
    <div className="cosmic-dashboard">
      <section className="hero cosmic-panel cosmic-hero" id="overview">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{t("hero.eyebrow", "Bhrigu Samhita studio")}</p>
            <h1>{t("hero.title", "A sacred-yet-modern cosmic dashboard")}</h1>
            <p className="muted hero-lede">{t("hero.body", heroBody)}</p>
            <div className="progress-row" aria-label="Experience accents">
              <span className="progress-chip">Near-black canvas</span>
              <span className="progress-chip">Glassy surfaces</span>
              <span className="progress-chip">Breathing motion</span>
              <span className="progress-chip">WCAG contrast</span>
            </div>
            <div className="progress-meter" aria-hidden>
              <span />
            </div>
            <div className="hero-actions">
              <Link href="/horoscope" className="button-link">
                {t("hero.cta.horoscope", "Explore horoscope")}
              </Link>
              <Link href="/matchmaking" className="ghost-button">
                {t("hero.cta.matchmaking", "Modern matchmaking")}
              </Link>
              <span className="badge">Cosmic rail • Context dock • Motion toggle</span>
            </div>
          </div>

          <div className="glass-card" aria-label="Birth intake preview">
            <p className="eyebrow">Birth intake</p>
            <h3 style={{ margin: "0 0 0.4rem" }}>Minimal, tap-friendly fields</h3>
            <p className="microcopy">
              Two-column on desktop, single column on mobile. Timezone hints sit in the context dock while inline validation keeps flow calm.
            </p>
            <div className="progress-row" style={{ marginTop: "0.75rem" }}>
              <span className="pill">Date & time</span>
              <span className="pill">Location</span>
              <span className="pill">Timezone autodetect</span>
            </div>
            <div className="progress-meter" style={{ marginTop: "0.75rem" }} aria-hidden>
              <span />
            </div>
            <p className="microcopy">Segmented progress indicator glows softly as each detail completes.</p>
          </div>
        </div>
      </section>

      <section className="flow-grid" aria-label="Experience pillars">
        <div className="flow-card luminous">
          <span className="halo" aria-hidden />
          <p className="eyebrow">Navigation</p>
          <h3>{t("home.grid.navigation.title", "Every ritual has its own page")}</h3>
          <p>{t("home.grid.navigation.body", navigationBody)}</p>
        </div>
        <div className="flow-card luminous">
          <span className="halo" aria-hidden />
          <p className="eyebrow">Deploy-ready</p>
          <h3>{t("home.grid.deploy.title", "Render API, Vercel UI, native next")}</h3>
          <p>{t("home.grid.deploy.body", deployBody)}</p>
        </div>
        <div className="flow-card luminous">
          <span className="halo" aria-hidden />
          <p className="eyebrow">Accessibility</p>
          <h3>{t("home.grid.accessibility.title", "Screen-reader friendly interactions")}</h3>
          <p>{t("home.grid.accessibility.body", accessibilityBody)}</p>
        </div>
      </section>

      <section className="cosmic-panel" id="birth-details">
        <div className="section-heading">
          <p className="eyebrow">Birth Details</p>
          <h2>Frictionless entry with sacred cues</h2>
          <p>
            Cards for date, time, and location sit beside timezone hints; a subtle night map can sit behind location search while inline validation keeps the seeker steady.
          </p>
        </div>
        <div className="flow-grid">
          <div className="flow-card">
            <p className="eyebrow">Journey status</p>
            <h3>Progressive validation</h3>
            <p className="microcopy">
              Completeness chips illuminate as the seeker finishes each field. Tap-friendly hit areas stay above 44px with visible focus rings.
            </p>
            <div className="progress-row" style={{ marginTop: "0.5rem" }}>
              <span className="progress-chip">Inline checks</span>
              <span className="progress-chip">Context dock tips</span>
              <span className="progress-chip">Save-state indicator</span>
            </div>
            <div className="progress-meter" style={{ marginTop: "0.5rem" }} aria-hidden>
              <span />
            </div>
          </div>
          <div className="flow-card highlight">
            <PredictionForm
              engine="horoscope"
              title={t("pages.horoscope.title", "Holistic horoscope")}
              description="Two-column desktop form with a calm single-column mobile layout and inline validation."
            />
          </div>
        </div>
      </section>

      <section className="cosmic-panel" id="calendar-conversion">
        <div className="section-heading">
          <p className="eyebrow">Bharat Calendar Conversion</p>
          <h2>Gregorian ↔ Śaka with contextual wisdom</h2>
          <p>
            Toggle between calendar views, scrub the slim tithi slider, and hover tooltips for sacred metadata. Solid color fallbacks sit beneath gradients.
          </p>
        </div>
        <div className="flow-grid">
          <div className="flow-card">
            <p className="eyebrow">Timeline slider</p>
            <h3>Slim controls with calm glow</h3>
            <p className="microcopy">Drag to browse tithi and nakshatra; zoom controls shift between day, week, and month.</p>
            <input type="range" min="1" max="30" defaultValue="12" aria-label="Tithi slider" style={{ width: "100%" }} />
            <div className="progress-row" style={{ marginTop: "0.5rem" }}>
              <span className="pill">Gregorian</span>
              <span className="pill">Śaka</span>
              <span className="pill">Tooltip ready</span>
            </div>
            <p className="microcopy">Motion reduction softens easing for sensitive seekers.</p>
          </div>
          <div className="flow-card highlight">
            <CalendarForm />
          </div>
        </div>
      </section>

      <section className="cosmic-panel" id="chart-houses">
        <div className="section-heading">
          <p className="eyebrow">Full Chart</p>
          <h2>Radial chart with textual clarity</h2>
          <p>
            Crisp lines outline each house while a stacked list below keeps data legible. Hover highlights aspects; a floating switch can swap Rasi, Navamsa, or transit overlays.
          </p>
        </div>
        <div className="chart-stack">
          <div className="radial-chart" aria-hidden>
            <div className="orbit-ring" />
            <div className="orbit-ring" />
            <div className="orbit-ring" />
            <div className="orbit-node" />
          </div>
          <div className="flow-card">
            <div className="section-heading" style={{ marginBottom: "0.5rem" }}>
              <p className="eyebrow">House table</p>
              <h3>Stacked clarity</h3>
            </div>
            <table className="house-table" aria-label="House focuses">
              <tbody>
                {houseRows.map((row) => (
                  <tr key={row.house}>
                    <td>House {row.house}</td>
                    <td>{row.sign}</td>
                    <td>{row.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="cosmic-panel" id="insights">
        <div className="section-heading">
          <p className="eyebrow">Insights</p>
          <h2>Prioritized cards with calm headers</h2>
          <p>
            A masonry-like grid stacks today, week, and month insights with a "Why this matters" footer for clarity. Filters can pivot by theme or horizon without ornamentation.
          </p>
        </div>
        <div className="insight-stack">
          {insightCards.map((insight) => (
            <div key={insight.title} className="insight-card">
              <small>{insight.scope}</small>
              <h4>{insight.title}</h4>
              <p className="microcopy">{insight.body}</p>
              <div className="insight-why">
                <strong>Why this matters</strong>
                <p className="microcopy">{insight.why}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flow-card" style={{ marginTop: "1rem" }}>
          <QuarterlyReviewPanel />
        </div>
      </section>

      <section className="cosmic-panel" id="timelines">
        <div className="section-heading">
          <p className="eyebrow">Timelines</p>
          <h2>Scrollable anchor nodes with zoom</h2>
          <p>
            Glide across dashas and transits with anchor nodes and a mini-map. Event pills keep color minimal while tooltips hold depth.
          </p>
        </div>
        <div className="timeline-shell">
          <div className="timeline-track" role="list">
            {timelineNodes.map((node) => (
              <div key={node.value} className="timeline-node" role="listitem">
                <div className="timeline-dot" aria-hidden />
                <span>{node.label}</span>
                <p className="microcopy">{node.value}</p>
                <span className="pill">{node.pill}</span>
                <small className="muted">{node.meta}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cosmic-panel" id="matchmaking">
        <div className="section-heading">
          <p className="eyebrow">Matchmaking</p>
          <h2>Side-by-side serenity</h2>
          <p>
            Compatibility dials sit beside factor breakdowns. Actions for Share, Save, and Consult stay understated while the layout holds sacred geometry cues.
          </p>
        </div>
        <div className="matchmaking-grid">
          <div className="flow-card">
            <div className="compatibility-dial" aria-hidden>
              <div className="compatibility-meter" aria-hidden>
                <span />
              </div>
              <p className="muted" style={{ marginTop: "1rem" }}>
                Composite compatibility dial with glow-backed meter.
              </p>
            </div>
            <div className="compatibility-legend">
              {compatibilityFactors.map((factor) => (
                <div key={factor} className="pill" style={{ width: "fit-content" }}>
                  {factor}
                </div>
              ))}
            </div>
          </div>
          <div className="flow-card highlight">
            <MatchmakingForm />
          </div>
        </div>
      </section>

      <section className="flow-grid pathways">
        <div className="flow-card">
          <p className="eyebrow">Past-life explorer</p>
          <h3>Trace prior eras</h3>
          <p>Surface cross-era narratives straight from the preserved folios in flowing prose.</p>
          <Link className="button-link" href="/past-life">
            Open past-life page
          </Link>
        </div>
        <div className="flow-card">
          <p className="eyebrow">Future directives</p>
          <h3>Actionable steps</h3>
          <p>
            Chart the finance, devotion, and health moves Bhrigu prescribes for the next decade—written as guidance, not code.
          </p>
          <Link className="button-link" href="/future">
            Plan the future
          </Link>
        </div>
        <div className="flow-card">
          <p className="eyebrow">Wisdom first</p>
          <h3>Readable insights across web and native</h3>
          <p>
            Each page mirrors the backend contracts yet presents results as human stories so Android, iOS, and browser clients stay aligned without exposing raw payloads.
          </p>
          <Link className="button-link" href="/calendar">
            View calendar helper
          </Link>
        </div>
      </section>
    </div>
  );
}
