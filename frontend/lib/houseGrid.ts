import { CalendarDetails, ChartHouse } from "@/types/astro";

export const HOUSE_FOCUSES = [
  "Self & vitality",
  "Resources & voice",
  "Kin & courage",
  "Home & roots",
  "Learning & joy",
  "Health & discipline",
  "Partnerships",
  "Mysteries & transformation",
  "Dharma & travel",
  "Career & karma",
  "Allies & networks",
  "Rest & subconscious",
];

export const ZODIAC_SIGNS = [
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

export const SIGN_ELEMENTS: Record<string, { element: string; glyph: string }> = {
  Aries: { element: "Fire", glyph: "🔥" },
  Taurus: { element: "Earth", glyph: "🌱" },
  Gemini: { element: "Air", glyph: "🌬️" },
  Cancer: { element: "Water", glyph: "💧" },
  Leo: { element: "Fire", glyph: "☀️" },
  Virgo: { element: "Earth", glyph: "🪴" },
  Libra: { element: "Air", glyph: "🪽" },
  Scorpio: { element: "Water", glyph: "🌊" },
  Sagittarius: { element: "Fire", glyph: "🔥" },
  Capricorn: { element: "Earth", glyph: "⛰️" },
  Aquarius: { element: "Air", glyph: "💨" },
  Pisces: { element: "Water", glyph: "🐚" },
};

export type HouseSummary = {
  index: number;
  sign: string;
  focus: string;
  tooltip: string;
  element: string;
  glyph: string;
};

export function deriveHouseGrid(details: CalendarDetails, sakaMonth?: string, sakaDay?: number): HouseSummary[] {
  const rawDateSeed = details.birthDate ? Date.parse(details.birthDate) : Number.NaN;
  const dateSeed = Number.isFinite(rawDateSeed) ? rawDateSeed : Date.UTC(2000, 0, 1);
  const [hours, minutes] = details.birthTime.split(":").map((value) => Number(value) || 0);
  const timeSeed = hours * 60 + minutes;
  const placeSeed = details.birthPlace.length;
  const offset = Math.abs(Math.round(dateSeed / 86400000 + timeSeed + placeSeed + (sakaDay || 0))) % 12;

  return HOUSE_FOCUSES.slice(0, 12).map((focus, index) => {
    const signIndex = (index + offset) % ZODIAC_SIGNS.length;
    const sign = ZODIAC_SIGNS[signIndex];
    const tooltip =
      `House ${index + 1}: ${focus}. Linked to ${sign} ` +
      `by the ${sakaMonth || "Bharat"} rhythm and the longitude anchor at ${details.birthPlace || "the stated place"}.`;

    return {
      index: index + 1,
      focus,
      sign,
      tooltip,
      element: SIGN_ELEMENTS[sign]?.element || "Space",
      glyph: SIGN_ELEMENTS[sign]?.glyph || "✶",
    } satisfies HouseSummary;
  });
}

export function deriveChartHouses(
  details: CalendarDetails,
  options?: { sakaMonth?: string; sakaDay?: number; offset?: number }
): ChartHouse[] {
  const { sakaMonth, sakaDay, offset = 0 } = options || {};
  const houses = deriveHouseGrid(details, sakaMonth, sakaDay);

  return houses.map((house) => {
    const rotatedIndex = ((house.index + offset - 1 + 12) % 12) + 1;
    const rotatedSign = ZODIAC_SIGNS[(ZODIAC_SIGNS.indexOf(house.sign) + offset) % ZODIAC_SIGNS.length] || house.sign;
    const occupantLabel = house.focus || rotatedSign;

    return {
      index: rotatedIndex,
      sign: rotatedSign,
      focus: house.focus,
      occupants: [occupantLabel],
      bhrigu_notes: [
        `${rotatedSign} focus anchored by ${house.focus || "core house emphasis"}.`,
        house.tooltip,
      ],
    } satisfies ChartHouse;
  });
}
