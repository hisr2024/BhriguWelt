import { interpretChart } from "@/lib/interpretChart";
import { NatalChart } from "@/types/natal";
import { ChartResponse, FormState, Interpretation } from "./types";

export function isNatalChart(
  payload: ChartResponse,
): payload is NatalChart {
  if (!payload || typeof payload !== "object") return false;
  const maybeChart = (payload as { chart?: unknown }).chart;
  return Boolean(
    maybeChart &&
    typeof maybeChart === "object" &&
    Array.isArray((maybeChart as { planets?: unknown }).planets) &&
    Array.isArray((maybeChart as { houses?: unknown }).houses) &&
    (maybeChart as { ascendant?: unknown }).ascendant
  );
}

export function extractInterpretation(payload: ChartResponse): Interpretation {
  const raw = JSON.stringify(payload, null, 2);
  const typedPayload = payload as {
    interpretation?: unknown;
    interpretation_hi?: unknown;
    karmic_epoch?: unknown;
    past_life_insights?: unknown;
    future_trajectories?: unknown;
    remedies?: unknown;
    insights?: unknown;
  };
  const englishBlocks: string[] = [];
  const english = typeof typedPayload.interpretation === "string" ? typedPayload.interpretation : undefined;
  const hindi = typeof typedPayload.interpretation_hi === "string" ? typedPayload.interpretation_hi : undefined;
  const summary = typeof typedPayload.karmic_epoch === "string" ? typedPayload.karmic_epoch : undefined;

  if (english) englishBlocks.push(english);

  const pastLife =
    (Array.isArray((typedPayload as { past_life_report?: { insights?: unknown } }).past_life_report?.insights)
      ? (typedPayload as { past_life_report: { insights: unknown[] } }).past_life_report.insights
      : undefined) || (Array.isArray(typedPayload.past_life_insights) ? typedPayload.past_life_insights : undefined);

  const supplementalPastLife = Array.isArray(typedPayload.insights) ? typedPayload.insights : undefined;

  const allPastLife = pastLife || supplementalPastLife;
  if (allPastLife?.length) {
    englishBlocks.push(
      `Past life insights:\n${allPastLife
        .map((entry) => {
          const record = entry as { narrative?: string; sutra_reference?: string };
          const narrative = record?.narrative || JSON.stringify(entry);
          const reference = record?.sutra_reference ? ` (${record.sutra_reference})` : "";
          return `• ${narrative}${reference}`;
        })
        .join("\n")}`,
    );
  }

  const future = Array.isArray(typedPayload.future_trajectories) ? typedPayload.future_trajectories : undefined;
  if (future?.length) {
    englishBlocks.push(
      `Future trajectories:\n${future
        .map((entry) => {
          const record = entry as { focus?: string; window?: string };
          const focus = record?.focus || JSON.stringify(entry);
          const window = record?.window ? ` — ${record.window}` : "";
          return `• ${focus}${window}`;
        })
        .join("\n")}`,
    );
  }

  const remedies = Array.isArray(typedPayload.remedies) ? typedPayload.remedies : undefined;
  if (remedies?.length) {
    englishBlocks.push(
      `Remedies:\n${remedies
        .map((entry) => {
          const record = entry as { description?: string; sutra_reference?: string };
          const description = record?.description || JSON.stringify(entry);
          const reference = record?.sutra_reference ? ` (${record.sutra_reference})` : "";
          return `• ${description}${reference}`;
        })
        .join("\n")}`,
    );
  }

  const assembledEnglish = englishBlocks.length ? englishBlocks.join("\n\n") : undefined;

  if (assembledEnglish || hindi) {
    return { english: assembledEnglish, hindi, raw, summary };
  }

  if (isNatalChart(payload)) {
    return { english: interpretChart({ chart: payload }), raw, summary };
  }

  return { raw };
}

function normalizeNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim()) {
    const coerced = Number(value);
    return Number.isFinite(coerced) ? coerced : undefined;
  }
  return undefined;
}

export function buildHoroscopePayload(payload: FormState) {
  const basePayload: Record<string, unknown> = {
    name: payload.name.trim(),
    birth_date: payload.dateOfBirth,
    birth_time: payload.timeOfBirth,
    birth_place: payload.placeOfBirth.trim(),
  };

  const optionalMappings: Array<[keyof FormState, string]> = [
    ["tradition", "tradition"],
    ["timezone", "timezone"],
    ["lunarTithi", "lunar_tithi"],
    ["moonElement", "moon_element"],
    ["marsHouse", "mars_house"],
    ["saturnHouse", "saturn_house"],
    ["venusHouse", "venus_house"],
    ["rahuAspectsAscendant", "rahu_aspects_ascendant"],
    ["ketuHouse", "ketu_house"],
    ["mercuryHouse", "mercury_house"],
    ["jupiterHouse", "jupiter_house"],
    ["saturnRetrograde", "saturn_retrograde"],
  ];

  for (const [formKey, targetKey] of optionalMappings) {
    const value = payload[formKey];
    if (value === undefined || value === null) continue;

    if (typeof value === "boolean") {
      basePayload[targetKey] = value;
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        basePayload[targetKey] = trimmed;
      }
      continue;
    }

    const numericValue = normalizeNumber(value);
    if (numericValue && numericValue !== 0) {
      basePayload[targetKey] = numericValue;
    }
  }

  return basePayload;
}

export async function postChart(path: string, payload: FormState, baseUrl?: string) {
  const normalizedBase = baseUrl ? baseUrl.replace(/\/$/, "") : "";
  const url = normalizedBase ? `${normalizedBase}${path}` : path;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildHoroscopePayload(payload)),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed`);
  }

  return (await response.json()) as ChartResponse;
}

export function sanitize(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
