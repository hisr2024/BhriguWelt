"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Timeline from "@/components/Timeline";
import PredictionForm from "@/components/PredictionForm";
import OperationalStack from "@/components/OperationalStack";
import { getFutureProgress, type FutureProgressResponse } from "@/lib/api";

type FutureEvent = {
  title: string;
  window: string;
  houseAnchor: string;
  detail: string;
  icon?: string;
  planet?: string;
  progressLabel?: string;
};

export default function FuturePage() {
  const [progressData, setProgressData] = useState<FutureProgressResponse | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getFutureProgress()
      .then((data) => {
        if (!mounted) return;
        setProgressData(data);
      })
      .catch((error) => {
        console.error("Unable to fetch future progress", error);
        if (mounted) setProgressError("Using offline demo house progress");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const events = useMemo<FutureEvent[]>(
    () => [
      {
        title: "Transit glow",
        window: "Next 6 months",
        houseAnchor: "House 4 • Roots",
        detail: "Home rituals and study sprints anchor this phase; hover for remedy prompts.",
        icon: "☾",
        planet: "Moon",
      },
      {
        title: "Dasha shift",
        window: "2025",
        houseAnchor: "House 9 • Dharma",
        detail: "Scholarship streaks, pilgrimages, and mentorship checklists surface automatically.",
        icon: "♃",
        planet: "Jupiter",
      },
      {
        title: "Partnership bloom",
        window: "2026",
        houseAnchor: "House 7 • Partnerships",
        detail: "Shared service and travel markers light up; progress bars show karma resolution.",
        icon: "♀",
        planet: "Venus",
      },
    ],
    [],
  );

  const enrichedEvents = useMemo(() => {
    return events.map((event) => {
      const houseNumber = Number(event.houseAnchor.match(/(\d+)/)?.[1]);
      const milestone = progressData?.milestones.find((item) => item.house === houseNumber);

      return {
        ...event,
        houseIndex: houseNumber,
        progress: milestone?.completion,
        progressLabel: milestone?.label || event.progressLabel,
        planet: milestone?.planet || event.planet,
        icon: milestone?.icon || event.icon,
      };
    });
  }, [events, progressData]);

  const karmicResolution = progressData?.karmic_resolution ?? 0;

  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Future • Directive-first</p>
        <h1>Future directives with no extra fluff.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Detailed analysis and remedies come straight from the manuscripts with Sarvam AI summaries when configured.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
        </div>
      </div>

      <OperationalStack />

      <section className="panel softly" aria-label="Future timeline overlay">
        <div className="section-heading">
          <p className="eyebrow">Timeline</p>
          <h2>Scroll through phases</h2>
          <p className="muted">Milestones stay tied to the twelve-house band and feed remedies automatically.</p>
        </div>
        <div className="progress" aria-label="Karmic resolution progress">
          <div className="progress__bar" style={{ width: `${karmicResolution}%` }} />
          <span className="progress__label">{karmicResolution}% karmic resolution synced from backend</span>
        </div>
        <Timeline events={enrichedEvents} accent="pink" />
        <div className="microcopy">
          Drag or flick horizontally to fast-forward; milestones glow brighter as house anchors match the twelve-house band.
          {progressError ? ` ${progressError}.` : ""}
        </div>
      </section>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Future directives</h2>
            <p>Chart the manuscript-backed steps to take next in English and Hindi.</p>
          </div>
          <PredictionForm
            engine="future"
            title="Future directives"
            description="Analyses and remedies stay bundled for notifications, timelines, and profiles."
          />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Operational notes</p>
            <h2>Always manuscript-aligned</h2>
          </div>
          <p className="muted">Core wisdom data, analyzers, interpreters, designers, and Sarvam AI stay active for every directive.</p>
        </div>
      </section>
    </div>
  );
}
