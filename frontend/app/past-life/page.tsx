"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PredictionForm from "@/components/PredictionForm";

type PastLifeInsight = {
  narrative?: string;
  sutra_reference?: string;
  confidence?: number;
};

type PastLifePayload = {
  insights?: PastLifeInsight[];
  interpretation?: string;
  name?: string;
};

export default function PastLifePage() {
  const [chartReady, setChartReady] = useState(false);
  const [illustrationStyle, setIllustrationStyle] = useState<"ancient" | "modern">("ancient");
  const [activeStep, setActiveStep] = useState(0);

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

  const baseChapters = useMemo(
    () => [
      {
        title: "Past influences",
        description: "Healing vows return; service along rivers guides this birth.",
        cue: "Chart-rendered sutra anchors appear here.",
      },
      {
        title: "Current lessons",
        description: "Partnership karma asks for shared study and steady rituals.",
        cue: "Narration tunes to your moon element once the wheel loads.",
      },
      {
        title: "Future echoes",
        description: "Service-forward leadership echoes earlier promises; remedies stay actionable.",
        cue: "Folio references are attached to every echo.",
      },
    ],
    [],
  );

  const [chapters, setChapters] = useState(baseChapters);

  const deriveChapters = useCallback(
    (payload: unknown) => {
      if (!payload || typeof payload !== "object") return baseChapters;
      const parsed = payload as PastLifePayload;
      const insights = Array.isArray(parsed.insights) ? parsed.insights : [];
      if (!insights.length) return baseChapters;

      const toCue = (insight?: PastLifeInsight, fallback?: string) => {
        if (!insight) return fallback || "Awaiting sutra reference.";
        const ref = insight.sutra_reference ? `Folio ${insight.sutra_reference}` : null;
        const certainty = insight.confidence ? ` • confidence ${(insight.confidence * 100).toFixed(0)}%` : "";
        return ref ? `${ref}${certainty}` : fallback || `Core wisdom confidence ${(insight.confidence ?? 0).toFixed(2)}`;
      };

      const [past, present, future] = insights;
      const resolved = [
        {
          title: "Past influences",
          description: past?.narrative || baseChapters[0]?.description,
          cue: toCue(past, parsed.interpretation),
        },
        {
          title: "Current lessons",
          description: present?.narrative || parsed.interpretation || baseChapters[1]?.description,
          cue: toCue(present, parsed.interpretation),
        },
        {
          title: "Future echoes",
          description: future?.narrative || baseChapters[2]?.description,
          cue: toCue(future, parsed.interpretation),
        },
      ].filter((entry) => Boolean(entry.description));

      return resolved.length ? resolved : baseChapters;
    },
    [baseChapters],
  );

  const activeStyle = styleTokens[illustrationStyle];

  const transitions = useMemo(
    () => [
      {
        label: "Core wisdom secured",
        detail: "Bhrigu folios load and bind to your birth inputs.",
      },
      {
        label: "Analyzers align",
        detail: "Engine analyzers map placements to manuscript logic.",
      },
      {
        label: "Interpreters & design",
        detail: "Interpreters and designers stitch sutra-backed stories with remedies.",
      },
    ],
    [],
  );

  useEffect(() => {
    if (!chartReady) return;
    const timers = transitions.map((_, index) =>
      setTimeout(() => setActiveStep((previous) => Math.max(previous, index)), index * 320),
    );
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [chartReady, transitions]);

  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Past-life • Folio referenced</p>
        <h1>Past lives with only the essentials.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          The chain stays tight: Bhrigu core wisdom, analyzers, interpreters, and Sarvam-backed AI summaries.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
        </div>
      </div>

      <section className="panel softly" aria-live="polite">
        <div className="section-heading">
          <h2>Charts first, then sutra-backed stories</h2>
          <p className="muted">Only the operational steps remain; no excess descriptions.</p>
        </div>
        <div className="transition-rail" role="list" aria-label="Guided transitions">
          {transitions.map((transition, index) => {
            const isActive = chartReady ? index <= activeStep : index === 0;

            return (
              <div
                key={transition.label}
                role="listitem"
                className={`transition-rail__step ${isActive ? "transition-rail__step--active" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                <div className="transition-rail__orb" aria-hidden>
                  <span className="transition-rail__pulse" />
                  <span className="transition-rail__icon">{isActive ? "✺" : "◌"}</span>
                </div>
                <div>
                  <p className="pill">{index + 1}</p>
                  <h3>{transition.label}</h3>
                  <p className="muted">{transition.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="story-rail" aria-label="Past-life arc">
        <div className="story-rail__intro">
          <p className="pill">Illustrated deck</p>
          <h2>Stories unfurl after chart generation</h2>
          <p className="muted">
            Chapters pull directly from the manuscript analyzers once birth details validate. The deck stays lean—just the
            sutras and cues.
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
                Generate your natal chart first. Bhrigu Core will feed analyzers and interpreters, then unlock these cards.
              </p>
            </div>
          )}
        </div>
        <div className="story-rail__grid" role="list">
          {chapters.map((chapter, index) => (
            <article
              key={chapter.title}
              className={`story-rail__card softly ${chartReady ? "story-rail__card--active" : "story-rail__card--locked"}`}
              role="listitem"
              aria-label={chapter.title}
              aria-live="polite"
              style={{ transitionDelay: chartReady ? `${index * 90}ms` : undefined }}
            >
              <div className="story-rail__orbit" aria-hidden>
                <span className="story-rail__planet" />
                <span className="story-rail__planet story-rail__planet--shadow" />
              </div>
              <div className="story-rail__canvas" aria-hidden>
                <div
                  className="story-rail__art"
                  style={{ backgroundImage: activeStyle.gradient, borderColor: activeStyle.accent }}
                >
                  <span className="story-rail__glyph" role="presentation">
                    {activeStyle.icon}
                  </span>
                </div>
                <div className="story-rail__glow" />
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
            description="Detailed analysis and remedies arrive together—nothing extra."
            onRequestStart={() => {
              setChartReady(false);
              setActiveStep(0);
              setChapters(baseChapters);
            }}
            onResult={(payload) => {
              setChartReady(true);
              setActiveStep(1);
              setChapters(deriveChapters(payload));
            }}
          />
        </div>
      </section>
    </div>
  );
}
