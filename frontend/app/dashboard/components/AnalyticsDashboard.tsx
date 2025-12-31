"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { checkBackendHealth } from "@/lib/api";

const toolGroups = [
  {
    title: "Core Insights",
    description: "Daily intelligence and real-time celestial context.",
    tools: [
      {
        name: "Birth Chart",
        href: "/birth-chart",
        description: "Decode planetary placements and chart signatures.",
        logo: "🪐",
        gradient: "linear-gradient(145deg, #e0e7ff, #c7d2fe)",
        glow: "rgba(99, 102, 241, 0.35)",
      },
      {
        name: "Horoscope",
        href: "/horoscope",
        description: "Daily cosmic prompts with clarity and focus.",
        logo: "✨",
        gradient: "linear-gradient(145deg, #ede9fe, #c4b5fd)",
        glow: "rgba(167, 139, 250, 0.35)",
      },
      {
        name: "Transits",
        href: "/transits",
        description: "Monitor real-time shifts across the sky.",
        logo: "🛰️",
        gradient: "linear-gradient(145deg, #dbeafe, #bfdbfe)",
        glow: "rgba(59, 130, 246, 0.35)",
      },
      {
        name: "Moon Phases",
        href: "/moon-phases",
        description: "Visualize phase shifts and favorable windows.",
        logo: "🌙",
        gradient: "linear-gradient(145deg, #f3e8ff, #ddd6fe)",
        glow: "rgba(139, 92, 246, 0.3)",
      },
    ],
  },
  {
    title: "Rituals & Wellness",
    description: "Guided support for balance, grounding, and ritual.",
    tools: [
      {
        name: "Remedies",
        href: "/remedies",
        description: "Personalized rituals, chants, and gemstones.",
        logo: "🕯️",
        gradient: "linear-gradient(145deg, #ffedd5, #fed7aa)",
        glow: "rgba(251, 146, 60, 0.32)",
      },
      {
        name: "Meditations",
        href: "/meditations",
        description: "Audio journeys tuned to planetary hours.",
        logo: "🎧",
        gradient: "linear-gradient(145deg, #cffafe, #a5f3fc)",
        glow: "rgba(14, 116, 144, 0.3)",
      },
      {
        name: "Karma Reset",
        href: "/karma-reset",
        description: "Reset energetic balance with guided rituals.",
        logo: "🧘🏽",
        gradient: "linear-gradient(145deg, #ffedd5, #fed7aa)",
        glow: "rgba(249, 115, 22, 0.3)",
      },
      {
        name: "Daily Insights",
        href: "/daily-insights",
        description: "Quick hits of wisdom for the day ahead.",
        logo: "📝",
        gradient: "linear-gradient(145deg, #fef9c3, #fde68a)",
        glow: "rgba(245, 158, 11, 0.3)",
      },
    ],
  },
  {
    title: "Journeys",
    description: "Explore your timeline and deepen your story arc.",
    tools: [
      {
        name: "Past Life",
        href: "/past-life",
        description: "Reveal soul memories and narrative insights.",
        logo: "🪞",
        gradient: "linear-gradient(145deg, #e0f2fe, #bae6fd)",
        glow: "rgba(56, 189, 248, 0.35)",
      },
      {
        name: "Future",
        href: "/future",
        description: "Forecast emerging themes and next steps.",
        logo: "🔮",
        gradient: "linear-gradient(145deg, #fce7f3, #fbcfe8)",
        glow: "rgba(236, 72, 153, 0.35)",
      },
      {
        name: "Experience",
        href: "/experience",
        description: "Curated journeys for deepening your practice.",
        logo: "🌿",
        gradient: "linear-gradient(145deg, #dcfce7, #bbf7d0)",
        glow: "rgba(34, 197, 94, 0.3)",
      },
    ],
  },
  {
    title: "Planning & Connections",
    description: "Schedule, align, and collaborate with confidence.",
    tools: [
      {
        name: "Calendar",
        href: "/calendar",
        description: "Track lunar rhythms and plan every ritual.",
        logo: "📅",
        gradient: "linear-gradient(145deg, #fef3c7, #fde68a)",
        glow: "rgba(251, 191, 36, 0.35)",
      },
      {
        name: "Matchmaking",
        href: "/matchmaking",
        description: "Compare charts and align relationship energy.",
        logo: "💞",
        gradient: "linear-gradient(145deg, #ffe4e6, #fecdd3)",
        glow: "rgba(244, 63, 94, 0.3)",
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
      </div>
      <div className="analytics-motion" data-reduced-motion={isMotionReduced}>
        <motion.div
          className="analytics-card karmic-wheel-card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: isMotionReduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="karmic-wheel">
            <motion.div
              className="karmic-wheel__ring"
              animate={isMotionReduced ? { rotate: 0 } : { rotate: 360 }}
              transition={{
                duration: 28,
                repeat: isMotionReduced ? 0 : Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="karmic-wheel__inner"
              animate={isMotionReduced ? { rotate: 0 } : { rotate: -360 }}
              transition={{
                duration: 46,
                repeat: isMotionReduced ? 0 : Infinity,
                ease: "linear",
              }}
            />
            <div className="karmic-wheel__center">
              <p className="eyebrow">Karmic wheel</p>
              <h3>Nadi birth chart rotation</h3>
              <p className="muted">Synced to current tithi cycle.</p>
            </div>
          </div>
          <div className="karmic-wheel__meta">
            {karmicSegments.map((segment) => (
              <div key={segment.label} className="karmic-wheel__stat">
                <span className="karmic-wheel__dot" style={{ background: segment.hue }} />
                <div>
                  <p className="karmic-wheel__label">{segment.label}</p>
                  <p className="karmic-wheel__value">{segment.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="analytics-card timeline-card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: isMotionReduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="timeline-card__header">
            <div>
              <p className="eyebrow">Timeline trajectories</p>
              <h3>Future arcs from Samhita engines</h3>
            </div>
            <span className="pill">5s reveal</span>
          </div>
          <svg className="timeline-card__chart" viewBox="0 0 260 220" role="img">
            <title>Timeline trajectories expanding across future windows</title>
            {timelineArcs.map((arc, index) => (
              <motion.path
                key={arc.label}
                d={arc.path}
                stroke={arc.hue}
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  duration: isMotionReduced ? 0 : 5,
                  delay: isMotionReduced ? 0 : index * 0.4,
                  ease: [0.12, 0.9, 0.24, 1],
                }}
              />
            ))}
          </svg>
          <div className="timeline-card__legend">
            {timelineArcs.map((arc) => (
              <div key={arc.label} className="timeline-card__item">
                <span className="timeline-card__dot" style={{ background: arc.hue }} />
                <div>
                  <p>{arc.label}</p>
                  <span className="muted">{arc.range}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="analytics-card remedy-card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: isMotionReduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="remedy-card__header">
            <p className="eyebrow">Remedy morphs</p>
            <h3>Elemental icons in ritual bloom</h3>
          </div>
          <div className="remedy-card__icons">
            {remedyIcons.map((remedy, index) => (
              <motion.div
                key={remedy.label}
                className="remedy-card__icon"
                animate={
                  isMotionReduced
                    ? { scale: 1, rotate: 0 }
                    : {
                        scale: [1, 1.08, 1],
                        rotate: [0, index % 2 === 0 ? 6 : -6, 0],
                        borderRadius: ["28%", "48%", "28%"],
                      }
                }
                transition={{
                  duration: 4.2,
                  repeat: isMotionReduced ? 0 : Infinity,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.3,
                }}
              >
                <span aria-hidden="true">{remedy.emoji}</span>
                <div>
                  <p>{remedy.label}</p>
                  <span className="muted">{remedy.hint}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="analytics-insights">
        {manuscriptInsights.map((insight) => (
          <motion.div
            key={insight.id}
            className="manuscript-card"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: isMotionReduced ? 0 : insight.timing,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={isMotionReduced ? undefined : { y: -4 }}
          >
            <div className="manuscript-card__header">
              <p className="eyebrow">Manuscript insight</p>
              <span className="pill">Hover to reveal</span>
            </div>
            <h3>{insight.title}</h3>
            <motion.div
              className="manuscript-card__popup"
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: isMotionReduced ? 0 : 0.4 }}
            >
              <p>{insight.copy}</p>
            </motion.div>
          </motion.div>
        ))}
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
