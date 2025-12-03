import React from "react";

import { theme } from "@/lib/theme";

export type GradientVariant = "sunrise" | "ocean" | "aurora";

type IconProps = {
  variant?: GradientVariant;
  badge?: boolean;
  size?: number;
  animated?: boolean;
};

type WordmarkProps = {
  lockup?: boolean;
  tagline?: string;
};

const gradientByVariant: Record<GradientVariant, string> = {
  sunrise: theme.gradients.mvGradientSunrise,
  ocean: theme.gradients.mvGradientOcean,
  aurora: theme.gradients.mvGradientAurora,
};

export function MindVibeIcon({ variant = "sunrise", badge = false, size = 48, animated = true }: IconProps) {
  return (
    <span
      className={`mindvibe-icon ${badge ? "is-badge" : ""} ${animated ? "is-animated" : ""}`}
      aria-hidden
      style={{
        background: gradientByVariant[variant],
        width: size,
        height: size,
      }}
    >
      <svg viewBox="0 0 120 120" role="presentation" aria-hidden>
        <defs>
          <radialGradient id={`mv-glow-${variant}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="65%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="50" fill={`url(#mv-glow-${variant})`} />
        <path
          d="M38 54c0-16 10-28 22-28s22 12 22 28-10 28-22 28S38 70 38 54Z"
          fill="rgba(255,255,255,0.75)"
          stroke="rgba(14,27,39,0.08)"
          strokeWidth="3"
        />
        <path
          d="M48 56c0-10 6-18 12-18s12 8 12 18-6 18-12 18S48 66 48 56Z"
          fill="rgba(14,27,39,0.18)"
          stroke="rgba(14,27,39,0.15)"
          strokeWidth="2"
        />
        <circle cx="60" cy="56" r="7" fill="rgba(255,255,255,0.9)" />
        <path
          d="M30 64c14 22 46 22 60 0"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="mindvibe-icon__pulse" />
      <span className="mindvibe-icon__pulse second" />
    </span>
  );
}

export function MindVibeWordmark({ lockup = false, tagline = "Calm clarity for every season." }: WordmarkProps) {
  return (
    <div className={`mindvibe-wordmark ${lockup ? "with-lockup" : ""}`} aria-label="MindVibe Companion wordmark">
      <div className="mindvibe-wordmark__text">
        <span className="mindvibe-wordmark__mv">Mind</span>
        <span className="mindvibe-wordmark__mv accent">Vibe</span>
        <span className="mindvibe-wordmark__mv subtle">Companion</span>
      </div>
      <p className="microcopy">{tagline}</p>
    </div>
  );
}

export function MindVibeLockup({ tagline }: WordmarkProps) {
  return (
    <div className="mindvibe-lockup" role="img" aria-label="MindVibe icon and wordmark lockup">
      <MindVibeIcon badge animated />
      <MindVibeWordmark lockup tagline={tagline} />
    </div>
  );
}
