import fs from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

import { interpretChart } from "@/lib/interpretChart";
import { generateNatalChart } from "@/lib/natal";

type BhriguPrinciple = {
  id: string;
  description?: string;
  sutra_reference?: string;
  weights?: Record<string, number>;
};

type ChatRequestBody = {
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  question?: string;
};

type HoroscopeReport = {
  name: string;
  karmic_epoch: string;
  weights: Record<string, number>;
  principles: BhriguPrinciple[];
  remedies: { id: string; description: string; sutra_reference?: string }[];
  past_life_insights: {
    engine_id: string;
    sutra_reference: string;
    narrative: string;
    confidence: number;
  }[];
  future_trajectories: {
    engine_id: string;
    sutra_reference: string;
    focus: string;
    window: string;
    certainty: number;
  }[];
  interpretation: string;
  rashi_chart: unknown;
  bhava_chart: unknown;
  dashas: unknown;
};

async function loadBhriguPrinciples(): Promise<BhriguPrinciple[]> {
  try {
    const filePath = path.join(process.cwd(), "..", "backend", "data", "bhrigu_samhita_principles.yml");
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { principles?: BhriguPrinciple[] };
    return Array.isArray(parsed.principles) ? parsed.principles : [];
  } catch (error) {
    console.warn("Unable to load Bhrigu Samhita principles", error);
    return [];
  }
}

function aggregateWeights(principles: BhriguPrinciple[]): Record<string, number> {
  const totals: Record<string, { sum: number; count: number }> = {};

  for (const principle of principles) {
    if (!principle.weights) continue;
    for (const [key, value] of Object.entries(principle.weights)) {
      if (!totals[key]) {
        totals[key] = { sum: 0, count: 0 };
      }
      totals[key].sum += value;
      totals[key].count += 1;
    }
  }

  return Object.fromEntries(
    Object.entries(totals).map(([key, { sum, count }]) => [key, Number((sum / count).toFixed(2))])
  );
}

function buildPastLifeInsights(principles: BhriguPrinciple[], name: string) {
  return principles.slice(0, 2).map((principle, index) => ({
    engine_id: principle.id,
    sutra_reference: principle.sutra_reference || principle.id,
    narrative:
      principle.description?.
        replace(/\s+/g, " ")
        .trim()
        .concat(
          ` This reads as a reflective echo for ${name}, linking present instincts to the manuscript's karmic storyline.`
        ) ||
      `Manuscript ${principle.id} hints at memories that ${name} may resonate with.`,
    confidence: Number((0.78 - index * 0.08).toFixed(2)),
  }));
}

function buildFutureTrajectories(principles: BhriguPrinciple[], question?: string) {
  return principles.slice(0, 2).map((principle, index) => ({
    engine_id: principle.id,
    sutra_reference: principle.sutra_reference || principle.id,
    focus:
      question
        ? `${principle.description ?? "Bhrigu guidance"} directs the path in relation to your inquiry: ${question}.`
        : principle.description || "Bhrigu guidance for your path ahead.",
    window: index === 0 ? "Next 18-24 months" : "Next 3-7 years",
    certainty: Number((0.72 - index * 0.1).toFixed(2)),
  }));
}

function buildChartSummaries(chart: Awaited<ReturnType<typeof generateNatalChart>>) {
  const houses = chart.chart.houses;
  const planets = chart.chart.planets;

  const summarize = houses.map((house) => ({
    index: house.number,
    sign: house.sign,
    occupants: planets.filter((planet) => planet.house === house.number).map((planet) => planet.name),
    bhrigu_notes: [],
  }));

  const dashas = planets.slice(0, 3).map((planet, index) => ({
    lord: planet.name,
    start: chart.metadata.calendar.gregorian,
    end: chart.metadata.calendar.gregorian,
    anchor_rule: `${planet.name} in house ${planet.house} anchors karmic focus ${index + 1}`,
  }));

  return { rashi_chart: summarize, bhava_chart: summarize, dashas };
}

function sanitizePayload(payload: ChatRequestBody | undefined) {
  return {
    hasName: Boolean(payload?.name?.trim()),
    hasDate: Boolean(payload?.birth_date),
    hasTime: Boolean(payload?.birth_time),
    hasPlace: Boolean(payload?.birth_place?.trim()),
  };
}

export async function POST(request: Request) {
  let body: ChatRequestBody | undefined;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch (error) {
    console.error("/api/bhrigu-chat invalid JSON", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body?.name?.trim();
  const birth_date = body?.birth_date;
  const birth_time = body?.birth_time;
  const birth_place = body?.birth_place?.trim();
  const question = body?.question?.trim();

  if (!name || !birth_date || !birth_time || !birth_place) {
    return NextResponse.json({ error: "Missing birth details" }, { status: 400 });
  }

  try {
    const chart = await generateNatalChart({
      name,
      dateOfBirth: birth_date,
      timeOfBirth: birth_time,
      placeOfBirth: birth_place,
    });

    const principles = await loadBhriguPrinciples();
    const weights = aggregateWeights(principles);
    const past_life_insights = buildPastLifeInsights(principles, name);
    const future_trajectories = buildFutureTrajectories(principles, question);
    const interpretation = interpretChart({ chart, userQuestion: question });
    const chartSummaries = buildChartSummaries(chart);

    const report: HoroscopeReport = {
      name,
      karmic_epoch: `Bhrigu epoch marker: ${chart.metadata.calendar.gregorian}`,
      weights,
      principles: principles.slice(0, 5),
      remedies: principles.slice(0, 2).map((principle, index) => ({
        id: `REM-${principle.id}`,
        description: `Mindful ritual ${index + 1}: reflect on ${principle.description ?? "Bhrigu guidance"}.`,
        sutra_reference: principle.sutra_reference,
      })),
      past_life_insights,
      future_trajectories,
      interpretation: `${interpretation}\n\nBhrigu folio echoes: ${principles
        .slice(0, 2)
        .map((principle) => principle.description)
        .filter(Boolean)
        .join(" ")}`.trim(),
      rashi_chart: chartSummaries.rashi_chart,
      bhava_chart: chartSummaries.bhava_chart,
      dashas: chartSummaries.dashas,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("/api/bhrigu-chat failed", { ...sanitizePayload(body), error });
    return NextResponse.json({ error: "Unable to generate horoscope" }, { status: 500 });
  }
}
