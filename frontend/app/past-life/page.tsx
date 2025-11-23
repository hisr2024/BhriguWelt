"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PredictionForm from "@/components/PredictionForm";

export default function PastLifePage() {
  const [chartReady, setChartReady] = useState(false);
  const [illustrationStyle, setIllustrationStyle] = useState<"ancient" | "modern">("ancient");

  const styleTokens = useMemo(
    () => ({
      ancient: {
        label: "Ancient motifs",
        gradient: "linear-gradient(135deg, rgba(255,232,199,0.4), rgba(136,96,64,0.25))",
        accent: "#f2c57c",
        icon: "🕯️",
      },
      modern: {
        label: "Modern abstract",
        gradient: "radial-gradient(circle at 20% 20%, rgba(165,214,255,0.4), rgba(111,89,211,0.35))",
        accent: "#9ab7ff",
        icon: "✨",
      },
    }),
    []
  );

  const chapters = [
    {
      title: "Past influences",
      description: "Healing work along sacred rivers; vows to serve carry into this birth.",
      cue: "Unlocks once the natal chart is ready.",
    },
    {
      title: "Current lessons",
      description: "Partnership karma asks for shared study, reflective journaling, and breath-led rituals.",
      cue: "Guided narration adapts to your moon element.",
    },
    {
      title: "Future echoes",
      description: "Service-forward leadership surfaces as an echo of earlier vows—stories end with actionable remedies.",
      cue: "Cards fade in sequentially for screen readers and storytellers alike.",
    },
  ];

  const activeStyle = styleTokens[illustrationStyle];

  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Past-life • Folio referenced</p>
        <h1>Surface reincarnation arcs with manuscript rigor.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Invite seekers to explore prior epochs and karmic lessons in story form without technical clutter. Generate the chart
          first; only then do the stories fade in.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
        </div>
      </div>

      <section className="story-rail" aria-label="Past-life arc">
        <div className="story-rail__intro">
          <p className="pill">Unlock sequence</p>
          <h2>Stories unfurl after chart generation</h2>
          <p className="muted">
            Each chapter unlocks only when birth details are validated. Screen readers narrate the arcs in order while soft
            animations respect quiet reading.
          </p>
          <div className="chip-group" role="group" aria-label="Illustration style">
            {(["ancient", "modern"] as const).map((style) => (
              <button
                key={style}
                type="button"
                className={`chip ${illustrationStyle === style ? "chip--active" : ""}`}
                onClick={() => setIllustrationStyle(style)}
                aria-pressed={illustrationStyle === style}
              >
                {styleTokens[style].icon} {styleTokens[style].label}
              </button>
            ))}
          </div>
          {!chartReady && (
            <div className="alert softly" role="status">
              <p className="microcopy">
                Generate your natal chart first. Narratives will reveal themselves with illustrations once the chart is ready.
              </p>
            </div>
          )}
        </div>
        <div className="story-rail__grid" role="list">
          {chapters.map((chapter, index) => (
            <article
              key={chapter.title}
              className={`story-rail__card softly ${!chartReady ? "story-rail__card--locked" : ""}`}
              role="listitem"
              aria-label={chapter.title}
              aria-live="polite"
            >
              <div className="story-rail__orbit" aria-hidden>
                <span className="story-rail__planet" />
                <span className="story-rail__planet story-rail__planet--shadow" />
              </div>
              <div
                className="story-rail__art"
                aria-hidden
                style={{ backgroundImage: activeStyle.gradient, borderColor: activeStyle.accent }}
              >
                <span className="story-rail__glyph" role="presentation">
                  {activeStyle.icon}
                </span>
              </div>
              <p className="pill">{index + 1}</p>
              <h3>{chapter.title}</h3>
              <p>{chartReady ? chapter.description : "Narrative locked until the chart is drawn."}</p>
              <p className="microcopy">{chartReady ? chapter.cue : "Provide birth details and render the wheel."}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Past-life excavation</h2>
            <p>Trace eras, lessons, and remedies with the same validated inputs used in the horoscope engine.</p>
          </div>
          <PredictionForm
            engine="past-life"
            title="Past-life excavation"
            description="Great for story-driven timelines, profile badges, and loyalty rewards."
            onRequestStart={() => setChartReady(false)}
            onResult={() => setChartReady(true)}
          />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Why it resonates</p>
            <h2>Classical insight for every generation</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Scroll friendly</span>
              <span>Looks sharp inside mobile app webviews and landing pages.</span>
            </li>
            <li>
              <span className="badge">Shareable stories</span>
              <span>Drop the response into cards, chat, or push notifications with English and Hindi side by side.</span>
            </li>
            <li>
              <span className="badge">Same validation</span>
              <span>Tithi, elements, and houses are enforced here too.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
