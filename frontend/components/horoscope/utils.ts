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
  };
  const english = typeof typedPayload.interpretation === "string" ? typedPayload.interpretation : undefined;
  const hindi = typeof typedPayload.interpretation_hi === "string" ? typedPayload.interpretation_hi : undefined;
  const summary = typeof typedPayload.karmic_epoch === "string" ? typedPayload.karmic_epoch : undefined;

  if (english || hindi) {
    return { english, hindi, raw, summary };
  }

  if (isNatalChart(payload)) {
    return { english: interpretChart({ chart: payload }), raw, summary };
  }

  return { raw };
}

export async function postChart(path: string, payload: FormState) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      birth_date: payload.dateOfBirth,
      birth_time: payload.timeOfBirth,
      birth_place: payload.placeOfBirth.trim(),
    }),
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
