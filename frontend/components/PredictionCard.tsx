'use client';

import React from "react";
import { useI18n } from "@/lib/i18n";
import { ResultEngine } from "@/types/astro";
import KundliCharts from "./KundliCharts";
import { ChartHouse, DashaPeriod } from "@/types/astro";

interface Props {
  title: string;
  payload: unknown;
  engine: ResultEngine;
}

type InsightSection = {
  heading: string;
  english: string;
  hindi?: string;
  bullets?: string[];
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
  return sections;
}

function interpretPastLife(payload: PastLifePayload): InsightSection[] {
  const sections: InsightSection[] = [];
  if (payload.interpretation) {
    sections.push({
      heading: payload.name ? `${payload.name} की यात्रा` : "Past-life journey",
      english: payload.interpretation,
      hindi: payload.interpretation_hi,
    });
  }
  if (payload.insights?.length) {
    const entries = payload.insights.map((item) => `${item.narrative}${item.sutra_reference ? ` — ${item.sutra_reference}` : ""}`);
    sections.push({
      heading: "Archived echoes",
      english: entries.join(" "),
      hindi: "भृगु पांडुलिपि से प्राप्त संकेत।",
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

export default function PredictionCard({ title, payload, engine }: Props) {
  const { t } = useI18n();
  const sections = buildSections(engine, payload);
  const horoscopePayload = engine === "horoscope" && typeof payload === "object" ? (payload as HoroscopePayload) : null;

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
      <div className="insight-grid">{sections.map(renderSection)}</div>
      {horoscopePayload && (
        <KundliCharts
          rashiChart={horoscopePayload.rashi_chart}
          bhavaChart={horoscopePayload.bhava_chart}
          dashas={horoscopePayload.dashas}
        />
      )}
    </section>
  );
}
