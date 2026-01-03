export type StaticHoroscope = {
  sign: string;
  title: string;
  element: string;
  focus: string;
  mantra: string;
  guidance: string;
  ritual: string;
  luckyColor: string;
};

export const horoscopeSigns = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

const HOROSCOPE_DATA: Record<string, StaticHoroscope> = {
  aries: {
    sign: "aries",
    title: "Aries",
    element: "Fire",
    focus: "Decisive leadership and clean starts.",
    mantra: "I lead with courage and clarity.",
    guidance: "Channel momentum into one bold priority, then protect your energy with a short pause ritual.",
    ritual: "Light a ghee diya at dawn and write down the one action that opens the day.",
    luckyColor: "Copper",
  },
  taurus: {
    sign: "taurus",
    title: "Taurus",
    element: "Earth",
    focus: "Grounding routines and steady wealth.",
    mantra: "I build patiently and protect my peace.",
    guidance: "Stabilize your calendar by choosing two supportive habits and keeping everything else optional.",
    ritual: "Touch fresh soil or a house plant while offering gratitude for steady support.",
    luckyColor: "Emerald",
  },
  gemini: {
    sign: "gemini",
    title: "Gemini",
    element: "Air",
    focus: "Curiosity and quick learning loops.",
    mantra: "I listen deeply and speak with intention.",
    guidance: "Keep conversations light but precise; one clear question brings more insight than ten quick updates.",
    ritual: "Write a single-page curiosity list and pick one thread to explore today.",
    luckyColor: "Citrine",
  },
  cancer: {
    sign: "cancer",
    title: "Cancer",
    element: "Water",
    focus: "Emotional nourishment and family bonds.",
    mantra: "I honor my feelings and hold safe space.",
    guidance: "Offer steady care without overextending—gentle boundaries keep your heart centered.",
    ritual: "Sip warm water with tulsi while recalling one supportive memory.",
    luckyColor: "Pearl",
  },
  leo: {
    sign: "leo",
    title: "Leo",
    element: "Fire",
    focus: "Creative visibility and pride in craft.",
    mantra: "I shine with generosity and humility.",
    guidance: "Lead a room by naming the shared intention before presenting your vision.",
    ritual: "Offer a sunflower or marigold at sunrise to energize your creative flow.",
    luckyColor: "Gold",
  },
  virgo: {
    sign: "virgo",
    title: "Virgo",
    element: "Earth",
    focus: "Refinement and service alignment.",
    mantra: "I refine with care and mindful precision.",
    guidance: "Audit your to-do list and keep only what directly improves quality or wellbeing.",
    ritual: "Tidy one surface and place a sandalwood drop on the wrist.",
    luckyColor: "Olive",
  },
  libra: {
    sign: "libra",
    title: "Libra",
    element: "Air",
    focus: "Harmony and collaborative balance.",
    mantra: "I choose balance without losing myself.",
    guidance: "Use honest mirrors—ask for one clear piece of feedback and respond with grace.",
    ritual: "Offer a white flower and set a two-minute breathing timer to reset alignment.",
    luckyColor: "Rose",
  },
  scorpio: {
    sign: "scorpio",
    title: "Scorpio",
    element: "Water",
    focus: "Depth work and transformational clarity.",
    mantra: "I transform with devotion and truth.",
    guidance: "Go beneath the surface—one courageous truth spoken today clears the emotional waters.",
    ritual: "Light a deep red candle and journal a single release statement.",
    luckyColor: "Garnet",
  },
  sagittarius: {
    sign: "sagittarius",
    title: "Sagittarius",
    element: "Fire",
    focus: "Exploration and visionary optimism.",
    mantra: "I trust the journey and stay grounded.",
    guidance: "Take one tangible step toward a long-term quest so the vision stays practical.",
    ritual: "Offer water to a basil plant and map a small adventure for the week.",
    luckyColor: "Indigo",
  },
  capricorn: {
    sign: "capricorn",
    title: "Capricorn",
    element: "Earth",
    focus: "Discipline, duty, and strategic wins.",
    mantra: "I honor my path with steady commitment.",
    guidance: "Choose one anchor task and complete it before new obligations arrive.",
    ritual: "Place a stone on your desk as a reminder of strength and patience.",
    luckyColor: "Charcoal",
  },
  aquarius: {
    sign: "aquarius",
    title: "Aquarius",
    element: "Air",
    focus: "Collective innovation and fresh ideas.",
    mantra: "I innovate with compassion and structure.",
    guidance: "Share your unusual insight with the right collaborator to make it real.",
    ritual: "Breathe deeply near a window and offer a short gratitude for your community.",
    luckyColor: "Turquoise",
  },
  pisces: {
    sign: "pisces",
    title: "Pisces",
    element: "Water",
    focus: "Intuition and soulful healing.",
    mantra: "I trust my intuition and rest well.",
    guidance: "Let creative rest replenish you—quiet time refuels the next compassionate action.",
    ritual: "Listen to a soft mantra and place your palm over the heart for 60 seconds.",
    luckyColor: "Lavender",
  },
};

export function getStaticHoroscope(sign: string): StaticHoroscope | null {
  const key = sign.toLowerCase();
  return HOROSCOPE_DATA[key] ?? null;
}
