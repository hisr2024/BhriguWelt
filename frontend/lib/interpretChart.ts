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

function describeElementBalance(chart: NatalChart) {
  const counts: Record<"Fire" | "Earth" | "Air" | "Water", number> = {
    Fire: 0,
    Earth: 0,
    Air: 0,
    Water: 0,
  };

  const register = (sign: string | undefined) => {
    if (!sign) return;
    const element = SIGN_ELEMENTS[sign];
    if (element) counts[element] += 1;
  };

  register(chart.chart.ascendant.sign);
  chart.chart.planets.forEach((planet) => register(planet.sign));

  const dominant = Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
  const balanceLine = `Elements tally — Fire: ${counts.Fire}, Earth: ${counts.Earth}, Air: ${counts.Air}, Water: ${counts.Water}.`;
  const tone =
    dominant === "Fire"
      ? "Drive and enthusiasm benefit from pacing and reflection."
      : dominant === "Earth"
        ? "Practical steadiness thrives alongside flexibility."
        : dominant === "Air"
          ? "Ideas and connections expand when grounded in lived experience."
          : "Sensitivity and empathy flourish with clear boundaries.";

  return `${balanceLine} Most active tone: ${dominant}. ${tone}`;
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
    `${formatHeading("Element Balance")}\n${describeElementBalance(chart)}`,
    `${formatHeading("Strengths & Challenges")}\n${describeStrengthsChallenges(chart, isMinor, userQuestion)}`,
  ];

  if (!isMinor) {
    sections.push(`${formatHeading("Symbolic Past-Life Insight")}\n${describeSymbolicPast(chart)}`);
    sections.push(`${formatHeading("Symbolic Future Direction")}\n${describeSymbolicFuture(chart)}`);
  }

  return sections.join("\n\n");
}
