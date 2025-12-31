"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

const toolGroups = [
  {
    title: "Core Insights",
    description: "Daily intelligence and real-time celestial context.",
    tools: [
      {
        name: "Birth Chart",
        href: "/dashboard?tool=birth-chart",
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
        href: "/dashboard?tool=transits",
        description: "Monitor real-time shifts across the sky.",
        logo: "🛰️",
        gradient: "linear-gradient(145deg, #dbeafe, #bfdbfe)",
        glow: "rgba(59, 130, 246, 0.35)",
      },
      {
        name: "Moon Phases",
        href: "/dashboard?tool=moon-phases",
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
        href: "/dashboard?tool=remedies",
        description: "Personalized rituals, chants, and gemstones.",
        logo: "🕯️",
        gradient: "linear-gradient(145deg, #ffedd5, #fed7aa)",
        glow: "rgba(251, 146, 60, 0.32)",
      },
      {
        name: "Meditations",
        href: "/dashboard?tool=meditations",
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
        href: "/dashboard?tool=daily-insights",
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
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Dashboard</p>
        <h1>All 13 tools</h1>
        <p className="muted">Professional access to every experience in one place.</p>
      </div>
      <div className="panel__content">
        {toolGroups.map((group) => (
          <div key={group.title} className="tool-group">
            <div className="tool-group__header">
              <h2>{group.title}</h2>
              <p className="muted">{group.description}</p>
            </div>
            <div className="tool-group__grid">
              {group.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="card softly tool-card tool-card--compact"
                  style={
                    {
                      "--tool-gradient": tool.gradient,
                      "--tool-glow": tool.glow,
                    } as CSSProperties
                  }
                >
                  <div className="tool-card__header">
                    <div className="tool-logo" aria-hidden="true">
                      <span className="tool-logo__halo" />
                      <span className="tool-logo__icon">{tool.logo}</span>
                      <span className="tool-logo__spark" />
                    </div>
                    <span className="pill">Ready now</span>
                  </div>
                  <div className="tool-card__body">
                    <h3>{tool.name}</h3>
                    <p className="muted">{tool.description}</p>
                  </div>
                  <div className="tool-card__footer">
                    <span className="tool-card__cta">Launch app</span>
                    <span className="tool-card__hint">Opens {tool.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
