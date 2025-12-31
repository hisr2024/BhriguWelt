"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { checkBackendHealth } from "@/lib/api";

const karmicEpochs = [
  {
    label: "Dharma Mandala",
    weight: 86,
    mantra: "Satya, Karuna, Viveka",
    citation: "Bhrigu Samhita: Lunar tithi 5 indicates decisive leadership.",
  },
  {
    label: "Artha Vistara",
    weight: 72,
    mantra: "Seva, Samriddhi, Daya",
    citation: "Bhrigu Samhita: Jupiter in 2nd house amplifies resources.",
  },
  {
    label: "Karma Sandhi",
    weight: 64,
    mantra: "Prarabdha, Sankalpa, Moksha",
    citation: "Nadi Jotisha: Saturn in 8th house seals karmic debts.",
  },
  {
    label: "Moksha Lotus",
    weight: 91,
    mantra: "Shanti, Prakash, Udgam",
    citation: "Nadi Jotisha: Moon in 9th house signals elevated dharma.",
  },
];

const birthChartHouses = [
  "Lagna",
  "Dhana",
  "Sahaja",
  "Sukha",
  "Putra",
  "Ari",
  "Yuvati",
  "Randhra",
  "Dharma",
  "Karma",
  "Labha",
  "Vyaya",
];

const predictionTimeline = [
  {
    era: "Now · 30 days",
    title: "Sankalpa ignition",
    insight: "Initiate a new vow; Mars aligns for decisive action.",
    citation: "Bhrigu Samhita: Mars tithi 9 favors bold beginnings.",
  },
  {
    era: "Q3 2024",
    title: "Karmic merge",
    insight: "Relationships deepen under Venus retrograde arc.",
    citation: "Nadi Jotisha: Venus retro in 7th house repeats soul contracts.",
  },
  {
    era: "Q1 2025",
    title: "Dharma ascent",
    insight: "Public recognition; Sun enters 10th with clarity.",
    citation: "Bhrigu Samhita: Sun in 10th house elevates authority.",
  },
  {
    era: "Q4 2025",
    title: "Moksha drift",
    insight: "Spiritual retreat indicated by Rahu in 12th.",
    citation: "Nadi Jotisha: Rahu in 12th invites pilgrimage and release.",
  },
];

const remedies = [
  {
    label: "Agni Japa",
    detail: "108 mantra cycle",
    icon: "🕉️",
  },
  {
    label: "Lotus Fast",
    detail: "Saturn pacifying ritual",
    icon: "🪷",
  },
  {
    label: "Copper Yantra",
    detail: "Mercury alignment",
    icon: "🔶",
  },
  {
    label: "Tulsi Bath",
    detail: "Moon purification",
    icon: "🌿",
  },
];

const insightTiles = [
  {
    title: "Precision Mapping",
    description: "Exact house placements follow Nadi rules with 0.5° tolerance.",
  },
  {
    title: "Karmic Flow",
    description: "Gradients reveal karma transfer across epochs and remedies.",
  },
  {
    title: "Manuscript Citations",
    description: "Inline citations anchor every prediction to scripture.",
  },
];

type ToolItem = {
  name: string;
  href: string;
  logo: string;
  gradient: string;
  glow: string;
};

type ToolGroup = {
  title: string;
  description: string;
  tools: ToolItem[];
};

const toolGroups: ToolGroup[] = [
  {
    title: "Core charts",
    description: "",
    tools: [
      {
        name: "Birth chart",
        href: "/birth-chart",
        logo: "♈",
        gradient: "linear-gradient(130deg, #818cf8, #22d3ee)",
        glow: "0 0 24px rgba(56, 189, 248, 0.4)",
      },
      {
        name: "Analytics",
        href: "/analytics-tools",
        logo: "📈",
        gradient: "linear-gradient(130deg, #f472b6, #fb7185)",
        glow: "0 0 24px rgba(244, 114, 182, 0.45)",
      },
      {
        name: "Transits",
        href: "/transits",
        logo: "🪐",
        gradient: "linear-gradient(130deg, #60a5fa, #a78bfa)",
        glow: "0 0 24px rgba(96, 165, 250, 0.45)",
      },
      {
        name: "Moon phases",
        href: "/moon-phases",
        logo: "🌙",
        gradient: "linear-gradient(130deg, #38bdf8, #34d399)",
        glow: "0 0 24px rgba(56, 189, 248, 0.35)",
      },
    ],
  },
  {
    title: "Guidance & forecasts",
    description: "",
    tools: [
      {
        name: "Daily insights",
        href: "/daily-insights",
        logo: "🗓️",
        gradient: "linear-gradient(130deg, #f59e0b, #f97316)",
        glow: "0 0 24px rgba(249, 115, 22, 0.4)",
      },
      {
        name: "Horoscope",
        href: "/horoscope",
        logo: "✨",
        gradient: "linear-gradient(130deg, #f472b6, #facc15)",
        glow: "0 0 24px rgba(250, 204, 21, 0.45)",
      },
      {
        name: "Future",
        href: "/future",
        logo: "🔮",
        gradient: "linear-gradient(130deg, #6366f1, #38bdf8)",
        glow: "0 0 24px rgba(99, 102, 241, 0.4)",
      },
      {
        name: "Calendar",
        href: "/calendar",
        logo: "🧭",
        gradient: "linear-gradient(130deg, #34d399, #22d3ee)",
        glow: "0 0 24px rgba(52, 211, 153, 0.4)",
      },
      {
        name: "Matchmaking",
        href: "/matchmaking",
        logo: "💞",
        gradient: "linear-gradient(130deg, #fb7185, #f472b6)",
        glow: "0 0 24px rgba(251, 113, 133, 0.45)",
      },
    ],
  },
  {
    title: "Rituals & healing",
    description: "",
    tools: [
      {
        name: "Remedies",
        href: "/remedies",
        logo: "🧿",
        gradient: "linear-gradient(130deg, #facc15, #f97316)",
        glow: "0 0 24px rgba(250, 204, 21, 0.4)",
      },
      {
        name: "Meditations",
        href: "/meditations",
        logo: "🕯️",
        gradient: "linear-gradient(130deg, #a78bfa, #f472b6)",
        glow: "0 0 24px rgba(167, 139, 250, 0.4)",
      },
      {
        name: "Past life",
        href: "/past-life",
        logo: "🌀",
        gradient: "linear-gradient(130deg, #38bdf8, #22d3ee)",
        glow: "0 0 24px rgba(56, 189, 248, 0.4)",
      },
      {
        name: "Karma reset",
        href: "/karma-reset",
        logo: "♻️",
        gradient: "linear-gradient(130deg, #34d399, #10b981)",
        glow: "0 0 24px rgba(16, 185, 129, 0.4)",
      },
    ],
  },
];

export default function AnalyticsDashboard() {
  const [healthLabel, setHealthLabel] = useState("Operational");
  const [healthTone, setHealthTone] = useState<"live" | "demo" | "offline">("demo");
  const [animationsPaused, setAnimationsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isMotionReduced = prefersReducedMotion || animationsPaused;

  const karmicSegments = [
    { label: "Tithi 02", value: "Dwitiya", hue: "#c084fc" },
    { label: "Saturn Cycle", value: "28 yr slow turn", hue: "#38bdf8" },
    { label: "Nadi Gate", value: "Sushumna", hue: "#fbbf24" },
  ];

  const timelineArcs = [
    {
      label: "Samhita arc",
      range: "2025 · 2027",
      hue: "#f472b6",
      path: "M12 160 C 90 30, 170 30, 248 160",
    },
    {
      label: "Ancestral echo",
      range: "2027 · 2029",
      hue: "#60a5fa",
      path: "M12 180 C 90 50, 170 50, 248 180",
    },
    {
      label: "Nadi ascent",
      range: "2029 · 2032",
      hue: "#34d399",
      path: "M12 200 C 90 70, 170 70, 248 200",
    },
  ];

  const remedyIcons = [
    { label: "Lotus bloom", hint: "Water element remedy", emoji: "🪷" },
    { label: "Conch resonance", hint: "Air + ether uplift", emoji: "🐚" },
    { label: "Sacred flame", hint: "Fire purification", emoji: "🔥" },
  ];

  const manuscriptInsights = [
    {
      id: "moon-watery",
      title: "Moon in watery rashi",
      copy: "5s reveal aligned to lunar tide forecasts.",
      timing: 5,
    },
    {
      id: "saturn-gate",
      title: "Saturn transit gate",
      copy: "Slow rotation mirrors karmic patience cycles.",
      timing: 3.6,
    },
    {
      id: "nadi-lock",
      title: "Nadi alignment lock",
      copy: "Precision pulse when chart angle hits 27°.",
      timing: 3,
    },
  ];

  useEffect(() => {
    let mounted = true;
    const loadHealth = async () => {
      try {
        const health = await checkBackendHealth();
        if (!mounted) return;
        if (health.meta?.mode === "demo") {
          setHealthLabel("Operational · Demo");
          setHealthTone("demo");
          return;
        }
        if (health.status === "ok") {
          setHealthLabel("Operational");
          setHealthTone("live");
          return;
        }
        setHealthLabel("Degraded");
        setHealthTone("offline");
      } catch {
        if (!mounted) return;
        setHealthLabel("Offline");
        setHealthTone("offline");
      }
    };

    void loadHealth();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Dashboard</p>
        <h1>All 13 tools</h1>
        <p className="muted">Professional access to every experience in one place.</p>
        <div className="subtle-pill-row" aria-live="polite">
          <span className={`pill tool-card__status tool-card__status--${healthTone}`}>
            {healthLabel}
          </span>
          <button
            type="button"
            className="pill motion-toggle"
            aria-pressed={animationsPaused}
            onClick={() => setAnimationsPaused((prev) => !prev)}
          >
            {animationsPaused ? "Resume motion" : "Pause motion"}
          </button>
        </div>
        <div className="analytics-hero__mandala" aria-hidden="true">
          <div className="mandala-ring mandala-ring--outer" />
          <div className="mandala-ring mandala-ring--middle" />
          <div className="mandala-ring mandala-ring--inner" />
          <div className="mandala-core">ॐ</div>
        </div>
      </div>

      <div className="panel__content">
        {toolGroups.map((group) => (
          <motion.div
            key={group.title}
            className="tool-group"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: isMotionReduced ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="tool-group__header">
              <h2>{group.title}</h2>
              <p className="muted">{group.description}</p>
            </div>
            <div className="tool-group__grid">
              {group.tools.map((tool) => (
                <motion.div
                  key={tool.href}
                  whileHover={isMotionReduced ? undefined : { y: -6 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={tool.href}
                    className="card tool-card tool-card--compact tool-card--minimal"
                    style={
                      {
                        "--tool-gradient": tool.gradient,
                        "--tool-glow": tool.glow,
                      } as CSSProperties
                    }
                  >
                    <div className="tool-card__minimal">
                      <div className="tool-logo" aria-hidden="true">
                        <span className="tool-logo__halo" />
                        <span className="tool-logo__icon">{tool.logo}</span>
                        <span className="tool-logo__spark" />
                      </div>
                      <h3 className="tool-card__label">{tool.name}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
