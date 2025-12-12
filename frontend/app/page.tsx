'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

const flowNodes = [
  {
    title: "Birth intel",
    detail: "Śaka-synced intake keeps every engine honest before predictions launch.",
    badge: "IST locked",
    href: "/studio/intake",
  },
  {
    title: "Charts & flow",
    detail: "Orbital dashboards, lively flowcharts, and kinetic charts tuned for Gen Z focus.",
    badge: "Charts",
    href: "/studio/insights",
  },
  {
    title: "Relationship lab",
    detail: "Kundali matchmaking, dual timelines, and harmony checks on their own canvas.",
    badge: "Samhita sync",
    href: "/studio/relationships",
  },
  {
    title: "Experience tour",
    detail: "A gallery of Bhrigu-approved motion systems and tactile UI microdoses.",
    badge: "UI flow",
    href: "/experience",
  },
];

const sparkCards = [
  { title: "Harmony index", bars: [65, 38, 92, 58, 88], caption: "Aura balance" },
  { title: "Transit heat", bars: [25, 78, 44, 95, 66], caption: "Planet weights" },
  { title: "Remedy pulse", bars: [48, 54, 60, 84, 72], caption: "Actionable dose" },
];

const storyBeats = [
  { label: "Align", copy: "Clean intake → Śaka conversion → verified payload" },
  { label: "Animate", copy: "Gradient glows, floating logos, and soft kinetic charts" },
  { label: "Assist", copy: "Flowcharts guide seekers through rituals without clutter" },
  { label: "Amplify", copy: "Gen Z-first tone, inclusive color, zero noisy engines on home" },
];

export default function HomePage() {
  const { t } = useI18n();
  const [activeFlow, setActiveFlow] = useState(flowNodes[0]);

  const heroTitle = t("home.heroTitle", "Gen Z cosmic studio with sacred discipline.");
  const heroDescription = t(
    "home.heroDescription",
    "Crafted by Bhrigu Samhita professors and stack engineers to feel alive, neon-soft, and ritual true. Home stays serene; engines now live in focused multi-page labs.",
  );

  const sparklineBars = useMemo(
    () => sparkCards.map((card, index) => ({ ...card, id: `${card.title}-${index}` })),
    [],
  );

  return (
    <div className="z-shell">
      <section className="z-hero" aria-labelledby="hero-title">
        <div className="z-hero__grid">
          <div className="z-hero__copy">
            <span className="z-pill">Bhrigu Samhita aligned</span>
            <h1 id="hero-title">{heroTitle}</h1>
            <p>{heroDescription}</p>
            <div className="hero-actions">
              <Link className="button-link" href="/studio">
                Launch studio hub
              </Link>
              <Link className="button-link ghost-link" href="/experience">
                Preview motion grammar
              </Link>
            </div>
            <div className="action-rail" aria-label="Design highlights">
              <span className="action-chip">✨ Animated logos</span>
              <span className="action-chip">🪐 Flowcharts</span>
              <span className="action-chip">💫 Charts</span>
              <span className="action-chip">📜 Samhita discipline</span>
            </div>
          </div>

          <div className="logo-orbit" aria-hidden>
            <div className="logo-orbit__beam" />
            <div className="logo-orbit__ring" />
            <div className="logo-orbit__core">Bhrigu</div>
            <div className="logo-badge">Gen Z</div>
            <div className="logo-badge">IST</div>
            <div className="logo-badge">Flow</div>
            <div className="logo-badge">Aura</div>
          </div>
        </div>
      </section>

      <section className="neo-grid" aria-label="Interactive labs">
        {flowNodes.map((node) => (
          <article key={node.title} className="neo-card">
            <div className="neo-card__bg" aria-hidden />
            <div className="pill subtle">{node.badge}</div>
            <h3>{node.title}</h3>
            <p>{node.detail}</p>
            <Link className="neo-card__cta" href={node.href}>
              Enter →
            </Link>
            <span className="neo-card__glow" aria-hidden />
          </article>
        ))}
      </section>

      <section className="flowchart-grid" aria-label="Interactive flowchart">
        <div className="flowchart-panel">
          <p className="eyebrow">Bhrigu-compliant path</p>
          <h3>Multi-page ritual map</h3>
          <p className="muted">Tap a step to feel the kinetic glow and jump into the right lab.</p>
          <div className="flow-map">
            {flowNodes.map((node) => (
              <button
                key={node.title}
                type="button"
                className={`flow-node ${activeFlow.title === node.title ? "is-active" : ""}`}
                onClick={() => setActiveFlow(node)}
              >
                <div className="flow-node__pulse" aria-hidden />
                <div className="flow-node__bar" aria-hidden />
                <div className="pill subtle">{node.badge}</div>
                <strong>{node.title}</strong>
                <span className="microcopy">{node.detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flowchart-panel">
          <p className="eyebrow">Active step</p>
          <h3>{activeFlow.title}</h3>
          <p>{activeFlow.detail}</p>
          <div className="mini-flow" aria-label="Flow details">
            {storyBeats.map((beat) => (
              <div key={beat.label} className="mini-flow__node">
                <p className="microcopy">{beat.label}</p>
                <p className="muted">{beat.copy}</p>
              </div>
            ))}
          </div>
          <div className="hero-actions" style={{ marginTop: "1rem" }}>
            <Link className="button-link" href={activeFlow.href}>
              Open {activeFlow.title}
            </Link>
            <Link className="button-link ghost-link" href="/studio">
              View all engines
            </Link>
          </div>
        </div>
      </section>

      <section className="spark-grid" aria-label="Gen Z spark charts">
        {sparklineBars.map((card) => (
          <article key={card.id} className="spark-card">
            <p className="eyebrow">{card.caption}</p>
            <h3>{card.title}</h3>
            <div className="spark-bars" aria-hidden>
              {card.bars.map((value, index) => (
                <span key={index} className="spark-bar" style={{ height: `${value}%` }} />
              ))}
            </div>
            <p className="microcopy">Motion-ready charts with neon gradients for quick reads.</p>
          </article>
        ))}
      </section>
    </div>
  );
}
