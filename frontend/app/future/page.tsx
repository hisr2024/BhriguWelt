"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import PredictionForm from "@/components/PredictionForm";
import Timeline from "@/components/Timeline";
import BhriguChat from "@/components/BhriguChat";
import { getFutureProgress, requestPrediction } from "@/lib/api";
import { loadBirthDetails } from "@/lib/birthStorage";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import type { BirthDetails } from "@/types/astro";
import { useThemeMode, type ThemeMode } from "@/lib/themeContext";

type FutureTrajectory = {
  focus?: string;
  window?: string;
  certainty?: number;
  house?: number;
  planet?: string;
  icon?: string;
};

type FuturePayload = {
  interpretation?: string;
  trajectories?: FutureTrajectory[];
  future_trajectories?: FutureTrajectory[];
  chart?: unknown;
};

type ProgressMilestone = {
  house: number;
  label: string;
  completion: number;
  planet?: string;
  icon?: string;
};

type FutureProgress = {
  karmic_resolution?: number;
  milestones?: ProgressMilestone[];
};

const fallbackEvents = [
  {
    title: "Chart alignment",
    window: "Phase 1 • 90 days",
    houseAnchor: "House 1",
    detail: "Stabilize the ascendant story and confirm the chart signatures.",
    icon: "✶",
    progress: 48,
    progressLabel: "Alignment",
    houseIndex: 1,
  },
  {
    title: "Ritual cadence",
    window: "Phase 2 • 6 months",
    houseAnchor: "House 4",
    detail: "Build a consistent ritual calendar with family anchors.",
    icon: "☾",
    progress: 62,
    progressLabel: "Karmic resolution",
    houseIndex: 4,
  },
  {
    title: "Dharma activation",
    window: "Phase 3 • 1-2 years",
    houseAnchor: "House 9",
    detail: "Expand study, travel, and mentorship commitments.",
    icon: "♃",
    progress: 35,
    progressLabel: "Milestone completion",
    houseIndex: 9,
  },
];

const hasRequiredDetails = (details: BirthDetails) =>
  Boolean(details.birthDate && details.birthTime && details.birthPlace);

export default function FuturePage() {
  const { mode, setMode } = useThemeMode();
  const lastNonContrastMode = useRef<ThemeMode>(mode === "high-contrast" ? "dark" : mode);
  const [futurePayload, setFuturePayload] = useState<FuturePayload | null>(null);
  const [progress, setProgress] = useState<FutureProgress | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode !== "high-contrast") {
      lastNonContrastMode.current = mode;
    }
  }, [mode]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getFutureProgress()
      .then((data) => {
        if (mounted) {
          setProgress(data as FutureProgress);
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus("Progress indicators will load once the backend responds.");
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

  useEffect(() => {
    const stored = loadBirthDetails();
    if (!stored) return;
    const details = { ...DEFAULT_BIRTH_DETAILS, ...stored } as BirthDetails;
    if (!hasRequiredDetails(details)) return;
    setLoading(true);
    requestPrediction("future", details)
      .then((data) => setFuturePayload(data as FuturePayload))
      .catch(() => setStatus("Submit the form to refresh your personalized future rail."))
      .finally(() => setLoading(false));
  }, []);

  const milestones = useMemo(() => progress?.milestones ?? [], [progress?.milestones]);
  const progressByHouse = useMemo(
    () => new Map(milestones.map((milestone) => [milestone.house, milestone])),
    [milestones],
  );

  const trajectories = useMemo(() => {
    const data = futurePayload?.trajectories || futurePayload?.future_trajectories;
    return Array.isArray(data) ? data : [];
  }, [futurePayload]);

  const timelineEvents = useMemo(() => {
    const baseEvents = [];
    if (futurePayload?.interpretation) {
      baseEvents.push({
        title: "Core directive",
        window: "Immediate integration",
        houseAnchor: "House 1",
        detail: futurePayload.interpretation,
        icon: "◎",
        progress: progress?.karmic_resolution,
        progressLabel: "Overall resolution",
        houseIndex: 1,
      });
    }

    if (trajectories.length) {
      const mapped = trajectories.map((trajectory, index) => {
        const house = trajectory.house || milestones[index]?.house || ((index + 2) % 12 || 12);
        const milestone = progressByHouse.get(house);
        const certainty = typeof trajectory.certainty === "number" ? Math.round(trajectory.certainty * 100) : undefined;
        return {
          title: trajectory.focus || `Phase ${index + 1}`,
          window: trajectory.window || `Phase window ${index + 1}`,
          houseAnchor: `House ${house}`,
          detail: trajectory.focus || "Interpret the next cycle and its remedy cadence.",
          icon: trajectory.icon || milestone?.icon || "✶",
          planet: trajectory.planet || milestone?.planet,
          progress: certainty ?? milestone?.completion,
          progressLabel: certainty !== undefined ? "Confidence" : "Milestone completion",
          houseIndex: house,
        };
      });
      return [...baseEvents, ...mapped];
    }

    if (milestones.length) {
      const mapped = milestones.map((milestone, index) => ({
        title: milestone.label,
        window: `Phase ${index + 1} • House ${milestone.house}`,
        houseAnchor: `House ${milestone.house}`,
        detail: "Track this house milestone as the future rail unfolds.",
        icon: milestone.icon || "✶",
        planet: milestone.planet,
        progress: milestone.completion,
        progressLabel: "Milestone completion",
        houseIndex: milestone.house,
      }));
      return [...baseEvents, ...mapped];
    }

    return fallbackEvents;
  }, [futurePayload?.interpretation, milestones, progress?.karmic_resolution, progressByHouse, trajectories]);

  const overallProgress = useMemo(() => {
    if (typeof progress?.karmic_resolution === "number") return Math.round(progress.karmic_resolution);
    if (!milestones.length) return undefined;
    const total = milestones.reduce((sum, milestone) => sum + milestone.completion, 0);
    return Math.round(total / milestones.length);
  }, [milestones, progress?.karmic_resolution]);

  const handleContrastToggle = (next: boolean) => {
    setMode(next ? "high-contrast" : lastNonContrastMode.current);
  };

  const handleChatOpen = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("bhrigu:open-chat", { detail: { chart: futurePayload?.chart } }));
    document.getElementById("future-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="stack future-shell">
      <header className="panel softly future-hero">
        <p className="eyebrow">Future directives</p>
        <h1>Future timeline anchored to your 12-house chart.</h1>
        <p className="muted">
          Watch each phase unfold with glowing milestone nodes, progress indicators, and a connected chat for clarifications.
        </p>
        <div className="future-actions">
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
          <label className="future-toggle">
            <input
              type="checkbox"
              checked={mode === "high-contrast"}
              onChange={(event) => handleContrastToggle(event.target.checked)}
            />
            High contrast
          </label>
          <button type="button" className="button-link" onClick={handleChatOpen}>
            Ask in chat
          </button>
        </div>
      </header>

      <section className="future-grid">
        <div className="card highlight" aria-label="Future directives">
          <div className="section-heading">
            <h2>Forecast inputs</h2>
            <p className="muted">Submit the future engine to load personalized phases and updates.</p>
          </div>
          <PredictionForm
            engine="future"
            title="Future directives"
            description="Use birth details to chart the next phases of your timeline."
            onResult={(payload) => setFuturePayload(payload as FuturePayload)}
          />
        </div>

        <div className="future-timeline">
          <div className="card">
            <div className="section-heading">
              <h2>Future timeline rail</h2>
              <p className="muted">Swipe or drag to explore each milestone anchored to a house.</p>
            </div>
            <Timeline events={timelineEvents} accent="fuchsia" animatePhases />
          </div>

          <div className="future-progress">
            <div className="future-progress__meta">
              <span>Overall karmic resolution</span>
              <span>{overallProgress !== undefined ? `${overallProgress}%` : "—"}</span>
            </div>
            <div className="future-progress__bar" style={{ width: `${overallProgress ?? 0}%` }} />
            {loading ? <p className="microcopy">Syncing progress and trajectories…</p> : null}
            {status ? <p className="microcopy">{status}</p> : null}
          </div>

          <div className="future-milestones">
            {milestones.length ? (
              milestones.map((milestone) => (
                <div key={`${milestone.house}-${milestone.label}`} className="future-milestone">
                  <div className="future-milestone__header">
                    <span className="future-milestone__label">
                      House {milestone.house} · {milestone.label}
                    </span>
                    <span className="pill">{milestone.completion}%</span>
                  </div>
                  <div className="timeline__progress">
                    <div className="timeline__progress-bar" style={{ width: `${milestone.completion}%` }} />
                    <div className="timeline__progress-label">
                      <span>{milestone.planet ? `${milestone.planet} focus` : "Milestone completion"}</span>
                      <span>{milestone.completion}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="future-milestone">
                <p className="muted">Milestone progress will appear once the future engine returns a response.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="future-chat" className="future-chat card">
        <div className="section-heading">
          <h2>Clarify in chat</h2>
          <p className="muted">Ask follow-up questions and keep the timeline context in the conversation.</p>
        </div>
        <BhriguChat />
      </section>
    </div>
  );
}
