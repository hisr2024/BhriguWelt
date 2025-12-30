export type EngineSlug =
  | "horoscope"
  | "past-life"
  | "future"
  | "matchmaking"
  | "calendar"
  | "timeline"
  | "varshaphal"
  | "transits"
  | "core-wisdom"
  | "chat"
  | "dashboard"
  | "alerts"
  | "analytics";

export type EngineCategory = "insight" | "relationship" | "timing" | "system";

export type EngineMeta = {
  slug: EngineSlug;
  title: string;
  description: string;
  category: EngineCategory;
  highlight: string;
  accent: string;
  cta: string;
};

export const ENGINES: EngineMeta[] = [
  {
    slug: "horoscope",
    title: "Horoscope Engine",
    description: "Daily cosmic snapshot with mantra-ready insights from the Bhrigu folios.",
    category: "insight",
    highlight: "Realtime karma map",
    accent: "from-neon-cyan/40 to-transparent",
    cta: "Generate horoscope",
  },
  {
    slug: "past-life",
    title: "Past-Life Engine",
    description: "Reveal ancestral narratives and healing arcs across lifetimes.",
    category: "insight",
    highlight: "Soulline stories",
    accent: "from-neon-purple/40 to-transparent",
    cta: "Explore past lives",
  },
  {
    slug: "future",
    title: "Future Engine",
    description: "See the next chapters with era-based milestones and guidance.",
    category: "timing",
    highlight: "Long-range forecasts",
    accent: "from-neon-pink/40 to-transparent",
    cta: "Map the future",
  },
  {
    slug: "matchmaking",
    title: "Matchmaking Engine",
    description: "Compare two charts with modern compatibility filters.",
    category: "relationship",
    highlight: "Dual-profile sync",
    accent: "from-neon-lime/30 to-transparent",
    cta: "Match two charts",
  },
  {
    slug: "calendar",
    title: "Calendar Engine",
    description: "Instant Gregorian-to-Śaka conversion with auspicious timings.",
    category: "timing",
    highlight: "Śaka converter",
    accent: "from-neon-cyan/40 to-transparent",
    cta: "Convert calendar",
  },
  {
    slug: "timeline",
    title: "Timeline Engine",
    description: "Track karmic phases in a clean, immersive timeline view.",
    category: "timing",
    highlight: "Phases + milestones",
    accent: "from-neon-purple/40 to-transparent",
    cta: "Load timeline",
  },
  {
    slug: "varshaphal",
    title: "Varshaphal Engine",
    description: "Annual overview with key planetary themes and rituals.",
    category: "timing",
    highlight: "Yearly signal",
    accent: "from-neon-pink/40 to-transparent",
    cta: "View varshaphal",
  },
  {
    slug: "transits",
    title: "Transits Engine",
    description: "Live transit overlays for intentional daily planning.",
    category: "timing",
    highlight: "Live transit map",
    accent: "from-neon-cyan/40 to-transparent",
    cta: "Check transits",
  },
  {
    slug: "core-wisdom",
    title: "Core-Wisdom Engine",
    description: "Deep-dive guidance organized into eight sacred sections.",
    category: "insight",
    highlight: "Eight-section reading",
    accent: "from-neon-purple/40 to-transparent",
    cta: "Unlock core wisdom",
  },
  {
    slug: "chat",
    title: "Bhrigu Chat",
    description: "Conversational guidance powered by chart-aware context.",
    category: "system",
    highlight: "Live counsel",
    accent: "from-neon-lime/30 to-transparent",
    cta: "Start chat",
  },
  {
    slug: "dashboard",
    title: "Seeker Dashboard",
    description: "Personalized progress, rituals, and completion metrics.",
    category: "system",
    highlight: "Progress arcs",
    accent: "from-neon-pink/40 to-transparent",
    cta: "Open dashboard",
  },
  {
    slug: "alerts",
    title: "Alerts Center",
    description: "Notification-ready alerts for rituals, transits, and streaks.",
    category: "system",
    highlight: "Alert feed",
    accent: "from-neon-cyan/40 to-transparent",
    cta: "View alerts",
  },
  {
    slug: "analytics",
    title: "Insight Analytics",
    description: "Quarterly summaries and accuracy feedback loops.",
    category: "system",
    highlight: "Feedback intelligence",
    accent: "from-neon-purple/40 to-transparent",
    cta: "Load analytics",
  },
];

export const ENGINE_MAP = Object.fromEntries(ENGINES.map((engine) => [engine.slug, engine]));
