'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

import BirthInputForm from "@/components/BirthInputForm";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import Timeline from "@/components/Timeline";
import { journeyTimeline } from "../sections/sectionData";

const flowSteps = [
  { title: "Intake", detail: "Names, dates, places collected with timezone-aware validation." },
  { title: "Engines", detail: "Horoscope, past life, future, matchmaking, and calendar pipelines." },
  { title: "Interpret", detail: "Readable guidance, Śaka-aware citations, and share-ready notes." },
  { title: "Care", detail: "Follow-up reminders, rituals, and streak-friendly nudges." },
];

const connectionStories = [
  {
    title: "Family round",
    tone: "Gentle guidance",
    note: "Grandparents and children follow the same calm dashboard to compare remedies.",
  },
  {
    title: "Wedding prep",
    tone: "Shared rituals",
    note: "Dual matchmaking cards plus action streaks keep both families aligned.",
  },
  {
    title: "Solo reset",
    tone: "Quiet focus",
    note: "Daily insight cards animate softly to keep the seeker grounded without noise.",
  },
];

const animatedLogos = ["ॐ", "☉", "☾", "☿", "♀", "♂", "♃", "♄"];

export default function DashboardPage() {
  const [activeStory, setActiveStory] = useState(connectionStories[0]);
  const [activeFlow, setActiveFlow] = useState(flowSteps[0]);

  const flowChart = useMemo(
    () =>
      flowSteps.map((step, index) => ({
        ...step,
        connector: index < flowSteps.length - 1,
      })),
    [],
  );

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div>
          <p className="pill subtle">Bhrigu command desk</p>
          <h1>Every Bhrigu engine, now in a calm multi-page dashboard.</h1>
          <p className="muted">
            Human-first navigation with live forms, interactive flowcharts, and motion that stays respectful of focus. Move from
            intake to remedies without losing your place.
          </p>
          <div className="hero-actions">
            <Link className="button-link" href="/horoscope">
              Open horoscope
            </Link>
            <Link className="button-link ghost-link" href="/future">
              Future guidance
            </Link>
            <Link className="ghost-link" href="#tools-grid">
              See the tools
            </Link>
          </div>
        </div>
        <div className="logo-orbit" aria-hidden>
          {animatedLogos.map((logo, index) => (
            <div key={logo} className={`logo-orbit__node node-${index}`}>
              {logo}
            </div>
          ))}
          <div className="logo-orbit__core">BW</div>
        </div>
      </header>

      <section id="tools-grid" className="dashboard-grid" aria-label="Tool access grid">
        <article className="dashboard-card">
          <div>
            <p className="eyebrow">Profiles</p>
            <h3>Horoscope & Past Life</h3>
            <p className="muted">Switch between beginner and advanced interpretations with glossary support.</p>
            <div className="badge-row">
              <span className="badge">Live</span>
              <span className="badge badge--ghost">Human tone</span>
            </div>
          </div>
          <Link className="button-link" href="/horoscope">
            Go to horoscope
          </Link>
        </article>
        <article className="dashboard-card">
          <div>
            <p className="eyebrow">Calendar</p>
            <h3>Śaka converter</h3>
            <p className="muted">Drop-in date conversion with tithi hints for travel and rituals.</p>
            <div className="badge-row">
              <span className="badge">Fast</span>
              <span className="badge badge--ghost">Śaka aware</span>
            </div>
          </div>
          <Link className="button-link" href="/calendar">
            Convert dates
          </Link>
        </article>
        <article className="dashboard-card">
          <div>
            <p className="eyebrow">Care</p>
            <h3>Future directives</h3>
            <p className="muted">Action cards animate gently so seekers never feel overwhelmed.</p>
            <div className="badge-row">
              <span className="badge">Notifications</span>
              <span className="badge badge--ghost">Rituals</span>
            </div>
          </div>
          <Link className="button-link" href="/future">
            Plan the path
          </Link>
        </article>
        <article className="dashboard-card">
          <div>
            <p className="eyebrow">Connections</p>
            <h3>Matchmaking studio</h3>
            <p className="muted">Dual forms, guna scoring, and gentle recommendations for families.</p>
            <div className="badge-row">
              <span className="badge">Dual</span>
              <span className="badge badge--ghost">Shareable</span>
            </div>
          </div>
          <Link className="button-link" href="/matchmaking">
            Open matchmaking
          </Link>
        </article>
      </section>

      <section className="flowchart" aria-label="Experience flowchart">
        <div className="flowchart__header">
          <div>
            <p className="eyebrow">Journey view</p>
            <h2>Flowchart for calm, multi-page navigation</h2>
            <p className="muted">Each step glows as you focus—helping seekers understand where they are in the Bhrigu experience.</p>
          </div>
          <div className="flowchart__actions">
            {flowChart.map((step) => (
              <button
                key={step.title}
                type="button"
                className={`pill ${activeFlow.title === step.title ? "active" : ""}`}
                onClick={() => setActiveFlow(step)}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>
        <div className="flowchart__grid" role="list">
          {flowChart.map((step, index) => (
            <div key={step.title} className={`flowchart__card ${activeFlow.title === step.title ? "is-active" : ""}`} role="listitem">
              <span className="badge">{index + 1}</span>
              <h3>{step.title}</h3>
              <p className="muted">{step.detail}</p>
              {step.connector ? <div className="flowchart__connector" aria-hidden /> : null}
            </div>
          ))}
        </div>
        <div className="flowchart__note surface">
          <p className="eyebrow">Active step</p>
          <p className="muted">{activeFlow.detail}</p>
        </div>
      </section>

      <section className="story-grid" aria-label="Human stories">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Human connections</p>
            <h2>Stories that stay grounded</h2>
            <p className="muted">Built-in tone guides and gestures make space for empathy on every screen.</p>
          </div>
          <div className="chip-row" role="tablist">
            {connectionStories.map((story) => (
              <button
                key={story.title}
                type="button"
                role="tab"
                aria-selected={activeStory.title === story.title}
                className={`pill ${activeStory.title === story.title ? "active" : ""}`}
                onClick={() => setActiveStory(story)}
              >
                {story.title}
              </button>
            ))}
          </div>
        </header>
        <div className="story-grid__content">
          <div className="story-card">
            <p className="pill">{activeStory.tone}</p>
            <h3>{activeStory.title}</h3>
            <p className="muted">{activeStory.note}</p>
            <div className="story-card__glow" aria-hidden />
          </div>
          <div className="story-card surface">
            <p className="eyebrow">Live dashboard preview</p>
            <Timeline events={journeyTimeline} accent="amber" />
          </div>
        </div>
      </section>

      <section className="dashboard-forms" aria-label="Live forms">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Live engines</p>
            <h2>Interact without leaving the dashboard</h2>
            <p className="muted">
              Forms stay in split-view so seekers can input, review, and share without losing the path. Motion cues stay subtle to
              keep focus on accuracy.
            </p>
          </div>
          <div className="badge-row">
            <span className="badge">Responsive</span>
            <span className="badge badge--ghost">Accessible</span>
          </div>
        </header>
        <div className="dashboard-forms__grid">
          <div className="surface surface--stack">
            <header className="surface__header">
              <h3>Birth intake</h3>
              <p className="muted">Horoscope + past life ready.</p>
            </header>
            <BirthInputForm />
          </div>
          <div className="surface surface--stack">
            <header className="surface__header">
              <h3>Śaka calendar</h3>
              <p className="muted">Calendar engine without leaving the flow.</p>
            </header>
            <CalendarForm />
          </div>
        </div>
        <div className="dashboard-forms__grid two-col">
          <div className="surface surface--stack">
            <header className="surface__header">
              <h3>Matchmaking</h3>
              <p className="muted">Dual profiles, one calm lane.</p>
            </header>
            <MatchmakingForm />
          </div>
          <div className="surface surface--stack">
            <header className="surface__header">
              <h3>Future directives</h3>
              <p className="muted">Shortcut to prediction engine with share-ready copy.</p>
            </header>
            <PredictionForm
              engine="future"
              title="Instant future focus"
              description="Set a timer, send a calm directive, and keep seekers centred."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
