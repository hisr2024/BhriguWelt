import { BirthDetails, CalendarDetails, PredictionEngine } from "@/types/astro";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed`);
  }

  return (await response.json()) as TResponse;
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
