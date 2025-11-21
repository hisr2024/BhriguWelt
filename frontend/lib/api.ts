import { BirthDetails, CalendarDetails, PredictionEngine } from "@/types/astro";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const FALLBACK_RESPONSES: Record<string, unknown> = {
  "/horoscope": {
    name: "Fallback seeker",
    karmic_epoch: "Bhrigu epoch: activation of Mars mandates for infrastructural service.",
    weights: {
      intuitive_dreams: 0.88,
      scholarly_pursuits: 0.76,
      infrastructural_success: 1.08,
      ancestral_calling: 0.92,
    },
    principles: [
      {
        id: "BR-DEMO-1",
        sutra_reference: "Bikaner folio demo",
        description: "Demo folio describing compassionate leadership for watery moon placements.",
      },
    ],
    remedies: [
      {
        id: "REM-DEMO-1",
        sutra_reference: "Grantha leaf demo",
        description: "Light a copper lamp at dawn while reciting Om Brighave Namah to stabilize mind and memory.",
      },
    ],
    past_life_insights: [
      {
        engine_id: "PL-DEMO",
        sutra_reference: "Sharada bundle demo",
        narrative: "The seeker served as a healer along the Narmada and returns to continue medical seva.",
        confidence: 0.82,
      },
    ],
    future_trajectories: [
      {
        engine_id: "FU-DEMO",
        sutra_reference: "Pune folio demo",
        focus: "Multi-decade leadership on smart-city logistics with ancestral blessings.",
        window: "Years 28-52",
        certainty: 0.8,
      },
    ],
  },
  "/past-life": {
    name: "Fallback seeker",
    insights: [
      {
        engine_id: "PL-DEMO",
        sutra_reference: "Sharada bundle demo",
        narrative: "The seeker served as a healer along the Narmada and returns to continue medical seva.",
        confidence: 0.82,
      },
    ],
  },
  "/future": {
    name: "Fallback seeker",
    trajectories: [
      {
        engine_id: "FU-DEMO",
        sutra_reference: "Pune folio demo",
        focus: "Multi-decade leadership on smart-city logistics with ancestral blessings.",
        window: "Years 28-52",
        certainty: 0.8,
      },
    ],
  },
  "/matchmaking": {
    primary_name: "Fallback seeker",
    partner_name: "Partner seeker",
    compatibility: {
      compatibility_index: 89.5,
      breakdown: [
        {
          criterion_id: "MM-DEMO-1",
          sutra_reference: "Bhrigu compatibility demo",
          description: "Moon elements align for devotional partnership and long-distance collaboration.",
          score: 0.92,
          notes: "Harmonious elements recorded in folio pairing.",
        },
        {
          criterion_id: "MM-DEMO-2",
          sutra_reference: "Grantha folio demo",
          description: "Mars and Venus placements favor shared research and startup ventures.",
          score: 0.86,
          notes: "Mars-Venus distance within harmonious band.",
        },
      ],
      modern_highlights: [
        "Remote-first goals match Bhrigu's guidance for distributed seva.",
        "Research-partnership tag aligns with archival scribe combinations.",
      ],
    },
  },
  "/calendar": {
    birth_date: "1995-05-18",
    birth_time: "14:45",
    birth_place: "Varanasi",
    saka_date: {
      year: 1917,
      month: "Jyaishtha",
      month_index: 3,
      day: 28,
      leap_year: false,
    },
    conversion_factor_years: 78,
    ist_reference_longitude: 82.5,
    sources: [
      "Government of India Calendar Reform Committee Report (1955)",
      "Surya Siddhanta translation by Bapu Deva Sastri (Calcutta, 1860)",
    ],
  },
};

type FetchOptions<T> = {
  path: string;
  body: T;
};

function mapBirthDetails(input: BirthDetails) {
  return {
    name: input.name.trim(),
    birth_date: input.birthDate,
    birth_time: input.birthTime,
    birth_place: input.birthPlace.trim(),
    lunar_tithi: Number(input.lunarTithi) || 1,
    moon_element: input.moonElement,
    mars_house: Number(input.marsHouse) || 1,
    saturn_house: Number(input.saturnHouse) || 1,
    venus_house: Number(input.venusHouse) || 1,
    rahu_aspects_ascendant: input.rahuAspectsAscendant,
  };
}

function mapCalendarDetails(input: CalendarDetails) {
  return {
    birth_date: input.birthDate,
    birth_time: input.birthTime,
    birth_place: input.birthPlace.trim(),
  };
}

async function postJson<TResponse, TBody>({ path, body }: FetchOptions<TBody>) {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    const fallback = FALLBACK_RESPONSES[path];
    if (fallback) {
      console.warn(`Using offline Bhrigu fallback for ${path}`, networkError);
      return fallback as TResponse;
    }

    const reason = networkError instanceof Error ? networkError.message : "Unknown error";
    throw new Error(
      `${reason}. Unable to reach the Bhrigu backend at ${BACKEND_URL}${path}. ` +
        "Set NEXT_PUBLIC_BACKEND_URL to your deployed Python API to restore live predictions.",
    );
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed`);
  }

  try {
    return (await response.json()) as TResponse;
  } catch (parseError) {
    const fallback = FALLBACK_RESPONSES[path];
    if (fallback) {
      console.warn(`Using offline Bhrigu fallback for ${path} after parse failure`, parseError);
      return fallback as TResponse;
    }
    throw parseError;
  }
}

export async function requestPrediction(engine: PredictionEngine, details: BirthDetails) {
  const path = `/${engine}`;
  return postJson({ path, body: mapBirthDetails(details) });
}

export async function requestMatchmaking(
  primary: BirthDetails,
  partner: BirthDetails,
  modernPreferences: string,
) {
  const preferences = modernPreferences
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return postJson({
    path: "/matchmaking",
    body: {
      primary: mapBirthDetails(primary),
      partner: mapBirthDetails(partner),
      modern_preferences: preferences,
    },
  });
}

export async function requestCalendar(details: CalendarDetails) {
  return postJson({ path: "/calendar", body: mapCalendarDetails(details) });
}
