'use client';

import dynamic from "next/dynamic";
import React, { useEffect, useMemo, useState } from "react";
import { HOUSE_FOCUSES } from "@/lib/houseGrid";
import { useI18n } from "@/lib/i18n";
import { areMicroAnimationsAllowed } from "@/lib/immersive";
import { ChartHouse, DashaPeriod, ResultEngine } from "@/types/astro";
import FeedbackPrompt from "./FeedbackPrompt";

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
  collapsible?: boolean;
};

const DEFAULT_DETAIL_LEVEL: "beginner" | "advanced" = "advanced";

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

type SynastryOverlay = {
  label?: string;
  theme?: string;
  alignment?: number;
  tags?: string[];
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
  modern_preferences?: string[];
  charts?: {
    primary_rashi_chart?: ChartHouse[];
    partner_rashi_chart?: ChartHouse[];
    shared_score?: number;
    synastry_overlay?: SynastryOverlay[];
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

const KundliCharts = dynamic(() => import("./KundliCharts"), {
  ssr: false,
  loading: () => (
    <div className="panel softly prediction-card__chart-loading" role="status" aria-live="polite">
      <p className="eyebrow">Chart render</p>
      <p className="muted">Orbiting wheels will appear as soon as the houses load.</p>
    </div>
  ),
});

function condense(text: string, detailLevel: "beginner" | "advanced") {
  if (detailLevel === "advanced") return text;
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).trimEnd()}...`;
}

function renderSection(section: InsightSection, index: number) {
  const detailLevel = DEFAULT_DETAIL_LEVEL;
  const bulletList = section.bullets || [];
  const trimmedBullets = detailLevel === "advanced" ? bulletList : bulletList.slice(0, 3);
  const englishCopy = condense(section.english, detailLevel);
  const hindiCopy = section.hindi ? condense(section.hindi, detailLevel) : undefined;
  const shouldCollapse = Boolean(
    section.collapsible && ((section.english?.length ?? 0) > 180 || trimmedBullets.length > 3 || section.hindi),
  );
  const content = (
    <div className="insight-content">
      <p>{englishCopy}</p>
      {hindiCopy ? <p className="muted">{hindiCopy}</p> : null}
      {trimmedBullets.length > 0 && (
        <ul>
          {trimmedBullets.map((bullet, bulletIndex) => (
            <li key={bulletIndex}>{bullet}</li>
          ))}
        </ul>
      )}
    </div>
  );

  if (shouldCollapse) {
    return (
      <article key={index} className="insight-block">
        <h4>{section.heading}</h4>
        <details>
          <summary className="insight-summary">Expand details</summary>
          {content}
        </details>
      </article>
    );
  }

  return (
    <article key={index} className="insight-block">
      <h4>{section.heading}</h4>
      {content}
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
      collapsible: payload.principles.length > 2,
    });
  }
  if (payload.remedies?.length) {
    sections.push({
      heading: "Remedies",
      english: payload.remedies
        .map((item) => `${item.description}${item.sutra_reference ? ` — ${item.sutra_reference}` : ""}`)
        .join(" "),
      hindi: "उपाय सरल और अनुकरणीय हैं—भोर की साधना से आरंभ करें।",
      collapsible: payload.remedies.length > 1,
    });
  }
  if (payload.past_life_insights?.length) {
    sections.push({
      heading: "Past-life echoes",
      english: payload.past_life_insights
        .map((item) => `${item.narrative}${item.sutra_reference ? ` — ${item.sutra_reference}` : ""}`)
        .join(" "),
      hindi: "पूर्व जन्म की कथाएँ वर्तमान जीवन के संस्कारों को दिशा देती हैं।",
      collapsible: payload.past_life_insights.length > 2,
    });
  }
  if (payload.future_trajectories?.length) {
    sections.push({
      heading: "Future directions",
      english: payload.future_trajectories
        .map((item) => `${item.focus}${item.window ? ` (${item.window})` : ""}`)
        .join(" "),
      hindi: "आने वाले चरणों के लिए करुणा और संयम से कर्म करें।",
      collapsible: payload.future_trajectories.length > 2,
    });
  }
  if (payload.dashas?.length) {
    const bullets = payload.dashas.map((dasha) => `${dasha.lord}: ${dasha.start} → ${dasha.end}`);
    sections.push({
      heading: "Vimshottari dasha",
      english: "Lifecycle windows blended with Bhrigu overlays.",
      hindi: "दशा क्रम भृगु सूत्रों के साथ संयोजित है।",
      bullets,
      collapsible: payload.dashas.length > 3,
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
      collapsible: payload.trajectories.length > 2,
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
    payload.modern_preferences?.forEach((tag) => bullets.push(`Modern filter: ${tag}`));
    sections.push({
      heading: "Compatibility notes",
      english: "Blended from guna balance and lived priorities.",
      hindi: "गुण और जीवनशैली दोनों का संतुलित सार।",
      bullets,
      collapsible: bullets.length > 3,
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
  const sections = useMemo(() => buildSections(engine, payload), [engine, payload]);
  const horoscopePayload = engine === "horoscope" && typeof payload === "object" ? (payload as HoroscopePayload) : null;
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [flipActive, setFlipActive] = useState(false);

  useEffect(() => {
    const refresh = () => setAnimationsEnabled(areMicroAnimationsAllowed());
    refresh();

    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-animations"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!payload || !animationsEnabled) {
      setFlipActive(false);
      return;
    }

    setFlipActive(true);
    const timeout = window.setTimeout(() => setFlipActive(false), 900);
    return () => window.clearTimeout(timeout);
  }, [payload, animationsEnabled]);

  const cardClassName = [
    "results",
    "card",
    "prediction-card",
    animationsEnabled ? "prediction-card--animated" : "",
    flipActive ? "is-flipped" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!payload || !sections.length) {
    return (
      <section className={cardClassName} aria-live="polite" role="status" aria-label={t("results.title", "Results")}>
        <div className="section-heading">
          <p className="eyebrow">Response</p>
          <h3>{title}</h3>
          <p className="muted">{t("results.helper", "Guidance will arrive in clear English and Hindi once you submit.")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={cardClassName} aria-live="polite" role="status" aria-label={t("results.title", "Results")}>
      <div className="prediction-card__body">
        <div className="section-heading">
          <p className="eyebrow">Response</p>
          <h3>{title}</h3>
          <p className="muted">{t("results.helperRaw", "Narratives are ready to share—no JSON needed.")}</p>
        </div>
        <div className="insight-grid">{sections.map(renderSection)}</div>
        {horoscopePayload && (
          <KundliCharts
            rashiChart={horoscopePayload.rashi_chart}
            bhavaChart={horoscopePayload.bhava_chart}
            dashas={horoscopePayload.dashas}
          />
        )}
        {payload && <FeedbackPrompt engine={engine} seekerName={seekerName} />}
      </div>
    </section>
  );
}
