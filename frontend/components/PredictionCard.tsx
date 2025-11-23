'use client';

import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ResultEngine } from "@/types/astro";
import KundliCharts from "./KundliCharts";
import { ChartHouse, DashaPeriod } from "@/types/astro";
import FeedbackPrompt from "./FeedbackPrompt";
import { HOUSE_FOCUSES } from "@/lib/houseGrid";
import ProgressIndicator, { ProgressStep } from "./ProgressIndicator";

interface Props {
  title: string;
  payload: unknown;
  engine: ResultEngine;
  seekerName?: string;
}

type InsightSection = {
  heading: string;
  english: string;
  hindi?: string;
  bullets?: string[];
};

type TimeframeAnchor = {
  label: string;
  houseIndex: number;
  focus: string;
  sign?: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

type HoroscopePayload = {
  name?: string;
  karmic_epoch?: string;
  interpretation?: string;
  interpretation_hi?: string;
  weights?: Record<string, number>;
  principles?: { sutra_reference?: string; description?: string }[];
  remedies?: { sutra_reference?: string; description?: string }[];
  past_life_insights?: { narrative?: string; sutra_reference?: string }[];
  future_trajectories?: { focus?: string; window?: string }[];
  rashi_chart?: ChartHouse[];
  bhava_chart?: ChartHouse[];
  dashas?: DashaPeriod[];
};

type PastLifePayload = {
  name?: string;
  interpretation?: string;
  interpretation_hi?: string;
  insights?: { narrative?: string; sutra_reference?: string }[];
};

type FuturePayload = {
  name?: string;
  interpretation?: string;
  interpretation_hi?: string;
  trajectories?: { focus?: string; window?: string; certainty?: number }[];
};

type MatchmakingPayload = {
  primary_name?: string;
  partner_name?: string;
  interpretation?: string;
  interpretation_hi?: string;
  compatibility?: {
    compatibility_index?: number;
    breakdown?: { description?: string; notes?: string }[];
    modern_highlights?: string[];
  };
};

type CalendarPayload = {
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  interpretation?: string;
  interpretation_hi?: string;
  saka_date?: {
    year?: number;
    month?: string;
    day?: number;
  };
};

function renderSection(section: InsightSection, index: number) {
  return (
    <article key={index} className="insight-block">
      <h4>{section.heading}</h4>
      <p>{section.english}</p>
      {section.hindi && <p className="muted">{section.hindi}</p>}
      {section.bullets && section.bullets.length > 0 && (
        <ul>
          {section.bullets.map((bullet, bulletIndex) => (
            <li key={bulletIndex}>{bullet}</li>
          ))}
        </ul>
      )}
    </article>
  );
}

function percentage(value?: number) {
  if (typeof value !== "number") return null;
  return Math.round(value * 100);
}

function interpretHoroscope(payload: HoroscopePayload): InsightSection[] {
  const sections: InsightSection[] = [];
  if (payload.interpretation) {
    sections.push({
      heading: payload.name ? `${payload.name}'s essence` : "Essence",
      english: payload.interpretation,
      hindi: payload.interpretation_hi,
    });
  }
  if (payload.karmic_epoch) {
    sections.push({
      heading: "Karmic epoch",
      english: payload.karmic_epoch,
      hindi: payload.interpretation_hi ? `कर्मिक दिशा: ${payload.karmic_epoch}` : undefined,
    });
  }
  if (payload.weights) {
    const bulletLines = Object.entries(payload.weights).map(([key, value]) => {
      const score = percentage(value);
      return `${key.replace(/_/g, " ")}: ${score ? `${score}%` : "steady"} favor from the folios.`;
    });
    sections.push({
      heading: "Balance of strengths",
      english: "Bhrigu records highlight where your efforts gain momentum.",
      hindi: "भृगु पाठ बताते हैं कि ऊर्जा कहाँ तेज़ी से बढ़ती है।",
      bullets: bulletLines,
    });
  }
  if (payload.principles?.length) {
    sections.push({
      heading: "Guiding sutras",
      english: payload.principles
        .map((item) => `${item.description}${item.sutra_reference ? ` — ${item.sutra_reference}` : ""}`)
        .join(" "),
      hindi: "ये सूत्र आपके लिए अनुशासन और आशीर्वाद को स्थिर रखते हैं।",
    });
  }
  if (payload.remedies?.length) {
    sections.push({
      heading: "Remedies",
      english: payload.remedies
        .map((item) => `${item.description}${item.sutra_reference ? ` — ${item.sutra_reference}` : ""}`)
        .join(" "),
      hindi: "उपाय सरल और अनुकरणीय हैं—भोर की साधना से आरंभ करें।",
    });
  }
  if (payload.past_life_insights?.length) {
    sections.push({
      heading: "Past-life echoes",
      english: payload.past_life_insights
        .map((item) => `${item.narrative}${item.sutra_reference ? ` — ${item.sutra_reference}` : ""}`)
        .join(" "),
      hindi: "पूर्व जन्म की कथाएँ वर्तमान जीवन के संस्कारों को दिशा देती हैं।",
    });
  }
  if (payload.future_trajectories?.length) {
    sections.push({
      heading: "Future directions",
      english: payload.future_trajectories
        .map((item) => `${item.focus}${item.window ? ` (${item.window})` : ""}`)
        .join(" "),
      hindi: "आने वाले चरणों के लिए करुणा और संयम से कर्म करें।",
    });
  }
  if (payload.dashas?.length) {
    const bullets = payload.dashas.map((dasha) => `${dasha.lord}: ${dasha.start} → ${dasha.end}`);
    sections.push({
      heading: "Vimshottari dasha",
      english: "Lifecycle windows blended with Bhrigu overlays.",
      hindi: "दशा क्रम भृगु सूत्रों के साथ संयोजित है।",
      bullets,
    });
  }
  const timeframeAnchors = deriveTimeframeAnchorsFromChart(payload.bhava_chart || payload.rashi_chart);
  const summary = renderTimeframeSummary(timeframeAnchors);
  if (summary) {
    sections.push({
      heading: "Timeframe linkage",
      english: summary,
      hindi: "दैनिक, साप्ताहिक, मासिक और वार्षिक मार्ग वही १२ घरों से जुड़े रहते हैं।",
    });
  }
  return sections;
}

function interpretPastLife(payload: PastLifePayload): InsightSection[] {
  const sections: InsightSection[] = [];
  const insights = payload.insights ?? [];
  const [past, present, ...echoes] = insights;
  const pastLine = past?.narrative || payload.interpretation;

  if (pastLine) {
    sections.push({
      heading: "Past influences",
      english: `${pastLine}${past?.sutra_reference ? ` — ${past.sutra_reference}` : ""}`,
      hindi: payload.interpretation_hi ? `पूर्व प्रभाव: ${payload.interpretation_hi}` : undefined,
    });
  }

  const presentLine = present?.narrative || (payload.interpretation ? `Current lessons extend from this arc: ${payload.interpretation}` : undefined);
  if (presentLine) {
    sections.push({
      heading: "Current lessons",
      english: `${presentLine}${present?.sutra_reference ? ` — ${present.sutra_reference}` : ""}`,
      hindi: payload.interpretation_hi ? `वर्तमान सीख: ${payload.interpretation_hi}` : undefined,
      bullets: echoes.length
        ? echoes.slice(0, 2).map((item) => `${item.narrative ?? ""}${item.sutra_reference ? ` — ${item.sutra_reference}` : ""}`)
        : undefined,
    });
  }

  const futureLines = echoes.length
    ? echoes.map((item) => `${item.narrative ?? ""}${item.sutra_reference ? ` — ${item.sutra_reference}` : ""}`)
    : payload.interpretation
    ? ["Future echoes reshape this vow into soft guidance."]
    : [];

  if (futureLines.length) {
    sections.push({
      heading: "Future echoes",
      english: futureLines.join(" "),
      hindi: payload.interpretation_hi ? `आने वाली प्रतिध्वनियाँ: ${payload.interpretation_hi}` : undefined,
    });
  }

  if (!sections.length && payload.name) {
    sections.push({
      heading: "Past-life journey",
      english: `${payload.name}'s arc will appear once the manuscript insights load.`,
    });
  }

  return sections;
}

function interpretFuture(payload: FuturePayload): InsightSection[] {
  const sections: InsightSection[] = [];
  if (payload.interpretation) {
    sections.push({
      heading: payload.name ? `${payload.name} का मार्ग` : "Future path",
      english: payload.interpretation,
      hindi: payload.interpretation_hi,
    });
  }
  if (payload.trajectories?.length) {
    const bullets = payload.trajectories.map((item) => {
      const certainty = percentage(item.certainty);
      return `${item.focus}${item.window ? ` • ${item.window}` : ""}${certainty ? ` • आश्वस्ति ${certainty}%` : ""}`;
    });
    sections.push({
      heading: "Next steps",
      english: "Follow these dharmic steps with steadiness and gratitude.",
      hindi: "इन चरणों को धैर्य और कृतज्ञता से निभाएँ।",
      bullets,
    });
  }
  return sections;
}

function interpretMatchmaking(payload: MatchmakingPayload): InsightSection[] {
  const sections: InsightSection[] = [];
  const pairLabel = payload.primary_name && payload.partner_name ? `${payload.primary_name} & ${payload.partner_name}` : "The pair";
  if (payload.interpretation) {
    sections.push({
      heading: `${pairLabel}`,
      english: payload.interpretation,
      hindi: payload.interpretation_hi,
    });
  }
  if (payload.compatibility) {
    const bullets: string[] = [];
    if (payload.compatibility.compatibility_index) {
      bullets.push(`Harmony index: ${Math.round(payload.compatibility.compatibility_index)} / 100`);
    }
    payload.compatibility.breakdown?.forEach((item) => {
      bullets.push(`${item.description}${item.notes ? ` — ${item.notes}` : ""}`);
    });
    payload.compatibility.modern_highlights?.forEach((item) => bullets.push(item));
    sections.push({
      heading: "Compatibility notes",
      english: "Blended from guna balance and lived priorities.",
      hindi: "गुण और जीवनशैली दोनों का संतुलित सार।",
      bullets,
    });
  }
  return sections;
}

function interpretCalendar(payload: CalendarPayload): InsightSection[] {
  const sections: InsightSection[] = [];
  if (payload.interpretation) {
    sections.push({
      heading: "Śaka alignment",
      english: payload.interpretation,
      hindi: payload.interpretation_hi,
    });
  }
  if (payload.saka_date) {
    sections.push({
      heading: "Converted date",
      english: `Śaka ${payload.saka_date.year ?? ""} ${payload.saka_date.month ?? ""} ${payload.saka_date.day ?? ""} —
        ${payload.birth_date ?? ""} ${payload.birth_time ?? ""} at ${payload.birth_place ?? ""}`.trim(),
      hindi: "कैलेंडर रूपांतरण IST सन्दर्भ के साथ तैयार है।",
    });
  }
  return sections;
}

function deriveTimeframeAnchorsFromChart(houses?: ChartHouse[]): TimeframeAnchor[] {
  const anchors = [
    { label: "Daily", houseIndex: 1 },
    { label: "Weekly", houseIndex: 3 },
    { label: "Monthly", houseIndex: 6 },
    { label: "Yearly", houseIndex: 10 },
  ];

  return anchors.map((anchor) => {
    const house = houses?.find((entry) => entry.index === anchor.houseIndex);
    return {
      ...anchor,
      focus: HOUSE_FOCUSES[anchor.houseIndex - 1],
      sign: house?.sign,
    } satisfies TimeframeAnchor;
  });
}

function renderTimeframeSummary(anchors: TimeframeAnchor[]) {
  const cards = anchors
    .map((anchor) => `House ${anchor.houseIndex} (${anchor.focus})${anchor.sign ? ` in ${anchor.sign}` : ""}`)
    .join(" · ");
  return cards ? `Daily to yearly flow stays anchored to ${cards}.` : "";
}

function interpretFallback(payload: Record<string, unknown>): InsightSection[] {
  const entries = Object.entries(payload).map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value)}`);
  return [
    {
      heading: "Guidance",
      english: entries.join(" · "),
      hindi: "कच्चा विवरण बिना JSON प्रदर्शित किया गया है।",
    },
  ];
}

function buildSections(engine: ResultEngine, payload: unknown): InsightSection[] {
  if (!payload || typeof payload !== "object") {
    return [
      {
        heading: "Insight",
        english: typeof payload === "string" ? payload : String(payload ?? ""),
      },
    ];
  }

  switch (engine) {
    case "horoscope":
      return interpretHoroscope(payload as HoroscopePayload);
    case "past-life":
      return interpretPastLife(payload as PastLifePayload);
    case "future":
      return interpretFuture(payload as FuturePayload);
    case "matchmaking":
      return interpretMatchmaking(payload as MatchmakingPayload);
    case "calendar":
      return interpretCalendar(payload as CalendarPayload);
    default:
      return interpretFallback(payload as Record<string, unknown>);
  }
}

export default function PredictionCard({ title, payload, engine, seekerName }: Props) {
  const { t } = useI18n();
  const horoscopePayload = useMemo(
    () => (engine === "horoscope" && typeof payload === "object" ? (payload as HoroscopePayload) : null),
    [engine, payload]
  );
  const sections = useMemo(() => buildSections(engine, payload), [engine, payload]);
  const timeframeAnchors = useMemo(() => {
    if (!horoscopePayload) return [] as TimeframeAnchor[];
    return deriveTimeframeAnchorsFromChart(horoscopePayload.bhava_chart || horoscopePayload.rashi_chart);
  }, [horoscopePayload]);
  const checklistSeed = useMemo<ChecklistItem[]>(() => {
    const items: string[] = [];
    horoscopePayload?.remedies?.forEach((item) => {
      if (item.description) items.push(item.description);
    });
    horoscopePayload?.principles?.forEach((item) => {
      if (item.description) items.push(`Reflect on ${item.description}`);
    });
    if (timeframeAnchors.length) {
      timeframeAnchors.forEach((anchor) => {
        items.push(
          `${anchor.label} cadence: revisit House ${anchor.houseIndex} (${anchor.focus}${anchor.sign ? `, ${anchor.sign}` : ""}).`
        );
      });
    }
    if (!items.length) {
      items.push("Perform this remedy today.", "Share the reading with your guide.");
    }
    return items.map((label, index) => ({ id: `${engine}-${title}-${index}`, label, done: false }));
  }, [engine, horoscopePayload?.principles, horoscopePayload?.remedies, timeframeAnchors, title]);
  const storageKey = useMemo(() => `prediction-checklist-${engine}-${title.replace(/\s+/g, "-").toLowerCase()}`, [engine, title]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ChecklistItem[];
        setChecklist(parsed);
        return;
      } catch {
        // If parsing fails, fall back to seed.
      }
    }
    setChecklist(checklistSeed);
  }, [checklistSeed, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!checklist.length) return;
    localStorage.setItem(storageKey, JSON.stringify(checklist));
  }, [checklist, storageKey]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((current) => current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const progressSteps = useMemo<ProgressStep[]>(() => {
    const hasPayload = Boolean(payload);
    const hasAnchors = timeframeAnchors.some((anchor) => anchor.sign);
    return [
      {
        title: "Birth details received",
        description: "Name, date, time, place inform the reading.",
        status: hasPayload ? "complete" : "active",
      },
      {
        title: "12-house linkage",
        description: "Daily, weekly, monthly, yearly tied to the natal chart.",
        status: hasAnchors ? "complete" : hasPayload ? "active" : "pending",
      },
      {
        title: "Action plan saved",
        description: "Reminders persist locally for practice.",
        status: checklist.length ? "complete" : hasPayload ? "active" : "pending",
      },
    ];
  }, [checklist.length, payload, timeframeAnchors]);

  if (!payload || !sections.length) {
    return (
      <section className="results card" aria-live="polite" role="status" aria-label={t("results.title", "Results")}>
        <div className="section-heading">
          <p className="eyebrow">Response</p>
          <h3>{title}</h3>
          <p className="muted">{t("results.helper", "Guidance will arrive in clear English and Hindi once you submit.")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="results card" aria-live="polite" role="status" aria-label={t("results.title", "Results")}>
      <div className="section-heading">
        <p className="eyebrow">Response</p>
        <h3>{title}</h3>
        <p className="muted">{t("results.helperRaw", "Narratives are ready to share—no JSON needed.")}</p>
      </div>
      <ProgressIndicator steps={progressSteps} label="Prediction progress" />
      <div className="insight-grid">{sections.map(renderSection)}</div>
      {timeframeAnchors.length ? (
        <div className="insight-grid" aria-label="Timeframes tied to houses" role="list">
          {timeframeAnchors.map((anchor) => (
            <article key={anchor.label} className="insight-block" role="listitem">
              <p className="eyebrow">{anchor.label}</p>
              <h4>
                House {anchor.houseIndex}: {anchor.focus}
              </h4>
              <p className="muted">{anchor.sign ? `${anchor.sign} base` : "Awaiting chart foundation"}</p>
              <p className="microcopy">Interpretations stay anchored to the natal twelve-house chart.</p>
            </article>
          ))}
        </div>
      ) : null}
      {checklist.length ? (
        <div className="insight-grid" aria-label="Actionable reminders" role="list">
          <article className="insight-block" role="listitem">
            <h4>Reminders</h4>
            <ul className="checklist">
              {checklist.map((item) => (
                <li key={item.id}>
                  <label className="checklist__item">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklistItem(item.id)}
                      aria-label={item.label}
                    />
                    <span className={item.done ? "muted" : ""}>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="microcopy">Progress stays locally so you can return to it anytime.</p>
          </article>
        </div>
      ) : null}
      {horoscopePayload && (
        <KundliCharts
          rashiChart={horoscopePayload.rashi_chart}
          bhavaChart={horoscopePayload.bhava_chart}
          dashas={horoscopePayload.dashas}
        />
      )}
      {payload && <FeedbackPrompt engine={engine} seekerName={seekerName} />}
    </section>
  );
}
