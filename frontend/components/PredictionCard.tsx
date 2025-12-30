'use client';

import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Easing } from "framer-motion";
import { Heart } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "@/lib/framer-motion";
import { HOUSE_FOCUSES, deriveChartHouses } from "@/lib/houseGrid";
import { useI18n } from "@/lib/i18n";
import { areMicroAnimationsAllowed } from "@/lib/immersive";
import { loadBirthDetails } from "@/lib/birthStorage";
import { CalendarDetails, CalendarPayload, ChartHouse, DashaPeriod, ResultEngine } from "@/types/astro";
import { formatSakaLabel, type SakaDate } from "@/lib/sakaContext";
import { getButtonMotion } from "@/lib/animations";
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
const easeStandard: Easing = [0.2, 0.65, 0.3, 0.9];
const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeStandard } },
};
const sectionGridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const engineAccents: Record<ResultEngine, string> = {
  horoscope: "from-indigo-500/40 via-sky-500/20 to-fuchsia-500/40",
  "past-life": "from-amber-400/40 via-rose-400/20 to-violet-500/40",
  future: "from-cyan-400/40 via-blue-500/20 to-indigo-500/40",
  matchmaking: "from-fuchsia-400/40 via-pink-500/20 to-amber-500/40",
  calendar: "from-emerald-400/40 via-teal-500/20 to-sky-500/40",
};

const engineLabels: Record<ResultEngine, string> = {
  horoscope: "Horoscope engine",
  "past-life": "Past-life engine",
  future: "Future engine",
  matchmaking: "Matchmaking engine",
  calendar: "Calendar engine",
};

type TimeframeAnchor = {
  label: string;
  houseIndex: number;
  focus: string;
  sign?: string;
};

type HoroscopePayload = {
  name?: string;
  karmic_epoch?: string;
  interpretation?: string;
  interpretation_hi?: string;
  weights?: Record<string, number>;
  principles?: { sutra_reference?: string; description?: string }[];
  remedies?: { id?: string; sutra_reference?: string; description?: string; relevance?: number }[];
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
  past_life_insights?: { narrative?: string; sutra_reference?: string }[];
};

type FuturePayload = {
  name?: string;
  interpretation?: string;
  interpretation_hi?: string;
  trajectories?: { focus?: string; window?: string; certainty?: number }[];
  future_trajectories?: { focus?: string; window?: string; certainty?: number }[];
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
  sections?: Record<string, string>;
  compatibility?: {
    compatibility_index?: number;
    long_term_index?: number;
    short_term_index?: number;
    breakdown?: { description?: string; notes?: string }[];
    modern_highlights?: string[];
    alignment_percentages?: { emotional?: number; spiritual?: number; communication?: number };
  };
  modern_preferences?: string[];
  charts?: {
    primary_rashi_chart?: ChartHouse[];
    partner_rashi_chart?: ChartHouse[];
    shared_score?: number;
    synastry_overlay?: SynastryOverlay[];
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

const WebXRChart = dynamic(() => import("./WebXRChart"), {
  ssr: false,
  loading: () => (
    <div className="panel softly prediction-card__chart-loading" role="status" aria-live="polite">
      <p className="eyebrow">WebXR render</p>
      <p className="muted">3D chart booting up for the immersive view.</p>
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
    <div className="insight-content space-y-3 text-sm text-slate-100/90">
      <p className="leading-relaxed">{englishCopy}</p>
      {hindiCopy ? <p className="text-slate-300">{hindiCopy}</p> : null}
      {trimmedBullets.length > 0 && (
        <ul className="space-y-2 text-slate-200">
          {trimmedBullets.map((bullet, bulletIndex) => (
            <li key={bulletIndex} className="flex gap-2">
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  if (shouldCollapse) {
    return (
      <motion.article
        key={index}
        variants={sectionVariants}
        className="insight-block rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.35)]"
      >
        <h4 className="text-base font-semibold text-white">{section.heading}</h4>
        <details className="group mt-3 space-y-3">
          <summary className="insight-summary cursor-pointer text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            Expand details
          </summary>
          <div className="pt-2">{content}</div>
        </details>
      </motion.article>
    );
  }

  return (
    <motion.article
      key={index}
      variants={sectionVariants}
      className="insight-block rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.35)]"
    >
      <h4 className="text-base font-semibold text-white">{section.heading}</h4>
      <div className="mt-3">{content}</div>
    </motion.article>
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
  const insights = payload.insights || payload.past_life_insights || [];
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
  const trajectories = payload.trajectories || payload.future_trajectories || [];
  if (trajectories.length) {
    const bullets = trajectories.map((item) => {
      const certainty = percentage(item.certainty);
      return `${item.focus}${item.window ? ` • ${item.window}` : ""}${certainty ? ` • आश्वस्ति ${certainty}%` : ""}`;
    });
    sections.push({
      heading: "Next steps",
      english: "Follow these dharmic steps with steadiness and gratitude.",
      hindi: "इन चरणों को धैर्य और कृतज्ञता से निभाएँ।",
      bullets,
      collapsible: trajectories.length > 2,
    });
  }
  return sections;
}

function interpretMatchmaking(payload: MatchmakingPayload): InsightSection[] {
  const sections: InsightSection[] = [];
  const pairLabel = payload.primary_name && payload.partner_name ? `${payload.primary_name} & ${payload.partner_name}` : "The pair";
  const sortedSections = payload.sections
    ? Object.entries(payload.sections).sort(([a], [b]) => Number(a) - Number(b))
    : [];

  if (sortedSections.length) {
    sortedSections.forEach(([id, text]) => {
      const headings = [
        "Restatement of couple data & query",
        "Disclaimer & orientation",
        "Individual snapshots",
        "Ashta Koota summary",
        "Detailed compatibility",
        "Risk areas & balancing factors",
        "Guidance & remedies",
        "Closing & free will",
      ];
      const heading = headings[Number(id) - 1] || `Section ${id}`;
      sections.push({ heading, english: text });
    });
  } else if (payload.interpretation) {
    sections.push({
      heading: `${pairLabel}`,
      english: payload.interpretation,
      hindi: payload.interpretation_hi,
    });
  }

  if (payload.compatibility) {
    const bullets: string[] = [];
    if (payload.compatibility.compatibility_index !== undefined) {
      bullets.push(`Harmony index: ${Math.round(payload.compatibility.compatibility_index)} / 100`);
    }
    if (payload.compatibility.long_term_index !== undefined) {
      bullets.push(`Long-term: ${Math.round(payload.compatibility.long_term_index)} / 100`);
    }
    if (payload.compatibility.short_term_index !== undefined) {
      bullets.push(`Short-term: ${Math.round(payload.compatibility.short_term_index)} / 100`);
    }
    payload.compatibility.breakdown?.forEach((item) => {
      bullets.push(`${item.description}${item.notes ? ` — ${item.notes}` : ""}`);
    });
    const alignments = payload.compatibility.alignment_percentages;
    if (alignments) {
      bullets.push(
        `Emotional ${Math.round(alignments.emotional ?? 0)}% · Spiritual ${Math.round(alignments.spiritual ?? 0)}% · Communication ${Math.round(alignments.communication ?? 0)}%`,
      );
    }
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

function mapSakaDate(sakaPayload?: CalendarPayload["saka_date"]): SakaDate | undefined {
  if (!sakaPayload) return undefined;
  return {
    year: sakaPayload.year,
    month: sakaPayload.month,
    monthIndex: sakaPayload.month_index,
    day: sakaPayload.day,
    leapYear: sakaPayload.leap_year,
  };
}

function interpretCalendar(payload: CalendarPayload): InsightSection[] {
  const sections: InsightSection[] = [];
  const sakaDate = mapSakaDate(payload.saka_date);
  const sakaLabel = formatSakaLabel(sakaDate);
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
      english: `${sakaLabel} — ${payload.birth_date ?? ""} ${payload.birth_time ?? ""} at ${payload.birth_place ?? ""}`.trim(),
      hindi: "कैलेंडर रूपांतरण IST सन्दर्भ के साथ तैयार है।",
    });
  }
  const dashboardBullets = [
    payload.tithi_name ? `Tithi: ${payload.tithi_name}` : null,
    payload.nakshatra ? `Nakshatra: ${payload.nakshatra}` : null,
    payload.yoga ? `Yoga: ${payload.yoga}` : null,
    payload.karana ? `Karana: ${payload.karana}` : null,
    payload.weekday ? `Weekday (IST): ${payload.weekday}` : null,
    payload.conversion_factor_years !== undefined
      ? `Gregorian offset: ${payload.conversion_factor_years} years`
      : null,
    sakaDate?.monthIndex !== undefined
      ? `Śaka month ${sakaDate.monthIndex}${sakaDate.month ? ` (${sakaDate.month})` : ""}`
      : null,
    sakaDate?.leapYear !== undefined ? `Leap year: ${sakaDate.leapYear ? "Yes" : "No"}` : null,
    payload.ephemeris_source ? `Ephemeris: ${payload.ephemeris_source}` : null,
    payload.ist_reference_longitude ? `IST meridian: ${payload.ist_reference_longitude}°E` : null,
    payload.sources?.length ? `Sources: ${payload.sources.join(" · ")}` : null,
  ].filter(Boolean) as string[];

  if (dashboardBullets.length) {
    sections.push({
      heading: "Śaka dashboard",
      english: "Aligned Panchang factors and references.",
      hindi: "सभी पंचांग तत्व और स्रोत प्रमाणित हैं।",
      bullets: dashboardBullets,
      collapsible: dashboardBullets.length > 4,
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
  const accent = engineAccents[engine] ?? engineAccents.horoscope;
  const engineLabel = engineLabels[engine] ?? "Engine results";
  const horoscopePayload = engine === "horoscope" && typeof payload === "object" ? (payload as HoroscopePayload) : null;
  const feedbackContext = useMemo(() => {
    if (!payload || typeof payload !== "object") return undefined;
    const typed = payload as HoroscopePayload;
    const remedyIds = (typed.remedies || []).map((remedy) => remedy.id).filter(Boolean) as string[];
    if (!typed.weights && !remedyIds.length) return undefined;
    return {
      weights: typed.weights,
      remedyIds,
    };
  }, [payload]);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [flipActive, setFlipActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [isFavorite, setIsFavorite] = useState(false);
  const [fallbackCharts, setFallbackCharts] = useState<{ rashi: ChartHouse[]; bhava: ChartHouse[] }>({
    rashi: [],
    bhava: [],
  });
  const shouldReduceMotion = useReducedMotion();
  const buttonMotion = getButtonMotion(shouldReduceMotion, { lift: 3, scale: 1.03 });

  useEffect(() => {
    const stored = loadBirthDetails();
    if (!stored?.birthDate || !stored?.birthTime || !stored?.birthPlace) return;

    const base: CalendarDetails = {
      birthDate: stored.birthDate,
      birthTime: stored.birthTime,
      birthPlace: stored.birthPlace,
    };
    setFallbackCharts({
      rashi: deriveChartHouses(base, { sakaMonth: stored.sakaMonth, sakaDay: stored.sakaDay }),
      bhava: deriveChartHouses(base, { sakaMonth: stored.sakaMonth, sakaDay: stored.sakaDay, offset: 1 }),
    });
  }, []);

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
    "relative",
    "overflow-hidden",
    "rounded-[2.5rem]",
    "border",
    "border-white/10",
    "bg-slate-950/80",
    "p-8",
    "shadow-[0_30px_60px_rgba(2,6,23,0.55)]",
    "backdrop-blur",
    animationsEnabled ? "prediction-card--animated" : "",
    flipActive ? "is-flipped" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const buildExportLines = useCallback(() => {
    if (!sections.length) return [];
    return [
      `${title} (${engine})`,
      seekerName ? `Seeker: ${seekerName}` : null,
      ...sections.flatMap((section) => [
        section.heading,
        section.english,
        section.hindi ?? null,
        ...(section.bullets ?? []),
      ]),
    ].filter(Boolean) as string[];
  }, [engine, sections, seekerName, title]);

  const escapePdfText = (text: string) =>
    text
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r?\n/g, " ");

  const downloadPdf = useCallback(() => {
    const lines = buildExportLines();
    if (!lines.length) return;
    setIsSaving(true);
    const contentLines = lines.map((line) => escapePdfText(line));
    const streamParts = ["BT", "/F1 12 Tf", "50 780 Td"];
    contentLines.forEach((line, index) => {
      if (index === 0) {
        streamParts.push(`(${line}) Tj`);
      } else {
        streamParts.push("0 -16 Td");
        streamParts.push(`(${line}) Tj`);
      }
    });
    streamParts.push("ET");
    const contentStream = streamParts.join("\n");

    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
      `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets[index + 1] = pdf.length;
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${engine}-guidance.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
    setIsSaving(false);
  }, [buildExportLines, engine]);

  const downloadText = useCallback(() => {
    const lines = buildExportLines();
    if (!lines.length) return;
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${engine}-guidance.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [buildExportLines, engine]);

  const copySummary = useCallback(async () => {
    const lines = buildExportLines();
    if (!lines.length) return;
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyStatus("copied");
    } catch (error) {
      console.error("Unable to copy summary", error);
      setCopyStatus("failed");
    }
  }, [buildExportLines]);

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timeout = window.setTimeout(() => setCopyStatus("idle"), 2200);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  if (!payload || !sections.length) {
    return (
      <section className={cardClassName} aria-live="polite" role="status" aria-label={t("results.title", "Results")}>
        <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-30`} aria-hidden />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1">{engineLabel}</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1">Awaiting results</span>
          </div>
          <div className="section-heading space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Response</p>
            <h3 className="text-2xl font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-300">
              {t("results.helper", "Guidance will arrive in clear English and Hindi once you submit.")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            Submit the form to unlock layered narratives, bilingual summaries, and chart visuals tailored to this engine.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cardClassName} aria-live="polite" role="status" aria-label={t("results.title", "Results")}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-35`} aria-hidden />
      <div className="prediction-card__body relative space-y-8">
        <div className="section-heading space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1">{engineLabel}</span>
            {seekerName ? (
              <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1">{seekerName}</span>
            ) : null}
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Response</p>
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-300">{t("results.helperRaw", "Narratives are ready to share—no JSON needed.")}</p>
          <div className="prediction-card__actions flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-200">PDF export ready for this engine.</span>
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:border-white/30"
                onClick={downloadPdf}
                disabled={isSaving}
                {...buttonMotion}
              >
                {isSaving ? "Preparing PDF…" : "Download PDF"}
              </motion.button>
              <motion.button
                type="button"
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  isFavorite
                    ? "border-pink-400/60 bg-pink-500/20 text-pink-100"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30"
                }`}
                onClick={() => setIsFavorite((prev) => !prev)}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                {...buttonMotion}
              >
                <motion.span
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : isFavorite
                        ? { scale: [1, 1.2, 1], rotate: [0, -8, 0] }
                        : { scale: 1 }
                  }
                  transition={{ duration: 0.35, ease: easeStandard }}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-pink-400 text-pink-200" : ""}`} />
                </motion.span>
                {isFavorite ? "Saved" : "Favorite"}
              </motion.button>
              <AnimatePresence>
                {isFavorite ? (
                  <motion.span
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-200"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                  >
                    Loved
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <motion.div
          className="insight-grid grid gap-4 lg:grid-cols-2"
          variants={sectionGridVariants}
          initial="hidden"
          animate="show"
        >
          {sections.map(renderSection)}
        </motion.div>
        {horoscopePayload && (
          <>
            <KundliCharts
              rashiChart={horoscopePayload.rashi_chart?.length ? horoscopePayload.rashi_chart : fallbackCharts.rashi}
              bhavaChart={horoscopePayload.bhava_chart?.length ? horoscopePayload.bhava_chart : fallbackCharts.bhava}
              dashas={horoscopePayload.dashas}
            />
            <WebXRChart rashiChart={horoscopePayload.rashi_chart ?? fallbackCharts.rashi} />
          </>
        )}
        {payload && <FeedbackPrompt engine={engine} seekerName={seekerName} context={feedbackContext} />}
      </div>
    </section>
  );
}
