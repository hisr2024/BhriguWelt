import { BirthDetails, CalendarDetails, PredictionEngine, ResultEngine } from "@/types/astro";
import type { AnalyticsSnapshot } from "@/lib/analytics";
import { FeedbackRequest, QuarterlySummaryResponse } from "@/types/feedback";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";
const BACKEND_FALLBACK_URL = process.env.NEXT_PUBLIC_BACKEND_FALLBACK_URL || "";
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN?.trim() || "";
const BACKEND_HOSTS = Array.from(
  new Set(
    [BACKEND_URL, BACKEND_FALLBACK_URL]
      .map((value) => value?.trim())
      .filter(Boolean)
      .map((value) => value.replace(/\/$/, "")),
  ),
);

function isBrowserOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function hasBackendHostConfigured() {
  return BACKEND_HOSTS.length > 0;
}

let loggedDemoFallback = false;
export type HealthResponse = {
  status?: string;
  source?: string;
  ml?: unknown;
  data?: { principles_loaded?: number };
  ai_provider_metadata?: {
    configured?: boolean;
    provider?: string;
    api_base?: string;
  };
  meta?: { mode?: "live" | "demo"; attempted_hosts?: string[] };
};

type DetailedError = Error & { hint?: string; status?: number };

const FALLBACK_HOROSCOPE = {
    name: "Fallback seeker",
    interpretation: "Bhrigu folios speak of a seeker whose service-oriented Mars and calm moon weave compassion with steady leadership.",
    interpretation_hi: "भृगु पांडुलिपि बताती है कि सेवा प्रधान मंगल और शांत चंद्रमा करुणा के साथ स्थिर नेतृत्व देते हैं।",
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
    rashi_chart: [
      { index: 1, sign: "Aries", occupants: ["Asc"], bhrigu_notes: ["Infrastructural Success activated (1.08)"] },
      { index: 2, sign: "Taurus", occupants: ["Venus"], bhrigu_notes: ["Scholarly Pursuits activated (0.76)"] },
      { index: 3, sign: "Gemini", occupants: ["Mercury"], bhrigu_notes: [] },
      { index: 4, sign: "Cancer", occupants: ["Moon"], bhrigu_notes: [] },
      { index: 5, sign: "Leo", occupants: ["Sun"], bhrigu_notes: [] },
      { index: 6, sign: "Virgo", occupants: ["Saturn"], bhrigu_notes: [] },
      { index: 7, sign: "Libra", occupants: ["Mars"], bhrigu_notes: [] },
      { index: 8, sign: "Scorpio", occupants: ["Ketu"], bhrigu_notes: [] },
      { index: 9, sign: "Sagittarius", occupants: ["Jupiter"], bhrigu_notes: [] },
      { index: 10, sign: "Capricorn", occupants: ["Rahu"], bhrigu_notes: [] },
      { index: 11, sign: "Aquarius", occupants: ["—"], bhrigu_notes: [] },
      { index: 12, sign: "Pisces", occupants: ["—"], bhrigu_notes: [] },
    ],
    bhava_chart: [
      { index: 1, sign: "Taurus", occupants: ["Asc"], bhrigu_notes: ["Infrastructural Success activated (1.08)"] },
      { index: 2, sign: "Gemini", occupants: ["Venus"], bhrigu_notes: ["Scholarly Pursuits activated (0.76)"] },
      { index: 3, sign: "Cancer", occupants: ["Mercury"], bhrigu_notes: [] },
      { index: 4, sign: "Leo", occupants: ["Moon"], bhrigu_notes: [] },
      { index: 5, sign: "Virgo", occupants: ["Sun"], bhrigu_notes: [] },
      { index: 6, sign: "Libra", occupants: ["Saturn"], bhrigu_notes: [] },
      { index: 7, sign: "Scorpio", occupants: ["Mars"], bhrigu_notes: [] },
      { index: 8, sign: "Sagittarius", occupants: ["Ketu"], bhrigu_notes: [] },
      { index: 9, sign: "Capricorn", occupants: ["Jupiter"], bhrigu_notes: [] },
      { index: 10, sign: "Aquarius", occupants: ["Rahu"], bhrigu_notes: [] },
      { index: 11, sign: "Pisces", occupants: ["—"], bhrigu_notes: [] },
      { index: 12, sign: "Aries", occupants: ["—"], bhrigu_notes: [] },
    ],
    dashas: [
      { lord: "Ketu", start: "2000-01-01", end: "2007-12-30", anchor_rule: "Infrastructural Success activated (1.08)" },
      { lord: "Venus", start: "2007-12-30", end: "2027-12-22", anchor_rule: "Scholarly Pursuits activated (0.76)" },
      { lord: "Sun", start: "2027-12-22", end: "2033-12-20", anchor_rule: "Ancestral Calling activated (0.92)" },
  ],
};

const FALLBACK_PAST_LIFE = {
  name: "Fallback seeker",
  interpretation: "Earlier lifetimes show healing work along sacred rivers with vows that continue into this birth.",
  interpretation_hi: "पूर्व जन्मों में पवित्र नदियों के किनारे चिकित्सा सेवा की प्रतिज्ञा दिखती है जो इस जन्म में भी जारी है।",
  insights: [
    {
      engine_id: "PL-DEMO",
      sutra_reference: "Sharada bundle demo",
      narrative: "The seeker served as a healer along the Narmada and returns to continue medical seva.",
      confidence: 0.82,
    },
  ],
};

const FALLBACK_FUTURE = {
  name: "Fallback seeker",
  interpretation: "The folios point toward disciplined study, community mentorship, and health rituals over the coming decades.",
  interpretation_hi: "आने वाले दशकों में अनुशासित अध्ययन, समुदाय का मार्गदर्शन और स्वास्थ्य अनुष्ठान प्राथमिक हैं।",
  trajectories: [
    {
      engine_id: "FU-DEMO",
      sutra_reference: "Pune folio demo",
      focus: "Multi-decade leadership on smart-city logistics with ancestral blessings.",
      window: "Years 28-52",
      certainty: 0.8,
    },
  ],
};

const FALLBACK_CORE_WISDOM = {
  sections: {
    "1": "Restatement of User Query & Birth Data: Fallback seeker. Birth: 1995-08-18 at 06:30 in Jaipur, Bharat. Focus areas: general life balance.",
    "2": "Disclaimer & Orientation: This is a Bhrigu Samhita–inspired spiritual reading. It offers tendencies, not certainties, and is not medical, legal, or financial advice.",
    "3": "Birth Chart Overview: Karmic epoch — Bhrigu epoch: activation of Mars mandates for infrastructural service. Dominant currents include intuitive dreams, infrastructural success, and ancestral calling with manuscript-backed interpretation.",
    "4": "Detailed Life Area Analysis: Strengths — intuitive dreams, infrastructural success. Challenges — balancing intuition with action. Key remedies from the folios: Light a copper lamp at dawn while reciting Om Brighave Namah to stabilize mind and memory.",
    "5": "Time-Based Future Tendencies: Multi-decade leadership on smart-city logistics with ancestral blessings.",
    "6": "Consolidated Strengths, Challenges & Cautions: Strengths — intuitive dreams, infrastructural success. Challenges — guarding energy leaks. Cautions — honor pacing and protect focus during intense transit windows.",
    "7": "Bhrigu-Style Guidance & Remedies: Keep discipline steady, prioritize service rituals, and maintain a dawn lamp practice.",
    "8": "Closing & Reminder of Free Will: Tendencies guide you, but choices shape outcomes. Take what resonates, leave the rest, and proceed with compassion.",
  },
  rashi_chart: FALLBACK_HOROSCOPE.rashi_chart,
  bhava_chart: FALLBACK_HOROSCOPE.bhava_chart,
  dashas: FALLBACK_HOROSCOPE.dashas,
  karmic_epoch: FALLBACK_HOROSCOPE.karmic_epoch,
  remedies: FALLBACK_HOROSCOPE.remedies,
  charts: {
    rashi_chart: FALLBACK_HOROSCOPE.rashi_chart,
    bhava_chart: FALLBACK_HOROSCOPE.bhava_chart,
  },
};

const FALLBACK_TIMELINE = {
  updated_at: "2024-06-01",
  phases: [
    {
      id: "phase-1",
      title: "Ascendant grounding",
      window: "Phase 1 • Weeks 1-6",
      house: 1,
      detail: "Anchor identity, routines, and body vitality as the ascendant stabilizes.",
      progress: 42,
      planet: "Sun",
      icon: "☉",
      milestones: [
        { label: "Morning ritual cadence", completion: 55, note: "Set sunrise start times and breathwork." },
        { label: "Body vitality audit", completion: 38, note: "Track sleep, hydration, and stamina markers." },
      ],
      reminders_url: "/calendar",
    },
    {
      id: "phase-2",
      title: "Resource harmonics",
      window: "Phase 2 • Months 2-4",
      house: 2,
      detail: "Balance wealth flow, family responsibilities, and speech alignment.",
      progress: 58,
      planet: "Venus",
      icon: "♀",
      milestones: [
        { label: "Savings buffer", completion: 62, note: "Allocate steady reserves for 90 days." },
        { label: "Family cadence check-in", completion: 46, note: "Schedule key family conversations." },
      ],
      reminders_url: "/calendar",
    },
    {
      id: "phase-3",
      title: "Learning pilgrimages",
      window: "Phase 3 • Months 4-7",
      house: 5,
      detail: "Reignite study, creativity, and mentoring aligned to the 5th house.",
      progress: 36,
      planet: "Jupiter",
      icon: "♃",
      milestones: [
        { label: "Course enrollment", completion: 40, note: "Commit to a focused learning track." },
        { label: "Mentor outreach", completion: 32, note: "Identify a teacher and book sessions." },
      ],
      reminders_url: "/calendar",
    },
    {
      id: "phase-4",
      title: "Partnership vows",
      window: "Phase 4 • Months 7-10",
      house: 7,
      detail: "Clarify collaboration agreements and strengthen harmony in alliances.",
      progress: 24,
      planet: "Moon",
      icon: "☾",
      milestones: [
        { label: "Collaborator sync", completion: 22, note: "Define meeting rhythm and shared KPIs." },
        { label: "Shared ritual calendar", completion: 28, note: "Plan shared check-ins for key dates." },
      ],
      reminders_url: "/calendar",
    },
    {
      id: "phase-5",
      title: "Dharma expansion",
      window: "Phase 5 • Months 10-12",
      house: 9,
      detail: "Prepare for travel, publishing, and philosophical commitments.",
      progress: 12,
      planet: "Mars",
      icon: "♂",
      milestones: [
        { label: "Travel blueprint", completion: 10, note: "Outline retreats or pilgrimages." },
        { label: "Teaching outline", completion: 18, note: "Draft a syllabus or public offering." },
      ],
      reminders_url: "/calendar",
    },
  ],
};

const FALLBACK_RESPONSES: Record<string, unknown> = {
  "/horoscope": FALLBACK_HOROSCOPE,
  "/karmic-dashboard": {
    sections: {
      "Karmic Overview": "A reset moment calls for steadier routines and compassionate boundaries.",
      "Release Cycle": "Lighten obligations tied to outdated expectations and focus on restorative rituals.",
      "Renewal Focus": "Strengthen daily discipline with sunrise journaling and breath-centered practices.",
    },
    hotspots: [
      {
        title: "Relationship karma",
        description: "Clarify expectations before offering commitments.",
        action: "Hold a weekly check-in ritual.",
      },
      {
        title: "Work-life balance",
        description: "Rebalance energy outflow with grounded nourishment.",
        action: "Protect two evenings for rest.",
      },
    ],
    gifts: [
      {
        title: "Ancestral support",
        description: "Elders offer guidance when approached with humility.",
        action: "Offer gratitude on Fridays.",
      },
    ],
    active_themes: ["Service-driven leadership", "Boundary setting", "Grounded wellness"],
    assignments: [
      "Begin a sunrise grounding ritual for 14 days.",
      "Declutter one space each week to lighten karmic load.",
      "Schedule a devotion practice with water offerings.",
    ],
    rashi_chart: FALLBACK_HOROSCOPE.rashi_chart,
    bhava_chart: FALLBACK_HOROSCOPE.bhava_chart,
    dashas: FALLBACK_HOROSCOPE.dashas,
    karmic_epoch: FALLBACK_HOROSCOPE.karmic_epoch,
  },
  "/experience-flow": {
    seeker: {
      name: "Fallback seeker",
      birth_date: "1995-08-18",
      birth_time: "06:30",
      birth_place: "Jaipur, Bharat",
      tradition: "universal",
    },
    horoscope: FALLBACK_HOROSCOPE,
    past_life: FALLBACK_PAST_LIFE,
    future: FALLBACK_FUTURE,
    timeline: FALLBACK_TIMELINE,
    matchmaking: null,
    analyzers: [
      { title: "Corpus validation", summary: "Bhrigu rules align with core chart placements." },
      { title: "Remedy readiness", summary: "Remedial steps are aligned with the lunar cycle." },
    ],
    interpretations: [
      { title: "Chart essence", summary: FALLBACK_HOROSCOPE.interpretation },
      { title: "Guidance arc", summary: FALLBACK_HOROSCOPE.karmic_epoch },
    ],
    briefings: [
      { title: "Experience tone", summary: "Calm, steady, and supportive." },
      { title: "Next steps", summary: "Invite the seeker to reflect on one theme at a time." },
    ],
    ai_support: { configured: false, provider: "offline", api_base: "" },
    visuals: {
      flowchart_steps: [
        "Capture birth details → validate folios",
        "Generate horoscope, past-life, and future narratives",
        "Render charts and timelines for the seeker",
        "Deliver remedies with compassionate context",
      ],
      timelines: [
        { label: "Ascendant grounding", window: "Phase 1 • Weeks 1-6", intensity: 42, sutra_reference: "Demo folio" },
        { label: "Learning pilgrimages", window: "Phase 3 • Months 4-7", intensity: 36, sutra_reference: "Demo folio" },
      ],
      compatibility: null,
      charts: {
        rashi_chart: FALLBACK_HOROSCOPE.rashi_chart,
        bhava_chart: FALLBACK_HOROSCOPE.bhava_chart,
      },
    },
    language_layer: { tone: "gentle", accent: "bhrigu", primary_language: "en" },
  },
  "/core-wisdom": {
    ...FALLBACK_CORE_WISDOM,
  },
  "/past-future": {
    seeker: {
      name: "Fallback seeker",
      birth_date: "1995-08-18",
      birth_time: "06:30",
      birth_place: "Jaipur, Bharat",
      tradition: "universal",
    },
    past_life: FALLBACK_PAST_LIFE,
    future: FALLBACK_FUTURE,
    core_wisdom: FALLBACK_CORE_WISDOM,
    predictions: [],
    ai_summary:
      "Past-life echoes and future directives are connected here for a grounded, compassionate outlook.",
    ai_support: { configured: false, provider: "offline", api_base: "" },
  },
  "/past-life": FALLBACK_PAST_LIFE,
  "/future": FALLBACK_FUTURE,
  "/future-progress": {
    karmic_resolution: 62,
    milestones: [
      {
        house: 4,
        label: "Roots and rituals",
        completion: 72,
        planet: "Moon",
        icon: "☾",
      },
      {
        house: 9,
        label: "Dharma studies",
        completion: 48,
        planet: "Jupiter",
        icon: "♃",
      },
      {
        house: 7,
        label: "Partnership seva",
        completion: 35,
        planet: "Venus",
        icon: "♀",
      },
    ],
  },
  "/timeline": FALLBACK_TIMELINE,
  "/transits": {
    name: "Fallback seeker",
    interpretation: "Current transits emphasize steady pacing, boundary setting, and focus on restorative rituals.",
    directives: [
      {
        reference: "TR-11",
        influence: "Saturn transit emphasizes discipline and boundaries in daily routines.",
        certainty: 0.74,
        planet: "Saturn",
      },
      {
        reference: "TR-18",
        influence: "Jupiter transit uplifts study, mentorship, and expansion in dharmic duties.",
        certainty: 0.66,
        planet: "Jupiter",
      },
      {
        reference: "TR-22",
        influence: "Moon transit highlights emotional resets and nourishment cycles.",
        certainty: 0.58,
        planet: "Moon",
      },
    ],
  },
  "/matchmaking": {
    primary_name: "Fallback seeker",
    partner_name: "Partner seeker",
    interpretation: "Their gunas complement each other, encouraging devotion, learning, and purposeful travel together.",
    interpretation_hi: "दोनों के गुण एक-दूसरे को संतुलित करते हैं—भक्ति, अध्ययन और उद्देश्यपूर्ण यात्राएँ साथ मिलकर उभरती हैं।",
    sections: {
      1: "Couple data — Fallback seeker & Partner seeker with demo preferences.",
      2: "Symbolic Bhrigu-style guidance only; use with mutual respect.",
      3: "Snapshots highlight steady Venus energy blended with adaptive Mercury for both charts.",
      4: "Ashta Koota synthesis leans harmonious; conceptual score near 30/36.",
      5: "Dimensional compatibility — emotional 82% • spiritual 78% • communication 80%.",
      6: "Risks: pacing differences; Balancing: shared study and travel soften frictions.",
      7: "Guidance: weekly check-ins, joint seva, and transparent finances.",
      8: "Free will first — take what resonates and co-create the path.",
    },
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
    modern_preferences: ["remote-first", "research-partnership"],
    charts: {
      primary_rashi_chart: [
        { index: 1, sign: "Aries", occupants: ["Asc"], bhrigu_notes: ["Fire dashas favor initiative"] },
        { index: 2, sign: "Taurus", occupants: ["Venus"], bhrigu_notes: ["Steady values" ] },
        { index: 3, sign: "Gemini", occupants: ["Mercury"], bhrigu_notes: [] },
        { index: 4, sign: "Cancer", occupants: ["Moon"], bhrigu_notes: [] },
        { index: 5, sign: "Leo", occupants: ["Sun"], bhrigu_notes: [] },
        { index: 6, sign: "Virgo", occupants: ["Saturn"], bhrigu_notes: [] },
        { index: 7, sign: "Libra", occupants: ["Mars"], bhrigu_notes: [] },
        { index: 8, sign: "Scorpio", occupants: ["Ketu"], bhrigu_notes: [] },
        { index: 9, sign: "Sagittarius", occupants: ["Jupiter"], bhrigu_notes: [] },
        { index: 10, sign: "Capricorn", occupants: ["Rahu"], bhrigu_notes: [] },
        { index: 11, sign: "Aquarius", occupants: ["—"], bhrigu_notes: [] },
        { index: 12, sign: "Pisces", occupants: ["—"], bhrigu_notes: [] },
      ],
      partner_rashi_chart: [
        { index: 1, sign: "Libra", occupants: ["Asc"], bhrigu_notes: ["Air dashas favor partnerships"] },
        { index: 2, sign: "Scorpio", occupants: ["Venus"], bhrigu_notes: ["Depth in research"] },
        { index: 3, sign: "Sagittarius", occupants: ["Mercury"], bhrigu_notes: [] },
        { index: 4, sign: "Capricorn", occupants: ["Moon"], bhrigu_notes: [] },
        { index: 5, sign: "Aquarius", occupants: ["Sun"], bhrigu_notes: [] },
        { index: 6, sign: "Pisces", occupants: ["Saturn"], bhrigu_notes: [] },
        { index: 7, sign: "Aries", occupants: ["Mars"], bhrigu_notes: [] },
        { index: 8, sign: "Taurus", occupants: ["Ketu"], bhrigu_notes: [] },
        { index: 9, sign: "Gemini", occupants: ["Jupiter"], bhrigu_notes: [] },
        { index: 10, sign: "Cancer", occupants: ["Rahu"], bhrigu_notes: [] },
        { index: 11, sign: "Leo", occupants: ["—"], bhrigu_notes: [] },
        { index: 12, sign: "Virgo", occupants: ["—"], bhrigu_notes: [] },
      ],
      shared_score: 88,
      synastry_overlay: [
        { label: "Creative flow", alignment: 82, tags: ["remote-first"] },
        { label: "Research stamina", alignment: 91, tags: ["research-partnership", "learning"] },
        { label: "Travel cadence", alignment: 76, tags: ["purposeful travel"] },
      ],
    },
  },
  "/calendar": {
    birth_date: "1995-05-18",
    birth_time: "14:45",
    birth_place: "Varanasi",
    interpretation: "Gregorian details have been aligned to the Śaka calendar so remedies follow the correct lunar rhythm.",
    interpretation_hi: "ग्रेगोरियन विवरण शक पंचांग से जोड़े गए हैं ताकि उपाय सही चंद्र लय में रहें।",
    saka_date: {
      year: 1917,
      month: "Jyaishtha",
      month_index: 3,
      day: 28,
      leap_year: false,
    },
    conversion_factor_years: 78,
    ist_reference_longitude: 82.5,
    nakshatra: "Rohini",
    yoga: "Sukarma",
    karana: "Balava",
    tithi_name: "Shukla 12",
    sources: [
      "Government of India Calendar Reform Committee Report (1955)",
      "Surya Siddhanta translation by Bapu Deva Sastri (Calcutta, 1860)",
    ],
  },
  "/feedback/quarterly": {
    quarters: [
      {
        label: "2024 Q2",
        average_rating: 4.6,
        submissions: 18,
        promoters: 15,
        recent_notes: [
          { seeker_name: "Asha", rating: 5, notes: "Remedies were precise and actionable", created_at: "2024-05-14" },
          { seeker_name: "Kabir", rating: 4, notes: "Charts matched my lived timeline", created_at: "2024-04-28" },
        ],
      },
      {
        label: "2024 Q1",
        average_rating: 4.3,
        submissions: 11,
        promoters: 8,
        recent_notes: [
          { seeker_name: "Meera", rating: 5, notes: "Future focus areas aligned with my mentors", created_at: "2024-02-10" },
        ],
      },
    ],
  },
};

export type FallbackPath =
  | "/horoscope"
  | "/past-life"
  | "/future"
  | "/past-future"
  | "/matchmaking"
  | "/calendar"
  | "/karmic-dashboard";

export function getFallbackSample(path: FallbackPath) {
  const sample = FALLBACK_RESPONSES[path];
  if (!sample || typeof sample !== "object") return null;
  return sample as Record<string, unknown>;
}

export function getPredictionFallback(engine: ResultEngine) {
  const pathMap: Record<ResultEngine, FallbackPath | null> = {
    horoscope: "/horoscope",
    "past-life": "/past-life",
    future: "/future",
    "past-future": "/past-future",
    matchmaking: "/matchmaking",
    calendar: "/calendar",
    "karmic-dashboard": "/karmic-dashboard",
  };

  const path = pathMap[engine];
  if (!path) return null;

  return getFallbackSample(path);
}

type FetchOptions<T> = {
  path: string;
  body: T;
};

export type FutureProgressResponse = {
  karmic_resolution: number;
  milestones: {
    house: number;
    label: string;
    completion: number;
    planet: string;
    icon?: string;
}[];
};

async function fetchFromHosts(path: string, init?: RequestInit) {
  if (isBrowserOffline()) {
    throw new Error("Offline mode detected; using cached demo responses.");
  }

  if (!hasBackendHostConfigured()) {
    throw new Error("No backend hosts configured. Set NEXT_PUBLIC_BACKEND_URL to your API endpoint.");
  }

  const errors: string[] = [];
  for (const host of BACKEND_HOSTS) {
    const target = `${host}${path}`;
    try {
      const response = await fetch(target, init);
      if (!response.ok) {
        const message = await response.text();
        errors.push(message || `${target} responded with ${response.status}`);
        continue;
      }
      return response;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const errorMessage = errors.length
    ? errors.join(" | ")
    : "No backend hosts configured. Set NEXT_PUBLIC_BACKEND_URL to your API endpoint.";
  throw new Error(errorMessage);
}

function normalizeBackendError(message: string, status: number): DetailedError {
  try {
    const parsed = JSON.parse(message);
    if (parsed?.message) {
      const error = new Error(parsed.message) as DetailedError;
      error.hint = parsed.details?.hint;
      error.status = status;
      return error;
    }
  } catch {
    // fall through to plain text handling
  }
  const error = new Error(message || `Backend responded with ${status}`) as DetailedError;
  error.status = status;
  return error;
}

async function postWithRichErrors<TResponse>(path: string, body: Record<string, unknown>) {
  let lastError: DetailedError | Error | null = null;
  if (isBrowserOffline()) {
    const offlineError = new Error("Offline mode detected; skipping backend sync.") as DetailedError;
    offlineError.hint = "Reconnect and resubmit to sync your profile.";
    throw offlineError;
  }

  if (!hasBackendHostConfigured()) {
    throw new Error(
      "No backend hosts configured. Set NEXT_PUBLIC_BACKEND_URL (or NEXT_PUBLIC_BACKEND_FALLBACK_URL) to your API endpoint.",
    );
  }

  for (const host of BACKEND_HOSTS) {
    const url = `${host}${path}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        lastError = normalizeBackendError(text, response.status);
        continue;
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (lastError) throw lastError;
  throw new Error(`Unable to reach backend for ${path}`);
}

function fallbackHealth(): HealthResponse {
  const horoscope = FALLBACK_RESPONSES["/horoscope"] as { principles?: unknown[] } | undefined;
  const principlesLoaded = Array.isArray(horoscope?.principles) ? horoscope.principles.length : undefined;
  return {
    status: "ok",
    source: "Bhrigu Samhita (demo cache)",
    data: principlesLoaded ? { principles_loaded: principlesLoaded } : undefined,
    ai_provider_metadata: { configured: false, provider: "unconfigured", api_base: "" },
    meta: { mode: "demo", attempted_hosts: BACKEND_HOSTS },
  };
}

function mapBirthDetails(
  input: BirthDetails,
  options?: {
    consentForDatePredictions?: boolean;
  },
) {
  return {
    name: input.name.trim(),
    birth_date: input.birthDate,
    birth_time: input.birthTime,
    birth_place: input.birthPlace.trim(),
    tradition: (input.tradition || "universal").toLowerCase(),
    lunar_tithi: Number(input.lunarTithi) || 1,
    moon_element: input.moonElement,
    mars_house: Number(input.marsHouse) || 1,
    saturn_house: Number(input.saturnHouse) || 1,
    venus_house: Number(input.venusHouse) || 1,
    rahu_aspects_ascendant: input.rahuAspectsAscendant,
    ketu_house: Number(input.ketuHouse || 0),
    mercury_house: Number(input.mercuryHouse || 0),
    jupiter_house: Number(input.jupiterHouse || 0),
    saturn_retrograde: Boolean(input.saturnRetrograde),
    ...(options?.consentForDatePredictions ? { consent_for_date_predictions: true } : {}),
  };
}

function mapCalendarDetails(input: CalendarDetails) {
  return {
    birth_date: input.birthDate,
    birth_time: input.birthTime,
    birth_place: input.birthPlace.trim(),
  };
}

async function getJson<TResponse>(path: string, fallbackKey?: string) {
  const fallback = fallbackKey ? FALLBACK_RESPONSES[fallbackKey] : undefined;

  try {
    const response = await fetchFromHosts(path);
    return (await response.json()) as TResponse;
  } catch (networkError) {
    if (fallback) {
      console.warn(`Using offline Bhrigu fallback for ${path}`, networkError);
      return fallback as TResponse;
    }
    throw networkError;
  }
}

async function getJsonWithHeaders<TResponse>(path: string, headers?: Record<string, string>) {
  const response = await fetchFromHosts(path, headers ? { headers } : undefined);
  return (await response.json()) as TResponse;
}

async function postJson<TResponse, TBody>({ path, body }: FetchOptions<TBody>) {
  const fallback = FALLBACK_RESPONSES[path];

  const errors: (Error | DetailedError)[] = [];

  for (const host of BACKEND_HOSTS) {
    const url = `${host}${path}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        errors.push(normalizeBackendError(text, response.status));
        continue;
      }

      try {
        return (await response.json()) as TResponse;
      } catch (parseError) {
        errors.push(parseError instanceof Error ? parseError : new Error(String(parseError)));
        continue;
      }
    } catch (networkError) {
      errors.push(networkError instanceof Error ? networkError : new Error(String(networkError)));
    }
  }

  if (fallback) {
    console.warn(`Using offline Bhrigu fallback for ${path}`, errors[errors.length - 1]);
    if (!loggedDemoFallback) {
      loggedDemoFallback = true;
    }
    return fallback as TResponse;
  }

  if (errors.length) throw errors[errors.length - 1];
  throw new Error(`Unable to reach the Bhrigu backend at ${BACKEND_HOSTS.join(", ") || BACKEND_URL || "(not configured)"}${path}`);
}

export async function requestPrediction(engine: PredictionEngine, details: BirthDetails) {
  const path = `/${engine}`;
  const consentForDatePredictions = engine === "future" || engine === "past-future";
  return postJson({ path, body: mapBirthDetails(details, { consentForDatePredictions }) });
}

export async function requestExperienceFlow(
  details: BirthDetails,
  options?: {
    language?: string;
    tone?: string;
    culturalSensitivity?: string;
    modernPreferences?: string[];
    partner?: BirthDetails;
  },
) {
  const payload: Record<string, unknown> = {
    ...mapBirthDetails(details, { consentForDatePredictions: true }),
    ...(options?.language ? { language: options.language } : {}),
    ...(options?.tone ? { tone: options.tone } : {}),
    ...(options?.culturalSensitivity ? { cultural_sensitivity: options.culturalSensitivity } : {}),
  };

  if (options?.modernPreferences?.length) {
    payload.modern_preferences = options.modernPreferences;
  }
  if (options?.partner) {
    payload.partner = mapBirthDetails(options.partner);
  }

  return postJson({ path: "/experience-flow", body: payload });
}

export async function requestCoreWisdom(details: BirthDetails, focusAreas?: string[]) {
  const payload = {
    ...mapBirthDetails(details),
    ...(focusAreas?.length ? { focus_areas: focusAreas } : {}),
  };
  return postJson({ path: "/core-wisdom", body: payload });
}

export async function requestTransits(
  details: BirthDetails,
  transit: { transitDate: string; transitTime: string; timezone?: string },
) {
  const transitPayload = {
    transit_date: transit.transitDate,
    transit_time: transit.transitTime,
    ...(transit.timezone ? { timezone: transit.timezone } : {}),
  };
  return postJson({
    path: "/transits",
    body: {
      natal: mapBirthDetails(details),
      transit: transitPayload,
    },
  });
}

export async function getFutureProgress() {
  return getJson<FutureProgressResponse>("/future-progress", "/future-progress");
}

export async function requestTimeline(details: BirthDetails, focusAreas?: string[]) {
  const payload = {
    ...mapBirthDetails(details),
    ...(focusAreas?.length ? { focus_areas: focusAreas } : {}),
  };
  return postJson({ path: "/timeline", body: payload });
}

export async function requestVarshaphal(
  details: BirthDetails,
  options?: {
    year?: number | string;
    focus?: string;
  },
) {
  const payload = {
    ...mapBirthDetails(details),
    ...(options?.year ? { target_year: String(options.year) } : {}),
    ...(options?.focus ? { main_focus: options.focus } : {}),
  };
  return postJson({ path: "/varshaphal", body: payload });
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

export async function submitAccuracyFeedback(feedback: FeedbackRequest) {
  return postJson({
    path: "/feedback",
    body: {
      engine: feedback.engine,
      rating: feedback.rating,
      seeker_name: feedback.seekerName,
      notes: feedback.notes?.trim(),
      inputs: feedback.inputs,
    },
  });
}

export async function fetchQuarterlyReviews() {
  return getJson<QuarterlySummaryResponse>("/feedback/quarterly", "/feedback/quarterly");
}

export async function fetchAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const headers = ADMIN_TOKEN ? { "X-Admin-Token": ADMIN_TOKEN } : undefined;
  return getJsonWithHeaders<AnalyticsSnapshot>("/analytics", headers);
}

export async function fetchManuscript() {
  return getJson<Record<string, unknown>>("/manuscript");
}

export async function upsertProfile(
  payload: {
    user_id?: string;
    full_name?: string;
    date_of_birth?: string;
    time_of_birth?: string;
    place_of_birth?: string;
    timezone?: string;
    metadata?: Record<string, unknown>;
  },
  sessionKey?: string,
) {
  const basePayload = {
    ...payload,
    session_id: sessionKey,
    profile: payload,
  };
  return postWithRichErrors<{ id: number; user_id: string }>("/profiles", basePayload);
}

export async function fetchProfileSession(userId: string, sessionKey: string) {
  return postWithRichErrors<{
    profile?: Record<string, unknown>;
    alerts?: unknown[];
    session?: { transcript?: { role?: string; content?: string; remedies?: unknown[] }[] };
  }>("/profiles/get", {
    user_id: userId,
    session_id: sessionKey,
  });
}

export async function sendChatMessage(payload: {
  message: string;
  user_id?: string;
  profile_id?: number;
  session_id?: string;
  profile?: Record<string, unknown>;
}) {
  return postWithRichErrors<Record<string, unknown>>("/chat", payload);
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    if (isBrowserOffline() || !hasBackendHostConfigured()) {
      return fallbackHealth();
    }
    const response = await fetchFromHosts("/health");
    const payload = (await response.json()) as HealthResponse;
    return {
      ...payload,
      meta: { ...payload.meta, mode: "live" as const, attempted_hosts: BACKEND_HOSTS },
    };
  } catch (error) {
    console.warn("Falling back to cached demo responses for health check", error);
    return fallbackHealth();
  }
}
