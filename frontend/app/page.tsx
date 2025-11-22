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
            <h1>{t("hero.title", "Interpretations without clutter")}</h1>
            <p className="muted hero-lede">{t("hero.body", heroBody)}</p>
            <div className="hero-actions">
              <Link href="/horoscope" className="button-link">
                {t("hero.cta.horoscope", "Explore horoscope")}
              </Link>
              <Link href="/matchmaking" className="ghost-button">
                {t("hero.cta.matchmaking", "Modern matchmaking")}
              </Link>
            </div>
          </div>

          <div className="glass-card" aria-label="Birth intake preview">
            <p className="eyebrow">Birth intake</p>
            <h3 style={{ margin: "0 0 0.4rem" }}>Essentials only</h3>
            <p className="microcopy">Date, time, and location capture the chart for direct English and Hindi readings.</p>
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
          <h2>Direct entry for clean readings</h2>
          <p>Collect only what the folios need and leave room for interpretation.</p>
        </div>
        <div className="flow-grid">
          <div className="flow-card">
            <p className="eyebrow">Journey status</p>
            <h3>Calm validation</h3>
            <p className="microcopy">Inline checks keep focus on the story instead of the interface.</p>
          </div>
          <div className="flow-card highlight">
            <PredictionForm
              engine="horoscope"
              title={t("pages.horoscope.title", "Holistic horoscope")}
              description="Desktop or mobile layouts stay simple so the interpretation can breathe."
            />
          </div>
        </div>
      </section>

      <section className="cosmic-panel" id="calendar-conversion">
        <div className="section-heading">
          <p className="eyebrow">Bharat Calendar Conversion</p>
          <h2>Gregorian ↔ Śaka</h2>
          <p>Convert quickly before sending any request to the engines.</p>
        </div>
        <div className="flow-grid">
          <div className="flow-card">
            <p className="eyebrow">Timeline slider</p>
            <h3>Quick glance</h3>
            <p className="microcopy">Reference tithi and nakshatra without extra ornamentation.</p>
            <input type="range" min="1" max="30" defaultValue="12" aria-label="Tithi slider" style={{ width: "100%" }} />
          </div>
          <div className="flow-card highlight">
            <CalendarForm />
          </div>
        </div>
      </section>

      <section className="cosmic-panel" id="chart-houses">
        <div className="section-heading">
          <p className="eyebrow">Full Chart</p>
          <h2>Radial chart, clear labels</h2>
          <p>House details stay readable beside the visual so the narrative stays primary.</p>
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
          <h2>Interpretations at a glance</h2>
          <p>Today, week, and month guidance sit in quiet cards with room for context.</p>
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
          <h2>Scrollable anchor nodes</h2>
          <p>Dashas and transits stay legible; zoom only when you need to.</p>
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
          <p>Compatibility scores and factors sit together without extra decoration.</p>
        </div>
        <div className="matchmaking-grid">
          <div className="flow-card">
            <div className="compatibility-dial" aria-hidden>
              <div className="compatibility-meter" aria-hidden>
                <span />
              </div>
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
          <p>Cross-era narratives stay concise and citation-backed.</p>
          <Link className="button-link" href="/past-life">
            Open past-life page
          </Link>
        </div>
        <div className="flow-card">
          <p className="eyebrow">Future directives</p>
          <h3>Actionable steps</h3>
          <p>Finance, devotion, and health steps return as plain guidance.</p>
          <Link className="button-link" href="/future">
            Plan the future
          </Link>
        </div>
        <div className="flow-card">
          <p className="eyebrow">Wisdom first</p>
          <h3>Readable insights across web and native</h3>
          <p>Each page mirrors backend contracts while keeping space for interpretation over UI chrome.</p>
          <Link className="button-link" href="/calendar">
            View calendar helper
          </Link>
        </div>
      </section>
    </div>
  );
}
