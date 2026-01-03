import { NatalChart, Planet } from "@/types/natal";

const SIGN_ELEMENTS: Record<string, "Fire" | "Earth" | "Air" | "Water"> = {
  Aries: "Fire",
  Taurus: "Earth",
  Gemini: "Air",
  Cancer: "Water",
  Leo: "Fire",
  Virgo: "Earth",
  Libra: "Air",
  Scorpio: "Water",
  Sagittarius: "Fire",
  Capricorn: "Earth",
  Aquarius: "Air",
  Pisces: "Water",
};

export type ElementBalance = {
  fire: number;
  earth: number;
  air: number;
  water: number;
};

const SIGN_TONES: Record<string, string> = {
  Aries: "initiative and courage",
  Taurus: "steadiness and sensual appreciation",
  Gemini: "curiosity and lively exchange",
  Cancer: "nurturing sensitivity",
  Leo: "radiance and creative pride",
  Virgo: "discernment and service",
  Libra: "harmony-seeking diplomacy",
  Scorpio: "depth and transformative focus",
  Sagittarius: "visionary enthusiasm",
  Capricorn: "discipline and structure",
  Aquarius: "innovation and principled ideals",
  Pisces: "empathy and imagination",
};

type AspectCategory = "major" | "harmonic" | "micro";

type AspectDefinition = {
  name: string;
  angle: number;
  baseOrb: number;
  category: AspectCategory;
  keywords: string;
  precisionWeight?: number;
};

type AspectHit = {
  aspect: AspectDefinition;
  orb: number;
  tightness: number;
  planets: [Planet, Planet];
};

const ASPECT_DEFINITIONS: AspectDefinition[] = [
  { name: "Conjunction", angle: 0, baseOrb: 8, category: "major", keywords: "fusion and amplification" },
  { name: "Opposition", angle: 180, baseOrb: 8, category: "major", keywords: "polarized awareness and calibration" },
  { name: "Trine", angle: 120, baseOrb: 7, category: "major", keywords: "flow and easy resonance" },
  { name: "Square", angle: 90, baseOrb: 6, category: "major", keywords: "friction that sharpens growth" },
  { name: "Sextile", angle: 60, baseOrb: 5, category: "harmonic", keywords: "opportunities sparked by curiosity" },
  { name: "Quincunx", angle: 150, baseOrb: 3.4, category: "harmonic", keywords: "adjustments that demand creativity" },
  { name: "Semi-Square", angle: 45, baseOrb: 3.1, category: "harmonic", keywords: "minor friction that keeps momentum honest" },
  { name: "Sesquiquadrate", angle: 135, baseOrb: 3.1, category: "harmonic", keywords: "course corrections sparked by tension" },
  { name: "Semi-Sextile", angle: 30, baseOrb: 2.6, category: "micro", keywords: "small openings requiring attentive follow-through" },
  { name: "Quintile", angle: 72, baseOrb: 2.6, category: "micro", keywords: "creative talent with a precise craft", precisionWeight: 1.05 },
  { name: "Biquintile", angle: 144, baseOrb: 2.6, category: "micro", keywords: "refined artistry expressed collaboratively", precisionWeight: 1.05 },
  { name: "Semi-Quintile (Decile)", angle: 36, baseOrb: 2.1, category: "micro", keywords: "delicate inspiration that thrives on practice", precisionWeight: 0.95 },
  { name: "Tredecile", angle: 108, baseOrb: 1.9, category: "micro", keywords: "inventive pattern-making across unlikely domains" },
  { name: "Septile", angle: 51.43, baseOrb: 1.9, category: "micro", keywords: "intuitive leaps and mystical timing", precisionWeight: 0.95 },
  { name: "Biseptile", angle: 102.86, baseOrb: 1.7, category: "micro", keywords: "threshold decisions that reroute paths" },
  { name: "Triseptile", angle: 154.29, baseOrb: 1.5, category: "micro", keywords: "subtle course corrections guided by faith" },
  { name: "Novile", angle: 40, baseOrb: 1.4, category: "micro", keywords: "quiet devotion and contemplative focus" },
  { name: "Binovile", angle: 80, baseOrb: 1.4, category: "micro", keywords: "steady, meditative progress through repetition" },
];

function formatHeading(title: string) {
  return `### ${title}`;
}

function findPlanet(chart: NatalChart, name: string): Planet | undefined {
  return chart.chart.planets.find((planet) => planet.name.toLowerCase() === name.toLowerCase());
}

function describeAscendant(chart: NatalChart, isMinor?: boolean) {
  const { ascendant } = chart.chart;
  const tone = SIGN_TONES[ascendant.sign] ?? "personal focus";
  const base = `Ascendant in ${ascendant.sign} (${ascendant.degree}\u00b0) infuses the core identity with ${tone}.`;
  if (isMinor) {
    return `${base} Support gentle exploration so these traits feel safe to express.`;
  }
  return `${base} Life choices tend to feel meaningful when they honor this native style of being.`;
}

function describePlanetaryHighlights(chart: NatalChart, isMinor?: boolean) {
  const highlight = (planet?: Planet, quality?: string) => {
    if (!planet) return undefined;
    const retro = planet.retrograde ? " (moving in an introspective, retrograde rhythm)" : "";
    const base = `${planet.name} in ${planet.sign} (house ${planet.house}${retro})`;
    return quality ? `${base} leans toward ${quality}.` : `${base}.`;
  };

  const sun = highlight(findPlanet(chart, "Sun"), "vitality expressed through personal purpose");
  const moon = highlight(findPlanet(chart, "Moon"), isMinor ? "emotional attunement that benefits from consistent soothing" : "feelings seeking steady anchors");
  const mars = highlight(findPlanet(chart, "Mars"), "action that gains strength from clear outlets");
  const saturn = highlight(findPlanet(chart, "Saturn"), "discipline shaped by respectful boundaries");

  return [sun, moon, mars, saturn].filter(Boolean).join(" ");
}

function planetLongitude(planet: Planet): number {
  const signOrder = [
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
  const signIndex = signOrder.indexOf(planet.sign);
  return ((signIndex >= 0 ? signIndex : 0) * 30 + planet.degree) % 360;
}

type SpeedBand = "luminary" | "personal" | "social" | "node";

function planetSpeedBand(planet: Planet): SpeedBand {
  if (["Sun", "Moon"].includes(planet.name)) return "luminary";
  if (["Mercury", "Venus", "Mars"].includes(planet.name)) return "personal";
  if (["Jupiter", "Saturn"].includes(planet.name)) return "social";
  return "node";
}

function orbAllowance(aspect: AspectDefinition, a: Planet, b: Planet): number {
  const luminaryBonus = ["Sun", "Moon"].some((name) => name === a.name || name === b.name) ? 1 : 0;
  const retrogradeTightening = a.retrograde || b.retrograde ? -0.4 : 0;
  const categoryModifier = aspect.category === "micro" ? -0.4 : aspect.category === "harmonic" ? -0.2 : 0;

  const bandTightening: Record<SpeedBand, number> = { luminary: 1.08, personal: 0.98, social: 0.9, node: 0.88 };
  const bandFactor = Math.min(bandTightening[planetSpeedBand(a)], bandTightening[planetSpeedBand(b)]);
  const precision = aspect.precisionWeight ?? 1;

  const computed = (aspect.baseOrb + luminaryBonus + retrogradeTightening + categoryModifier) * precision * bandFactor;
  return Math.max(0.5, Number(computed.toFixed(2)));
}

function angularDifference(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function calculateAspects(planets: Planet[]): AspectHit[] {
  const results: AspectHit[] = [];

  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const p1 = planets[i];
      const p2 = planets[j];
      const long1 = planetLongitude(p1);
      const long2 = planetLongitude(p2);
      const separation = angularDifference(long1, long2);

      ASPECT_DEFINITIONS.forEach((aspect) => {
        const allowedOrb = orbAllowance(aspect, p1, p2);
        const delta = Math.abs(separation - aspect.angle);
        if (delta <= allowedOrb) {
          results.push({
            aspect,
            orb: Number(allowedOrb.toFixed(1)),
            tightness: Number(delta.toFixed(2)),
            planets: [p1, p2],
          });
        }
      });
    }
  }

  return results.sort((a, b) => {
    if (a.aspect.category === b.aspect.category) return a.tightness - b.tightness;
    const order: AspectCategory[] = ["major", "harmonic", "micro"];
    return order.indexOf(a.aspect.category) - order.indexOf(b.aspect.category);
  });
}

function describeAspectPatterns(chart: NatalChart) {
  const aspects = calculateAspects(chart.chart.planets);

  if (!aspects.length) {
    return "No tight inter-planetary aspects found within configured orbs. The chart expresses its signatures more through houses and elements.";
  }

  const summaries = aspects.slice(0, 8).map((hit) => {
    const [p1, p2] = hit.planets;
    const retrogradeCue = p1.retrograde || p2.retrograde ? " (introspective motion)" : "";
    return `- ${p1.name} ${hit.aspect.name.toLowerCase()} ${p2.name} (${hit.tightness}\u00b0 orb; ${hit.aspect.keywords}${retrogradeCue})`;
  });

  const microCount = aspects.filter((hit) => hit.aspect.category === "micro").length;
  const harmonicCount = aspects.filter((hit) => hit.aspect.category === "harmonic").length;
  const majorCount = aspects.filter((hit) => hit.aspect.category === "major").length;

  const headline = `Major (${majorCount}), harmonic (${harmonicCount}), and micro (${microCount}) aspects weave the chart's dynamics.`;

  return [headline, ...summaries].join("\n");
}

function describeHouseEmphasis(chart: NatalChart) {
  const modalityBuckets: Record<"angular" | "succedent" | "cadent", Planet[]> = {
    angular: [],
    succedent: [],
    cadent: [],
  };

  chart.chart.planets.forEach((planet) => {
    const house = planet.house;
    if ([1, 4, 7, 10].includes(house)) modalityBuckets.angular.push(planet);
    else if ([2, 5, 8, 11].includes(house)) modalityBuckets.succedent.push(planet);
    else modalityBuckets.cadent.push(planet);
  });

  const counts = {
    angular: modalityBuckets.angular.length,
    succedent: modalityBuckets.succedent.length,
    cadent: modalityBuckets.cadent.length,
  };

  const dominant = (Object.entries(counts) as [keyof typeof counts, number][]).sort(([, a], [, b]) => b - a)[0][0];

  const tone: Record<keyof typeof counts, string> = {
    angular: "action orientation and visibility", 
    succedent: "resource building and stabilization",
    cadent: "adaptability, study, and reflective transitions",
  };

  const notes = [
    `- Angular: ${counts.angular} (houses 1/4/7/10)`,
    `- Succedent: ${counts.succedent} (houses 2/5/8/11)`,
    `- Cadent: ${counts.cadent} (houses 3/6/9/12)`,
    `- Dominant zone: ${dominant} — ${tone[dominant]}`,
  ];

  return notes.join("\n");
}

function describeRahuKetu(chart: NatalChart, isMinor?: boolean) {
  const rahu = findPlanet(chart, "Rahu");
  const ketu = findPlanet(chart, "Ketu");
  if (!rahu || !ketu) {
    return "Axis of appetite and release flows through unseen nodes, inviting balanced curiosity and calm detachment.";
  }

  const tone = isMinor
    ? "These themes are gentle signposts, not fixed destinies."
    : "They frame karmic appetites and releases in a mythic sense, encouraging mindful balance.";

  return `Rahu in ${rahu.sign} (house ${rahu.house}) seeks new experiences, while Ketu in ${ketu.sign} (house ${ketu.house}) releases what feels over-familiar. ${tone}`;
}

export function getElementBalance(chart: NatalChart): ElementBalance {
  const counts: Record<keyof ElementBalance, number> = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  };

  chart.chart.planets.forEach((planet) => {
    const element = SIGN_ELEMENTS[planet.sign];
    if (element === "Fire") counts.fire += 1;
    if (element === "Earth") counts.earth += 1;
    if (element === "Air") counts.air += 1;
    if (element === "Water") counts.water += 1;
  });

  return counts;
}

function describeElementBalance(chart: NatalChart) {
  const counts = getElementBalance(chart);

  const dominantElement = (Object.entries(counts) as [keyof ElementBalance, number][]) // preserve key typing
    .sort(([, a], [, b]) => b - a)[0][0];

  const elementMeaning: Record<keyof ElementBalance, string> = {
    fire: "Drive and enthusiasm gain traction with mindful pacing.",
    earth: "Practical steadiness deepens when paired with adaptability.",
    air: "Curiosity and communication thrive when grounded in lived experience.",
    water: "Empathy and intuition flourish with clear emotional boundaries.",
  };

  const tallyLine = `- Fire: ${counts.fire}, Earth: ${counts.earth}, Air: ${counts.air}, Water: ${counts.water}`;
  const dominantLine = `- Dominant element: ${dominantElement[0].toUpperCase()}${dominantElement.slice(1)} — ${elementMeaning[dominantElement]}`;

  return `${tallyLine}\n${dominantLine}`;
}

function describeStrengthsChallenges(chart: NatalChart, isMinor?: boolean, userQuestion?: string) {
  const mars = findPlanet(chart, "Mars");
  const saturn = findPlanet(chart, "Saturn");
  const moon = findPlanet(chart, "Moon");

  const strengths: string[] = [];
  const challenges: string[] = [];

  if (mars) strengths.push(`Courage to act in ${mars.sign} (house ${mars.house}) can champion worthy causes.`);
  if (saturn) strengths.push(`Patience from Saturn in ${saturn.sign} (house ${saturn.house}) supports long projects.`);
  if (moon) strengths.push(`Moon in ${moon.sign} (house ${moon.house}) adds intuition and mood-awareness.`);

  if (mars) challenges.push(`Mars may feel restless without movement or creative outlets.`);
  if (saturn) challenges.push(`Saturn's caution can slow decisions until trust is built.`);
  if (moon) challenges.push(`Moon's tides shift; routines help emotions settle.`);

  const questionLine = userQuestion
    ? `In relation to your question—"${userQuestion}"—approach reflections as invitations rather than verdicts.`
    : undefined;

  const framing = isMinor
    ? "Caregivers can encourage strengths gently while normalizing the learning curve around challenges."
    : "Naming both helps choose habits and environments that honor the whole chart.";

  return `${strengths.join(" ")} ${challenges.join(" ")} ${framing}${questionLine ? ` ${questionLine}` : ""}`.trim();
}

function describeSymbolicPast(chart: NatalChart) {
  const rahu = findPlanet(chart, "Rahu");
  const ketu = findPlanet(chart, "Ketu");
  const anchor = ketu ? `${ketu.sign} themes feel familiar` : "Certain patterns feel long-practiced";
  const longing = rahu ? `${rahu.sign} curiosities feel fresh` : "New fascinations pull attention forward";
  return `${anchor}, as if mythic memories lean that way, while ${longing}. Consider these as reflective metaphors, not literal past lives.`;
}

function describeSymbolicFuture(chart: NatalChart) {
  const sun = findPlanet(chart, "Sun");
  const saturn = findPlanet(chart, "Saturn");
  const aim = sun ? `Following Sun in ${sun.sign} (house ${sun.house}) keeps purpose warm.` : "Following joy keeps purpose warm.";
  const craft = saturn ? `Saturn's placement in ${saturn.sign} favors steady craft and patient mastery.` : "Steady craft and patient mastery remain supportive.";
  return `${aim} ${craft} Treat these as poetic signposts for future direction, not fixed destiny.`;
}

export function interpretChart(params: { chart: NatalChart; userQuestion?: string; isMinor?: boolean }): string {
  const { chart, userQuestion, isMinor } = params;

  const disclaimer = "Note: These interpretations are symbolic and reflective, not fixed predictions.";

  const sections: string[] = [
    disclaimer,
    `${formatHeading("Ascendant & Core Identity")}\n${describeAscendant(chart, isMinor)}`,
    `${formatHeading("Planetary Highlights")}\n${describePlanetaryHighlights(chart, isMinor)}`,
    `${formatHeading("Rahu–Ketu Axis")}\n${describeRahuKetu(chart, isMinor)}`,
    `${formatHeading("House Emphasis & Angularity")}\n${describeHouseEmphasis(chart)}`,
    `${formatHeading("Element Balance")}\n${describeElementBalance(chart)}`,
    `${formatHeading("Aspect Dynamics")}\n${describeAspectPatterns(chart)}`,
    `${formatHeading("Strengths & Challenges")}\n${describeStrengthsChallenges(chart, isMinor, userQuestion)}`,
  ];

  if (!isMinor) {
    sections.push(`${formatHeading("Symbolic Past-Life Insight")}\n${describeSymbolicPast(chart)}`);
    sections.push(`${formatHeading("Symbolic Future Direction")}\n${describeSymbolicFuture(chart)}`);
  }

  return sections.join("\n\n");
}
