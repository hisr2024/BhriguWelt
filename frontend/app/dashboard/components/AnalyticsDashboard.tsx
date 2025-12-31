"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

const tools = [
  {
    name: "Calendar",
    href: "/calendar",
    description: "Track lunar rhythms and plan every ritual.",
    logo: "📅",
    gradient: "linear-gradient(145deg, #fef3c7, #fde68a)",
    glow: "rgba(251, 191, 36, 0.35)",
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
    name: "Matchmaking",
    href: "/matchmaking",
    description: "Compare charts and align relationship energy.",
    logo: "💞",
    gradient: "linear-gradient(145deg, #ffe4e6, #fecdd3)",
    glow: "rgba(244, 63, 94, 0.3)",
  },
  {
    name: "Experience",
    href: "/experience",
    description: "Curated journeys for deepening your practice.",
    logo: "🌿",
    gradient: "linear-gradient(145deg, #dcfce7, #bbf7d0)",
    glow: "rgba(34, 197, 94, 0.3)",
  },
  {
    name: "Karma Reset",
    href: "/karma-reset",
    description: "Reset energetic balance with guided rituals.",
    logo: "🧘🏽",
    gradient: "linear-gradient(145deg, #ffedd5, #fed7aa)",
    glow: "rgba(249, 115, 22, 0.3)",
  },
];

export default function AnalyticsDashboard() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Dashboard</p>
        <h1>All tools</h1>
        <p className="muted">Everything you need in one place.</p>
      </div>
      <div className="panel__content">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="card softly tool-card"
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
    </section>
  );
}
