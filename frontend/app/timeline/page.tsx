"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Timeline from "@/components/Timeline";
import { getTimeline } from "@/lib/api";

type TimelineMilestone = {
  label: string;
  completion: number;
  note?: string;
};

type TimelinePhase = {
  id: string;
  title: string;
  window: string;
  house: number;
  detail: string;
  progress: number;
  planet?: string;
  icon?: string;
  milestones?: TimelineMilestone[];
  reminders_url?: string;
};

type TimelineResponse = {
  phases?: TimelinePhase[];
  updated_at?: string;
};

export default function TimelinePage() {
  const [payload, setPayload] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getTimeline()
      .then((data) => {
        if (!mounted) return;
        setPayload(data as TimelineResponse);
      })
      .catch(() => {
        if (mounted) {
          setStatus("Timeline details will appear once the backend responds.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const phases = useMemo(() => (payload?.phases ?? []).slice(0, 5), [payload?.phases]);

  const timelineEvents = useMemo(
    () =>
      phases.map((phase) => ({
        title: phase.title,
        window: phase.window,
        houseAnchor: `House ${phase.house}`,
        detail: phase.detail,
        icon: phase.icon,
        planet: phase.planet,
        progress: phase.progress,
        progressLabel: "Phase completion",
        houseIndex: phase.house,
      })),
    [phases],
  );

  const handleToggle = (phaseId: string) => {
    setExpandedId((current) => (current === phaseId ? null : phaseId));
  };

  return (
    <div className="stack timeline-page">
      <header className="panel softly timeline-hero">
        <p className="eyebrow">12-house journey</p>
        <h1>Five-phase timeline aligned to your 12-house chart.</h1>
        <p className="muted">
          Swipe the rail to move through each phase, then tap to expand milestones, progress bars, and reminder links.
        </p>
        <div className="timeline-hero__actions">
          <Link href="/dashboard" className="button-link ghost-link">
            Back to dashboard
          </Link>
          <Link href="/calendar" className="button-link">
            Reminder alerts
          </Link>
        </div>
      </header>

      <section className="timeline-rail card">
        <div className="section-heading">
          <h2>Timeline rail</h2>
          <p className="muted">Five phases with progress and house anchors.</p>
        </div>
        <Timeline events={timelineEvents} accent="aqua" animatePhases />
        {loading ? <p className="microcopy">Syncing timeline phases…</p> : null}
        {status ? <p className="microcopy">{status}</p> : null}
        {payload?.updated_at ? <p className="microcopy">Last updated {payload.updated_at}</p> : null}
      </section>

      <section className="timeline-phases">
        <div className="section-heading">
          <h2>Phase milestones</h2>
          <p className="muted">Tap a phase to expand its milestones and reminder options.</p>
        </div>
        <div className="timeline-phases__grid">
          {phases.length ? (
            phases.map((phase) => {
              const expanded = expandedId === phase.id;
              return (
                <article key={phase.id} className="timeline-phase card">
                  <header className="timeline-phase__header">
                    <div>
                      <p className="pill">House {phase.house}</p>
                      <h3>{phase.title}</h3>
                      <p className="microcopy">{phase.window}</p>
                    </div>
                    <button
                      type="button"
                      className="ghost-link"
                      onClick={() => handleToggle(phase.id)}
                      aria-expanded={expanded}
                      aria-controls={`phase-${phase.id}`}
                    >
                      {expanded ? "Hide details" : "Tap to expand"}
                    </button>
                  </header>

                  <p className="muted">{phase.detail}</p>

                  <div className="timeline__progress" aria-label={`Progress for ${phase.title}`}>
                    <div className="timeline__progress-bar" style={{ width: `${phase.progress}%` }} />
                    <div className="timeline__progress-label">
                      <span>Phase completion</span>
                      <span>{phase.progress}%</span>
                    </div>
                  </div>

                  <div id={`phase-${phase.id}`} className={`timeline-phase__details ${expanded ? "is-open" : ""}`}>
                    <div className="timeline-phase__milestones">
                      {(phase.milestones ?? []).map((milestone, index) => (
                        <div key={`${phase.id}-milestone-${index}`} className="timeline-phase__milestone">
                          <div className="timeline-phase__milestone-head">
                            <span>{milestone.label}</span>
                            <span className="pill subtle">{milestone.completion}%</span>
                          </div>
                          {milestone.note ? <p className="microcopy">{milestone.note}</p> : null}
                          <div className="timeline__progress">
                            <div className="timeline__progress-bar" style={{ width: `${milestone.completion}%` }} />
                            <div className="timeline__progress-label">
                              <span>Milestone progress</span>
                              <span>{milestone.completion}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="timeline-phase__reminders">
                      <p className="microcopy">Set reminder alerts for this phase.</p>
                      <Link className="button-link ghost-link" href={phase.reminders_url || "/calendar"}>
                        Create reminder
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="timeline-phase card">
              <p className="muted">Timeline phases will appear once the backend responds.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
