import { NatalChart, AstrologyMetadata, House, Planet } from "@/types/natal";

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const PLANET_NAMES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"];

type ParsedBirthDetails = {
  date: { year: number; month: number; day: number; label: string };
  time: { hour: number; minute: number; label: string };
};

function parseBirthDate(dateOfBirth: string) {
  const trimmed = dateOfBirth.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const reversedMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return { year: Number(year), month: Number(month), day: Number(day), label: `${year}-${month}-${day}` };
  }

  if (reversedMatch) {
    const [, day, month, year] = reversedMatch;
    return { year: Number(year), month: Number(month), day: Number(day), label: `${year}-${month}-${day}` };
  }

  throw new Error("Invalid date format. Use YYYY-MM-DD or DD-MM-YYYY.");
}

function parseBirthTime(timeOfBirth: string) {
  const trimmed = timeOfBirth.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    throw new Error("Invalid time format. Use HH:mm in 24h format.");
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    throw new Error("Birth time is out of range.");
  }

  return {
    hour,
    minute,
    label: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
  };
}

function placeSeed(place: string) {
  return place
    .trim()
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function deriveTimeZone(place: string) {
  const seed = placeSeed(place);
  const offsetSteps = (seed % 19) - 9; // range: -9..9 in 30 minute increments
  const offsetMinutes = offsetSteps * 30;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (absMinutes % 60).toString().padStart(2, "0");
  const timezone = `UTC${sign}${hours}:${minutes}`;
  return { timezone, offsetMinutes };
}

function normalizeDateTime(input: ParsedBirthDetails, place: string) {
  const { timezone, offsetMinutes } = deriveTimeZone(place);
  const utcMillis = Date.UTC(
    input.date.year,
    input.date.month - 1,
    input.date.day,
    input.time.hour,
    input.time.minute
  );
  const adjustedMillis = utcMillis - offsetMinutes * 60 * 1000;
  const normalized = new Date(adjustedMillis);
  return { normalized, timezone };
}

function wrapIndex(value: number, modulus: number) {
  return ((value % modulus) + modulus) % modulus;
}

function buildAscendant(seed: number) {
  const signIndex = wrapIndex(seed, ZODIAC_SIGNS.length);
  const degree = wrapIndex(seed * 13, 30) + 0.25;
  return { signIndex, ascendant: { sign: ZODIAC_SIGNS[signIndex], degree: Math.round(degree * 100) / 100 } };
}

function buildHouses(ascendantIndex: number, baseDegree: number): House[] {
  return Array.from({ length: 12 }, (_, idx) => {
    const number = idx + 1;
    const signIndex = wrapIndex(ascendantIndex + idx, ZODIAC_SIGNS.length);
    const start_degree = wrapIndex(baseDegree + idx * 30, 360);
    return { number, sign: ZODIAC_SIGNS[signIndex], start_degree: Math.round(start_degree * 100) / 100 };
  });
}

function buildPlanets(seed: number, ascendantIndex: number): Planet[] {
  return PLANET_NAMES.map((name, idx) => {
    const signIndex = wrapIndex(seed + idx * 7, ZODIAC_SIGNS.length);
    const house = wrapIndex(signIndex - ascendantIndex, 12) + 1;
    const degree = wrapIndex(seed * (idx + 3), 30) + (idx % 3);
    const retrograde = wrapIndex(seed + idx, 2) === 0;

    return {
      name,
      sign: ZODIAC_SIGNS[signIndex],
      house,
      degree: Math.round(degree * 100) / 100,
      retrograde,
    };
  });
}

function buildMetadata(
  parsed: ParsedBirthDetails,
  placeOfBirth: string,
  timezone: string,
  normalizedDate: Date
): AstrologyMetadata {
  return {
    name: "",
    date_of_birth: parsed.date.label,
    time_of_birth: parsed.time.label,
    place_of_birth: placeOfBirth.trim(),
    timezone,
    calendar: {
      gregorian: normalizedDate.toISOString(),
      bharat_traditional: "TODO",
    },
  };
}

/**
 * Build a structured natal chart using deterministic placeholder logic.
 * TODO: Replace placeholder calculations with real ephemeris-based math and time zone derivation.
 */
export async function generateNatalChart(input: {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
}): Promise<NatalChart> {
  const parsedDate = parseBirthDate(input.dateOfBirth);
  const parsedTime = parseBirthTime(input.timeOfBirth);
  const parsed: ParsedBirthDetails = { date: parsedDate, time: parsedTime };

  const { normalized, timezone } = normalizeDateTime(parsed, input.placeOfBirth);
  const baseSeed =
    parsedDate.year * 10000 +
    parsedDate.month * 100 +
    parsedDate.day +
    parsedTime.hour * 60 +
    parsedTime.minute +
    placeSeed(input.placeOfBirth);

  const { signIndex: ascIndex, ascendant } = buildAscendant(baseSeed);
  const houses = buildHouses(ascIndex, ascendant.degree);
  const planets = buildPlanets(baseSeed, ascIndex);

  const metadata = buildMetadata(parsed, input.placeOfBirth, timezone, normalized);
  metadata.name = input.name.trim();

  return {
    metadata,
    chart: {
      ascendant,
      houses,
      planets,
    },
  };
}
