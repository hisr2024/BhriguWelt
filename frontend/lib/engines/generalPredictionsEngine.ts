/**
 * General Predictions Engine
 * Two-phase engine: generation + precision check using Bhrigu Samhita and Nadi Jyotisa rules.
 */

import type { ChartData, PredictionResult } from '../api/predictions';

export interface GeneralPredictionOptions {
  now?: Date;
  locale?: string;
}

interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

interface LunarDetails {
  ageDays: number;
  tithi: number;
  paksha: 'Waxing (Shukla Paksha)' | 'Waning (Krishna Paksha)';
  phaseName: string;
}

interface HoraDetails {
  planet: string;
  start: Date;
  end: Date;
}

interface RahuKala {
  start: Date;
  end: Date;
  active: boolean;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const predictionCache = new Map<string, { result: PredictionResult; timestamp: number }>();

const ELEMENT_BY_SIGN: Record<string, string> = {
  Aries: 'Fire',
  Taurus: 'Earth',
  Gemini: 'Air',
  Cancer: 'Water',
  Leo: 'Fire',
  Virgo: 'Earth',
  Libra: 'Air',
  Scorpio: 'Water',
  Sagittarius: 'Fire',
  Capricorn: 'Earth',
  Aquarius: 'Air',
  Pisces: 'Water',
};

const PLANETARY_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
const DAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

const GENERAL_TIMING_RULES = {
  marriage: '7th house lord position, Venus placement, Jupiter transit through 7th from Moon',
  career: '10th house activations, Saturn transits, Dasha changes',
  finance: '2nd and 11th house activations, Jupiter aspects, favorable Dasha periods',
  health: '6th and 8th house transits, Saturn or Mars afflictions, Rahu-Ketu axis',
};

const MUHURTA_RULES = {
  auspicious: {
    daily: 'Abhijit Muhurta (noon), Brahma Muhurta (pre-dawn)',
    weekly: 'Monday, Wednesday, Thursday, Friday generally favorable',
    monthly: 'Waxing Moon (Shukla Paksha) for growth activities',
    yearly: 'Uttarayana (Sun’s northern course) for major initiations',
  },
  avoid: {
    daily: 'Rahu Kala, Gulika Kala, Yamaghanda',
    monthly: 'New Moon (Amavasya), Full Moon (Purnima) unless specific ritual',
    special: 'Eclipse periods for mundane activities',
  },
};

const PRECISION_METHODS = {
  month_level: 'Antardasha periods combined with major transits',
  week_level: 'Pratyantardasha with daily transits',
  day_level: 'Hora analysis, lunar day (Tithi), nakshatra of the day',
};

const PLANET_ENERGIES: Record<string, string> = {
  Sun: 'leadership, vitality, visibility',
  Moon: 'emotions, receptivity, intuition',
  Mars: 'initiative, courage, decisive action',
  Mercury: 'communication, trade, learning',
  Jupiter: 'growth, wisdom, expansion',
  Venus: 'harmony, relationships, beauty',
  Saturn: 'discipline, patience, structure',
  Rahu: 'innovation, disruption, desire',
  Ketu: 'detachment, insight, liberation',
};

const SIGN_FOCUS: Record<string, string> = {
  Fire: 'Take decisive action, but balance speed with awareness.',
  Earth: 'Build stability through practical steps and steady routines.',
  Air: 'Communicate clearly and refine plans through collaboration.',
  Water: 'Honor emotions and prioritize restorative rhythms.',
};

const LUNAR_PHASES: Array<{ maxAge: number; name: string }> = [
  { maxAge: 1.85, name: 'New Moon' },
  { maxAge: 5.54, name: 'Waxing Crescent' },
  { maxAge: 9.23, name: 'First Quarter' },
  { maxAge: 12.92, name: 'Waxing Gibbous' },
  { maxAge: 16.61, name: 'Full Moon' },
  { maxAge: 20.30, name: 'Waning Gibbous' },
  { maxAge: 23.99, name: 'Last Quarter' },
  { maxAge: 27.68, name: 'Waning Crescent' },
  { maxAge: 29.53, name: 'Balsamic' },
];

const RAHU_KALA_INDEX: Record<number, number> = {
  0: 8, // Sunday
  1: 2, // Monday
  2: 7, // Tuesday
  3: 5, // Wednesday
  4: 6, // Thursday
  5: 4, // Friday
  6: 3, // Saturday
};

const HOUSE_FAVORABILITY = {
  jupiter: {
    favorable: [1, 2, 5, 7, 9, 11],
    challenging: [6, 8, 12],
  },
  saturn: {
    favorable: [3, 6, 11],
    challenging: [1, 4, 7, 8, 10, 12],
  },
  rahuKetu: {
    favorable: [3, 6, 11],
    challenging: [1, 2, 4, 5, 7, 8, 9, 12],
  },
};

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatTime = (date: Date, locale: string) =>
  date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

const getDayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const estimateSunTimes = (date: Date, latitude?: number): SunTimes => {
  const localeDate = new Date(date);
  const sunrise = new Date(localeDate);
  const sunset = new Date(localeDate);

  if (latitude === undefined || Number.isNaN(latitude)) {
    sunrise.setHours(6, 0, 0, 0);
    sunset.setHours(18, 0, 0, 0);
    return { sunrise, sunset };
  }

  const rad = Math.PI / 180;
  const dayOfYear = getDayOfYear(date);
  const declination = 23.44 * Math.sin(rad * ((360 / 365) * (dayOfYear - 81)));
  const latRad = latitude * rad;
  const decRad = declination * rad;
  const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(decRad));
  const dayLength = (2 * hourAngle * 180) / (Math.PI * 15);
  const sunriseHour = 12 - dayLength / 2;
  const sunsetHour = 12 + dayLength / 2;

  sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0);
  sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0);

  return { sunrise, sunset };
};

const getLunarDetails = (date: Date): LunarDetails => {
  const julianDay = date.getTime() / 86400000 + 2440587.5;
  const knownNewMoon = 2451550.1;
  const synodicMonth = 29.53058867;
  const age = (julianDay - knownNewMoon) % synodicMonth;
  const ageDays = age < 0 ? age + synodicMonth : age;
  const tithi = Math.floor((ageDays / synodicMonth) * 30) + 1;
  const paksha = ageDays <= synodicMonth / 2 ? 'Waxing (Shukla Paksha)' : 'Waning (Krishna Paksha)';
  const phase =
    LUNAR_PHASES.find(phaseItem => ageDays <= phaseItem.maxAge)?.name ?? 'New Moon';

  return {
    ageDays: Number(ageDays.toFixed(2)),
    tithi,
    paksha,
    phaseName: phase,
  };
};

const getDayLord = (date: Date) => DAY_LORDS[date.getDay()];

const buildHoraSequence = (dayLord: string) => {
  const startIndex = PLANETARY_ORDER.indexOf(dayLord);
  const sequence: string[] = [];
  for (let i = 0; i < 24; i += 1) {
    sequence.push(PLANETARY_ORDER[(startIndex + i) % PLANETARY_ORDER.length]);
  }
  return sequence;
};

const getHoraDetails = (date: Date, sunTimes: SunTimes): HoraDetails => {
  const { sunrise, sunset } = sunTimes;
  const dayLord = getDayLord(date);
  const sequence = buildHoraSequence(dayLord);

  const current = date.getTime();
  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();
  const isDaytime = current >= sunriseMs && current < sunsetMs;

  const dayLength = sunsetMs - sunriseMs;
  const nightLength = 24 * 60 * 60 * 1000 - dayLength;
  const horaLength = (isDaytime ? dayLength : nightLength) / 12;
  const periodStart = isDaytime ? sunriseMs : sunsetMs;
  const hourIndex = Math.floor((current - periodStart) / horaLength);

  const index = isDaytime ? hourIndex : hourIndex + 12;
  const start = new Date(periodStart + horaLength * hourIndex);
  const end = new Date(periodStart + horaLength * (hourIndex + 1));

  return {
    planet: sequence[index % sequence.length],
    start,
    end,
  };
};

const getRahuKala = (date: Date, sunTimes: SunTimes): RahuKala => {
  const { sunrise, sunset } = sunTimes;
  const dayIndex = date.getDay();
  const segmentIndex = (RAHU_KALA_INDEX[dayIndex] ?? 1) - 1;
  const dayLength = sunset.getTime() - sunrise.getTime();
  const segmentLength = dayLength / 8;
  const start = new Date(sunrise.getTime() + segmentIndex * segmentLength);
  const end = new Date(start.getTime() + segmentLength);
  const now = date.getTime();

  return {
    start,
    end,
    active: now >= start.getTime() && now <= end.getTime(),
  };
};

const resolveHouseIndex = (houses: string[] | undefined, sign: string | undefined) => {
  if (!houses || !sign) {
    return null;
  }
  const index = houses.findIndex(house => house.toLowerCase() === sign.toLowerCase());
  return index >= 0 ? index + 1 : null;
};

const resolvePlanetHouses = (chart: ChartData) => {
  const houses = chart.houses;
  const planetHouses: Record<string, number | null> = {};
  if (!chart.planets || !houses) {
    return planetHouses;
  }
  Object.entries(chart.planets).forEach(([planet, position]) => {
    planetHouses[planet] = resolveHouseIndex(houses, position.sign);
  });
  return planetHouses;
};

const buildCacheKey = (chart: ChartData, now: Date) =>
  JSON.stringify({
    date_of_birth: chart.date_of_birth,
    time_of_birth: chart.time_of_birth,
    place_of_birth: chart.place_of_birth,
    zodiac_sign: chart.zodiac_sign,
    moon_sign: chart.moon_sign,
    ascendant: chart.ascendant,
    nakshatra: chart.nakshatra,
    date: now.toISOString().slice(0, 10),
  });

export const generateGeneralPredictions = async (
  chart: ChartData,
  options: GeneralPredictionOptions = {}
): Promise<PredictionResult> => {
  const now = options.now ?? new Date();
  const cacheKey = buildCacheKey(chart, now);
  const cached = predictionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  const locale = options.locale ?? 'en-US';
  const zodiac = chart.zodiac_sign ?? chart.moon_sign ?? 'Unknown';
  const moonSign = chart.moon_sign ?? 'Unknown';
  const ascendant = chart.ascendant ?? 'Unknown';
  const nakshatra = chart.nakshatra ?? 'Unknown';
  const element = ELEMENT_BY_SIGN[zodiac] ?? 'Unknown';
  const dayLord = getDayLord(now);

  const sunTimes = estimateSunTimes(now, chart.latitude);
  const lunarDetails = getLunarDetails(now);
  const hora = getHoraDetails(now, sunTimes);
  const rahuKala = getRahuKala(now, sunTimes);
  const planetHouses = resolvePlanetHouses(chart);

  const qualityNotes: string[] = [];
  if (zodiac === 'Unknown') {
    qualityNotes.push('Zodiac sign missing; derived themes use Moon sign or default values.');
  }
  if (nakshatra === 'Unknown') {
    qualityNotes.push('Nakshatra missing; nakshatra-specific refinement skipped.');
  }

  const daily = `**Daily Predictions** (${now.toLocaleDateString(locale)}):\n\n` +
    `- **Day Lord:** ${dayLord} (${PLANET_ENERGIES[dayLord]})\n` +
    `- **Current Hora:** ${hora.planet} (${PLANET_ENERGIES[hora.planet]}) from ${formatTime(hora.start, locale)} to ${formatTime(hora.end, locale)}\n` +
    `- **Tithi:** ${lunarDetails.tithi} (${lunarDetails.phaseName}) — ${lunarDetails.paksha}\n` +
    `- **Elemental Focus:** ${element} — ${SIGN_FOCUS[element] ?? 'Align actions with your dominant element.'}\n` +
    `- **Chart Anchor:** Ascendant ${ascendant}, Moon ${moonSign}, Nakshatra ${nakshatra}\n` +
    `${rahuKala.active ? `\n**Precision Note:** Rahu Kala is active (${formatTime(rahuKala.start, locale)}-${formatTime(rahuKala.end, locale)}). Defer critical decisions and focus on review or spiritual practice.` : ''}`;

  const weekly = `**Weekly Predictions** (${MUHURTA_RULES.auspicious.weekly}):\n\n` +
    `- Prioritize actions on **${MUHURTA_RULES.auspicious.weekly}** when ${dayLord}-ruled themes align.\n` +
    `- Use **${MUHURTA_RULES.avoid.daily}** timing to avoid launches.\n` +
    `- Elemental pacing for ${element}: ${SIGN_FOCUS[element] ?? 'Balance action and reflection.'}`;

  const monthly = `**Monthly Predictions** (${lunarDetails.paksha}):\n\n` +
    `- **Moon Phase:** ${lunarDetails.phaseName} (Age ${lunarDetails.ageDays} days)\n` +
    `- **Growth Timing:** ${MUHURTA_RULES.auspicious.monthly}\n` +
    `- **Avoid:** ${MUHURTA_RULES.avoid.monthly}\n` +
    `- **Focus:** Plan key efforts during waxing phases; consolidate during waning phases.`;

  const jupiterHouse = planetHouses.Jupiter;
  const saturnHouse = planetHouses.Saturn;
  const rahuHouse = planetHouses.Rahu;
  const ketuHouse = planetHouses.Ketu;

  const yearly = `**Yearly Predictions**:\n\n` +
    `- **Jupiter:** ${jupiterHouse ? `Natal Jupiter in house ${jupiterHouse} (${HOUSE_FAVORABILITY.jupiter.favorable.includes(jupiterHouse) ? 'supportive' : 'developmental'}).` : 'Natal Jupiter house unavailable.'}\n` +
    `- **Saturn:** ${saturnHouse ? `Natal Saturn in house ${saturnHouse} (${HOUSE_FAVORABILITY.saturn.challenging.includes(saturnHouse) ? 'requires discipline' : 'constructive effort favored'}).` : 'Natal Saturn house unavailable.'}\n` +
    `- **Rahu/Ketu:** ${rahuHouse || ketuHouse ? `Nodes in houses Rahu ${rahuHouse ?? 'unknown'} / Ketu ${ketuHouse ?? 'unknown'} (track karmic pivots).` : 'Nodal houses unavailable.'}\n` +
    `- **Guidance:** Align major initiations with ${MUHURTA_RULES.auspicious.yearly}.`;

  const seventhHouseSign = chart.houses?.[6];
  const tenthHouseSign = chart.houses?.[9];
  const secondHouseSign = chart.houses?.[1];
  const eleventhHouseSign = chart.houses?.[10];

  const lifeEvents = `**Life Event Indicators** (Bhrigu/Nadi timing rules):\n\n` +
    `- **Marriage/Partnership:** ${GENERAL_TIMING_RULES.marriage}\n` +
    `- **Career Shifts:** ${GENERAL_TIMING_RULES.career}\n` +
    `- **Financial Gains:** ${GENERAL_TIMING_RULES.finance}\n` +
    `- **Health Alerts:** ${GENERAL_TIMING_RULES.health}\n` +
    `\n**Chart Checks:**\n` +
    `- 7th house sign: ${seventhHouseSign ? toTitleCase(seventhHouseSign) : 'Unknown'} (review Venus/Jupiter strengths)\n` +
    `- 10th house sign: ${tenthHouseSign ? toTitleCase(tenthHouseSign) : 'Unknown'}${planetHouses.Saturn ? `; Saturn in house ${planetHouses.Saturn}` : ''}\n` +
    `- 2nd/11th house signs: ${secondHouseSign ? toTitleCase(secondHouseSign) : 'Unknown'} / ${eleventhHouseSign ? toTitleCase(eleventhHouseSign) : 'Unknown'}${planetHouses.Jupiter ? `; Jupiter in house ${planetHouses.Jupiter}` : ''}`;

  const precision = `**Precision Check (Phase 2 Validation)**:\n\n` +
    `- **Hora Validation:** ${hora.planet} hora confirms focus on ${PLANET_ENERGIES[hora.planet]}.\n` +
    `- **Tithi Validation:** Tithi ${lunarDetails.tithi} favors ${lunarDetails.paksha === 'Waxing (Shukla Paksha)' ? 'growth' : 'closure'}.\n` +
    `- **Rahu Kala Window:** ${formatTime(rahuKala.start, locale)}-${formatTime(rahuKala.end, locale)}${rahuKala.active ? ' (active)' : ''}.\n` +
    `- **Monthly Precision:** ${PRECISION_METHODS.month_level}.\n` +
    `- **Weekly Precision:** ${PRECISION_METHODS.week_level}.\n` +
    `- **Daily Precision:** ${PRECISION_METHODS.day_level}.`;

  const result: PredictionResult = {
    engine: 'predictions',
    title: 'General Predictions',
    success: true,
    subcategories: {
      daily: { title: 'Daily Predictions', content: daily },
      weekly: { title: 'Weekly Predictions', content: weekly },
      monthly: { title: 'Monthly Predictions', content: monthly },
      yearly: { title: 'Yearly Predictions', content: yearly },
      life_events: { title: 'Life Event Indicators', content: lifeEvents },
      precision_check: { title: 'Precision Check', content: precision },
      data_quality: {
        title: 'Data Quality Notes',
        content: qualityNotes.length ? qualityNotes.join('\n') : 'All key chart anchors present.',
      },
    },
    metadata: {
      engine: 'predictions',
      zodiac_sign: zodiac,
      moon_sign: moonSign,
      ascendant,
      nakshatra,
      ai_enhanced: false,
      tradition: 'Bhrigu Samhita & Nadi Jyotisa',
      calculation_method: 'Two-phase offline engine with hora/tithi checks',
    },
    generated_at: now.toISOString(),
    mode: 'offline',
  };

  predictionCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
};
