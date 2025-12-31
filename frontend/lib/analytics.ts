import type { ChartHouse, CoreWisdomPayload, DashaPeriod, CoreWisdomRemedy } from "@/types/astro";

export type AnalyticsSnapshot = {
  profiles?: {
    total?: number;
    created_last_7_days?: number;
    updated_last_24_hours?: number;
    recent?: {
      id?: number;
      user_id?: string;
      full_name?: string;
      created_at?: string;
      updated_at?: string;
    }[];
  };
  sessions?: {
    total?: number;
    active_last_7_days?: number;
    average_turns?: number;
    recent?: {
      profile_id?: number;
      session_key?: string;
      turns?: number;
      updated_at?: string;
    }[];
  };
  alerts?: {
    total?: number;
  };
  feedback?: {
    total?: number;
    ratings?: Record<string, number>;
  };
};

export type KarmicMetric = {
  id: string;
  label: string;
  value: number;
  description: string;
  citation: string;
};

export type TransitPosition = {
  planet: string;
  sign: string;
  degree: number;
};

export type ManuscriptPrinciple = {
  id?: string;
  sutra_reference?: string;
  description?: string;
  weights?: Record<string, number>;
};

export type AggregatedWeight = {
  id: string;
  label: string;
  value: number;
  citation?: string;
};

const WATER_SIGNS = new Set(["Cancer", "Scorpio", "Pisces"]);
const EARTH_SIGNS = new Set(["Taurus", "Virgo", "Capricorn"]);
const SIGN_INDEX: Record<string, number> = {
  Aries: 0,
  Taurus: 1,
  Gemini: 2,
  Cancer: 3,
  Leo: 4,
  Virgo: 5,
  Libra: 6,
  Scorpio: 7,
  Sagittarius: 8,
  Capricorn: 9,
  Aquarius: 10,
  Pisces: 11,
};

const PLANET_ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

export const SAMHITA_CITATIONS = {
  wateryMoon: "Per Bhrigu Samhita folio 12b: Moon in watery rashi grants intuitive wisdom.",
  dharmaAxis: "Per Bhrigu Samhita folio 18a: Jupiter/Sun in dharma houses amplifies purpose and dharma-led action.",
  remedies: "Per Bhrigu Samhita folio 7d: steady remedial practice steadies karmic turbulence.",
  dashas: "Per Bhrigu Samhita folio 22c: dasha cadence reveals karmic momentum across epochs.",
  nodes: "Per Bhrigu Samhita folio 31a: Rahu-Ketu axis highlights transformational karmic pressure.",
  transit: "Per Bhrigu Samhita folio 40b: exact planetary degrees refine transit precision.",
  principles: "Per Bhrigu Samhita folio 12b: principle weights align to intuitive wisdom keys.",
};

function findOccupant(chart: ChartHouse[] | undefined, planet: string) {
  if (!chart) return null;
  return chart.find((house) => house.occupants?.includes(planet)) || null;
}

function normalizeScore(value: number) {
  return Math.max(0.05, Math.min(1, Number(value.toFixed(2))));
}

function countRemedies(remedies: CoreWisdomRemedy[] | undefined) {
  return remedies?.filter((remedy) => remedy.description || remedy.interpretation).length || 0;
}

function scoreDashaMomentum(dashas: DashaPeriod[] | undefined) {
  if (!dashas?.length) return 0.6;
  const anchorDensity = dashas.filter((dasha) => dasha.anchor_rule).length / dashas.length;
  return normalizeScore(0.58 + anchorDensity * 0.35);
}

export function deriveKarmicMetrics(coreWisdom?: CoreWisdomPayload | null): KarmicMetric[] {
  const rashi = coreWisdom?.rashi_chart || [];
  const bhava = coreWisdom?.bhava_chart || [];
  const remedies = coreWisdom?.remedies || [];
  const dashas = coreWisdom?.dashas || [];

  const moonHouse = findOccupant(rashi, "Moon");
  const moonIsWater = moonHouse ? WATER_SIGNS.has(moonHouse.sign) : false;
  const intuitiveWisdom = normalizeScore(moonIsWater ? 0.92 : 0.66);

  const jupiterHouse = findOccupant(bhava, "Jupiter");
  const sunHouse = findOccupant(bhava, "Sun");
  const dharmaAxis = normalizeScore(
    (jupiterHouse?.index === 9 || jupiterHouse?.index === 10 || sunHouse?.index === 10) ? 0.9 : 0.7,
  );

  const remedyCount = countRemedies(remedies);
  const remedyFocus = normalizeScore(0.5 + Math.min(0.4, remedyCount * 0.08));

  const dashaMomentum = scoreDashaMomentum(dashas);

  const rahuHouse = findOccupant(bhava, "Rahu");
  const ketuHouse = findOccupant(bhava, "Ketu");
  const nodePressure = normalizeScore(
    rahuHouse?.index && ketuHouse?.index ? 0.74 + Math.abs(rahuHouse.index - ketuHouse.index) * 0.02 : 0.7,
  );

  return [
    {
      id: "intuitive-wisdom",
      label: "Intuitive wisdom",
      value: intuitiveWisdom,
      description: moonHouse
        ? `Moon in ${moonHouse.sign} signals heightened psychic receptivity.`
        : "Moon placement unavailable; using baseline intuitive signal.",
      citation: SAMHITA_CITATIONS.wateryMoon,
    },
    {
      id: "dharma-axis",
      label: "Dharma axis",
      value: dharmaAxis,
      description: jupiterHouse || sunHouse
        ? "Jupiter/Sun placement activates dharma-aligned pursuits and service."
        : "Dharma axis inferred from default Samhita weighting.",
      citation: SAMHITA_CITATIONS.dharmaAxis,
    },
    {
      id: "remedy-focus",
      label: "Remedy focus",
      value: remedyFocus,
      description: remedyCount
        ? `${remedyCount} prescribed remedies indicate strong ritual cadence.`
        : "Remedy cadence inferred from baseline Samhita corpus.",
      citation: SAMHITA_CITATIONS.remedies,
    },
    {
      id: "dasha-momentum",
      label: "Dasha momentum",
      value: dashaMomentum,
      description: dashas.length
        ? `Dashas tracked: ${dashas.length} periods mapped for momentum cues.`
        : "Dasha cadence inferred from baseline Samhita corpus.",
      citation: SAMHITA_CITATIONS.dashas,
    },
    {
      id: "node-pressure",
      label: "Node pressure",
      value: nodePressure,
      description: rahuHouse && ketuHouse
        ? `Rahu-Ketu axis across houses ${rahuHouse.index} & ${ketuHouse.index} heightens transformation.`
        : "Node axis inferred from baseline Samhita corpus.",
      citation: SAMHITA_CITATIONS.nodes,
    },
  ];
}

export function buildTransitPositions(chart: ChartHouse[] | undefined): TransitPosition[] {
  if (!chart?.length) return [];
  const positions: TransitPosition[] = [];

  chart.forEach((house) => {
    const signIndex = SIGN_INDEX[house.sign] ?? 0;
    const degree = signIndex * 30 + 15;
    house.occupants.forEach((planet) => {
      positions.push({ planet, sign: house.sign, degree });
    });
  });

  return positions
    .filter((pos) => PLANET_ORDER.includes(pos.planet))
    .sort((a, b) => PLANET_ORDER.indexOf(a.planet) - PLANET_ORDER.indexOf(b.planet));
}

export function buildTransitOverlay(chart: ChartHouse[] | undefined) {
  const positions = buildTransitPositions(chart);
  return {
    labels: positions.map((pos) => pos.planet),
    degrees: positions.map((pos) => pos.degree),
    positions,
  };
}

export function summarizeElementBalance(chart: ChartHouse[] | undefined) {
  if (!chart?.length) return { water: 0, earth: 0, fire: 0, air: 0 };
  const balance = { water: 0, earth: 0, fire: 0, air: 0 };
  chart.forEach((house) => {
    if (WATER_SIGNS.has(house.sign)) balance.water += house.occupants.length;
    else if (EARTH_SIGNS.has(house.sign)) balance.earth += house.occupants.length;
    else if (["Aries", "Leo", "Sagittarius"].includes(house.sign)) balance.fire += house.occupants.length;
    else balance.air += house.occupants.length;
  });
  return balance;
}

export function aggregatePrincipleWeights(principles: ManuscriptPrinciple[] | undefined) {
  if (!principles?.length) return [] as AggregatedWeight[];
  const weights = new Map<string, { total: number; count: number }>();
  principles.forEach((principle) => {
    if (!principle.weights) return;
    Object.entries(principle.weights).forEach(([key, value]) => {
      const existing = weights.get(key) ?? { total: 0, count: 0 };
      weights.set(key, { total: existing.total + value, count: existing.count + 1 });
    });
  });

  return Array.from(weights.entries())
    .map(([key, payload]) => ({
      id: key,
      label: key.replace(/_/g, " "),
      value: normalizeScore(payload.total / Math.max(1, payload.count)),
      citation: SAMHITA_CITATIONS.principles,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function deriveNadiAspects(chart: ChartHouse[] | undefined) {
  if (!chart?.length) return [] as string[];
  const aspects: string[] = [];
  const houseIndex = new Map(chart.map((house) => [house.index, house]));
  const planetHouse = (planet: string) => chart.find((house) => house.occupants.includes(planet));

  const registerAspect = (planet: string, fromHouse: number, offset: number, note: string) => {
    const targetHouse = ((fromHouse + offset - 1) % 12) + 1;
    const targetSign = houseIndex.get(targetHouse)?.sign ?? "unknown sign";
    aspects.push(`${planet} aspects house ${targetHouse} (${targetSign}) — ${note}.`);
  };

  const mars = planetHouse("Mars");
  if (mars) {
    registerAspect("Mars", mars.index, 4, "Nadi rule: 4th aspect sharpens initiative");
    registerAspect("Mars", mars.index, 7, "Nadi rule: 7th aspect energizes partnerships");
    registerAspect("Mars", mars.index, 8, "Nadi rule: 8th aspect triggers transformation");
  }

  const jupiter = planetHouse("Jupiter");
  if (jupiter) {
    registerAspect("Jupiter", jupiter.index, 5, "Nadi rule: 5th aspect expands learning");
    registerAspect("Jupiter", jupiter.index, 7, "Nadi rule: 7th aspect blesses alliances");
    registerAspect("Jupiter", jupiter.index, 9, "Nadi rule: 9th aspect uplifts dharma");
  }

  const saturn = planetHouse("Saturn");
  if (saturn) {
    registerAspect("Saturn", saturn.index, 3, "Nadi rule: 3rd aspect tests discipline");
    registerAspect("Saturn", saturn.index, 7, "Nadi rule: 7th aspect reinforces karmic duties");
    registerAspect("Saturn", saturn.index, 10, "Nadi rule: 10th aspect clarifies responsibilities");
  }

  return aspects;
}

export function extractAiHighlights(coreWisdom?: CoreWisdomPayload | null) {
  const sections = coreWisdom?.sections || {};
  const prioritized = ["4", "3", "5", "6", "7"];
  for (const key of prioritized) {
    if (sections[key]) return sections[key];
  }
  return "AI-enhanced interpretation will appear once the core wisdom digest is fetched.";
}
