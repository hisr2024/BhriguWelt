import { ChartHouse, DashaPeriod } from "@/types/astro";

export const rhythmTracks = [
  {
    title: "Himalayan dawn water",
    src: "https://cdn.pixabay.com/download/audio/2021/09/14/audio_f4a0a9d4a9.mp3?filename=calm-river-ambience-loop-6455.mp3",
    description: "Flowing water under faint temple bells and tanpura.",
  },
  {
    title: "Forest wind and chimes",
    src: "https://cdn.pixabay.com/download/audio/2022/08/26/audio_8bb3c5b7c1.mp3?filename=wind-chimes-11744.mp3",
    description: "Soft breeze, leaves, and subtle metal chimes for steady focus.",
  },
  {
    title: "Evening birds and altar",
    src: "https://cdn.pixabay.com/download/audio/2023/07/24/audio_24a3fd0f6b.mp3?filename=ambient-calm-15149.mp3",
    description: "Bird calls with distant temple bells, mixed at a gentle hush.",
  },
];

export const ritualCards = [
  {
    title: "Daily jyotish glance",
    body: "Capture date, time, and place without distraction. Let the reading surface instantly in English and Hindi.",
    action: "Check horoscope",
    href: "/horoscope",
  },
  {
    title: "Śaka calendar ready",
    body: "Convert Gregorian to Śaka quietly before sharing remedies or timings.",
    action: "Open converter",
    href: "#calendar-conversion",
  },
  {
    title: "Kindred matches",
    body: "Explore compatibility as a calm flow with factors, not noise.",
    action: "Start matchmaking",
    href: "#matchmaking",
  },
];

export const timelineNotes = [
  { label: "Dasha", value: "Venus → Sun", detail: "harmonising", tone: "sunrise" },
  { label: "Transit", value: "Saturn review", detail: "slow and steady", tone: "sand" },
  { label: "Remedy", value: "Sandal dhup", detail: "light daily", tone: "lotus" },
];

export const journeyTimeline = [
  {
    title: "Career pivot rituals",
    window: "Q4 2024",
    houseAnchor: "10th house",
    detail: "Lay foundations for new leadership roles with steady Saturn remedies and early mornings.",
    planet: "♄",
    progress: 32,
    progressLabel: "Consistency",
    houseIndex: 10,
  },
  {
    title: "Relationship grounding",
    window: "Q1 2025",
    houseAnchor: "7th house",
    detail: "Invite calm conversations and shared rituals while Venus remains in a friendly sign.",
    planet: "♀",
    progress: 58,
    progressLabel: "Balance",
    houseIndex: 7,
  },
  {
    title: "Learning and dharma",
    window: "Q2 2025",
    houseAnchor: "9th house",
    detail: "Choose a study track; Jupiter aspects support travel, teachers, and gentle discipline.",
    planet: "♃",
    progress: 76,
    progressLabel: "Insight",
    houseIndex: 9,
  },
  {
    title: "Home sanctuary",
    window: "Q3 2025",
    houseAnchor: "4th house",
    detail: "Create soothing routines at home, adding water element cures and moon-focused fasts.",
    planet: "☾",
    progress: 44,
    progressLabel: "Ease",
    houseIndex: 4,
  },
  {
    title: "Mid-December alignment",
    window: "Mid-Dec 15, 2025",
    houseAnchor: "2nd house",
    detail: "Revisit values and resources with a steady, grounded ritual reset.",
    planet: "☿",
    progress: 62,
    progressLabel: "Clarity",
    houseIndex: 2,
  },
];

export const DEMO_CHART: ChartHouse[] = [
  { index: 1, sign: "Aries", occupants: ["Sun"], bhrigu_notes: ["Vitality and initiative rising."] },
  { index: 2, sign: "Taurus", occupants: ["Moon"], bhrigu_notes: ["Steady voice anchors resources."] },
  { index: 3, sign: "Gemini", occupants: ["Mars"], bhrigu_notes: ["Curious courage fuels siblings."] },
  { index: 4, sign: "Cancer", occupants: ["Mercury"], bhrigu_notes: ["Home conversations feel tender."] },
  { index: 5, sign: "Leo", occupants: ["Jupiter"], bhrigu_notes: ["Joy and teaching glow."], },
  { index: 6, sign: "Virgo", occupants: ["Saturn"], bhrigu_notes: ["Discipline refines health."] },
  { index: 7, sign: "Libra", occupants: ["Venus"], bhrigu_notes: ["Partnerships feel balanced."], },
  { index: 8, sign: "Scorpio", occupants: ["Ketu"], bhrigu_notes: ["Mystery inspires transformation."], },
  { index: 9, sign: "Sagittarius", occupants: ["Rahu"], bhrigu_notes: ["Travel and dharma stretch horizons."], },
  { index: 10, sign: "Capricorn", occupants: ["—"], bhrigu_notes: ["Career asks for patient structure."], },
  { index: 11, sign: "Aquarius", occupants: ["—"], bhrigu_notes: ["Allies gather around shared ideals."], },
  { index: 12, sign: "Pisces", occupants: ["—"], bhrigu_notes: ["Rest nurtures intuition."], },
];

export const DEMO_DASHAS: DashaPeriod[] = [
  { lord: "Venus", start: "2024-01", end: "2026-06", anchor_rule: "Lean into artful collaboration." },
  { lord: "Sun", start: "2026-06", end: "2027-11", anchor_rule: "Claim leadership with warmth." },
  { lord: "Moon", start: "2027-11", end: "2029-02", anchor_rule: "Rest and listen to the tides." },
];
