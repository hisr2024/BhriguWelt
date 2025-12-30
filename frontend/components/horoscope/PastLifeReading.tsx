'use client';

import { useEffect, useMemo, useState } from "react";
import { getFallbackSample } from "@/lib/api";
import { ChartResponse, FormState } from "./types";

const SYMBOLIC_DISCLAIMER =
  "These past-life narratives are symbolic reflections meant for contemplation, not literal or factual history.";

const FALLBACK_TAGLINES = [
  "Faint echoes of devotion and service linger.",
  "A creative lineage suggests lessons of stewardship.",
  "Past-life bonds hint at compassionate leadership.",
];

type InsightRecord = {
  narrative: string;
  sutra_reference?: string;
  epoch?: string;
  role?: string;
};

type Props = {
  chart: ChartResponse | null;
  form: FormState;
};

function normalizeInsights(payload: ChartResponse | null) {
  if (!payload || typeof payload !== "object") return [];
  const typed = payload as {
    past_life_report?: { insights?: unknown };
    past_life_insights?: unknown;
    insights?: unknown;
  };

  const insights =
    (Array.isArray(typed.past_life_report?.insights)
      ? (typed.past_life_report?.insights as unknown[])
      : undefined) ||
    (Array.isArray(typed.past_life_insights) ? (typed.past_life_insights as unknown[]) : undefined) ||
    (Array.isArray(typed.insights) ? (typed.insights as unknown[]) : undefined) ||
    [];

  return insights
    .map((entry) => {
      if (typeof entry === "string") {
        return { narrative: entry } satisfies InsightRecord;
      }
      if (typeof entry === "object" && entry) {
        const record = entry as InsightRecord;
        const narrative = typeof record.narrative === "string" ? record.narrative : undefined;
        if (!narrative) return null;
        return {
          narrative,
          sutra_reference: typeof record.sutra_reference === "string" ? record.sutra_reference : undefined,
          epoch: typeof record.epoch === "string" ? record.epoch : undefined,
          role: typeof record.role === "string" ? record.role : undefined,
        } satisfies InsightRecord;
      }
      return null;
    })
    .filter((entry): entry is InsightRecord => Boolean(entry));
}

function buildShareText(name: string, insights: InsightRecord[]) {
  const header = `Past-life reflections for ${name || "Seeker"}`;
  const lines = insights.map((insight, index) => {
    const ref = insight.sutra_reference ? ` (${insight.sutra_reference})` : "";
    const epoch = insight.epoch ? `${insight.epoch}: ` : "";
    return `${index + 1}. ${epoch}${insight.narrative}${ref}`;
  });
  return [header, "", ...lines, "", SYMBOLIC_DISCLAIMER].join("\n");
}

export default function PastLifeReading({ chart, form }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fallbackSample = useMemo(() => getFallbackSample("/past-life"), []);

  const insights = useMemo<InsightRecord[]>(() => {
    const primary = normalizeInsights(chart);
    if (primary.length) return primary;

    const fallback = normalizeInsights(fallbackSample as ChartResponse | null);
    return fallback.length
      ? fallback
      : FALLBACK_TAGLINES.map((line) => ({ narrative: line } satisfies InsightRecord));
  }, [chart, fallbackSample]);

  const shareText = useMemo(() => buildShareText(form.name, insights), [form.name, insights]);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Past-life reflections",
          text: shareText,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch (error) {
      console.warn("[PastLifeReading] Share failed", error);
    }
  };

  const handleExport = () => {
    if (typeof window === "undefined") return;
    const payload = {
      name: form.name,
      generated_at: new Date().toISOString(),
      insights,
      disclaimer: SYMBOLIC_DISCLAIMER,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${form.name || "past-life"}-insights.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleVoiceGuidance = () => {
    if (typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(shareText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <section className="past-life-panel" aria-label="Past-life story cards">
      <div className="past-life-panel__head">
        <div>
          <p className="pill">Past-life story</p>
          <h3>Unlock karmic threads</h3>
          <p className="muted">Soft cosmic scenes guide reflection through symbolic memories.</p>
        </div>
        <div className={`status-chip ${chart ? "status-chip--ready" : ""}`}>
          {chart ? "Unlocked" : "Locked"}
        </div>
      </div>

      {chart ? (
        <div className="past-life-panel__body">
          <div className="past-life-toolbar">
            <p className="microcopy">{SYMBOLIC_DISCLAIMER}</p>
            <div className="toolbar-actions">
              <button type="button" className="ghost-button" onClick={toggleVoiceGuidance} aria-pressed={isSpeaking}>
                {isSpeaking ? "Stop voice guidance" : "Play voice guidance"}
              </button>
              <button type="button" className="ghost-button" onClick={handleShare}>
                Share story
              </button>
              <button type="button" className="ghost-button" onClick={handleExport}>
                Export insights
              </button>
            </div>
          </div>

          <div className="past-life-cards" role="list">
            {insights.map((insight, index) => (
              <details key={`${insight.narrative}-${index}`} className="past-life-card" role="listitem">
                <summary>
                  <div className="past-life-card__art" aria-hidden="true">
                    <span className="past-life-card__orb" />
                    <span className="past-life-card__spark" />
                  </div>
                  <div>
                    <p className="microcopy">Scene {index + 1}</p>
                    <strong>{insight.epoch || insight.role || "Karmic echo"}</strong>
                  </div>
                  <span className="pill">Expand</span>
                </summary>
                <div className="past-life-card__body">
                  <p>{insight.narrative}</p>
                  {insight.sutra_reference ? (
                    <p className="microcopy">Sutra: {insight.sutra_reference}</p>
                  ) : null}
                </div>
              </details>
            ))}
          </div>

          <div className="past-life-guidance">
            <div>
              <strong>Guided transitions</strong>
              <p className="muted">Move through each scene slowly; pause and reflect before the next card.</p>
            </div>
            <div className="past-life-steps">
              {insights.map((insight, index) => (
                <div key={`${insight.narrative}-step-${index}`} className="past-life-step">
                  <span className="pill">{index + 1}</span>
                  <p className="microcopy">{insight.epoch || "Symbolic chapter"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="past-life-panel__locked">
          <div className="past-life-panel__art" aria-hidden="true">
            <span className="past-life-panel__halo" />
            <span className="past-life-panel__orbit" />
          </div>
          <div>
            <h4>Complete your horoscope to open this story deck.</h4>
            <p className="muted">Once your chart is generated, past-life insights appear as expandable scenes.</p>
          </div>
        </div>
      )}
    </section>
  );
}
