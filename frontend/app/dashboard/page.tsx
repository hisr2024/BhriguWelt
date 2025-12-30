'use client';

import Link from "next/link";
import { useMemo } from "react";

import BirthInputForm from "@/components/BirthInputForm";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";

const tools = [
  { title: "Horoscope", href: "/horoscope", note: "Profiles" },
  { title: "Śaka calendar", href: "/calendar", note: "Calendar" },
  { title: "Future guidance", href: "/future", note: "Care" },
  { title: "Core wisdom", href: "/core-wisdom", note: "Digest" },
  { title: "Timeline", href: "/timeline", note: "Journey" },
  { title: "Varshaphal", href: "/varshaphal", note: "Solar return" },
  { title: "Matchmaking", href: "/matchmaking", note: "Connections" },
];

export default function DashboardPage() {
  const quickLinks = useMemo(() => tools, []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-hero">
        <div className="hero-main">
          <p className="pill subtle">Bhrigu dashboard</p>
          <h1>Minimal control room</h1>
          <p className="muted">Quick links and live forms without narration or clutter.</p>
          <div className="hero-actions">
            <Link className="button-link" href="/horoscope">
              Horoscope
            </Link>
            <Link className="button-link ghost-link" href="/calendar">
              Śaka calendar
            </Link>
            <Link className="ghost-link" href="#tools-grid">
              Open tools
            </Link>
          </div>
        </div>
        <div className="hero-status">
          <div className="surface surface--stack">
            <div className="surface__header">
              <p className="eyebrow">Status</p>
              <p className="badge">Stable</p>
            </div>
            <h3>Śaka calendar</h3>
            <p className="muted">Auto converts and syncs with other engines.</p>
          </div>
          <div className="surface surface--stack">
            <div className="surface__header">
              <p className="eyebrow">Quick jump</p>
            </div>
            <div className="status-links">
              {quickLinks.map((tool) => (
                <Link key={tool.href} className="ghost-link" href={tool.href}>
                  {tool.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section id="tools-grid" className="dashboard-grid" aria-label="Tool access grid">
        {quickLinks.map((tool) => (
          <article key={tool.href} className="dashboard-card">
            <div>
              <p className="eyebrow">{tool.note}</p>
              <h3>{tool.title}</h3>
            </div>
            <Link className="button-link" href={tool.href}>
              Open
            </Link>
          </article>
        ))}
      </section>

      <section className="dashboard-forms" aria-label="Live forms">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Live engines</p>
            <h2>Work inline</h2>
            <p className="muted">Short forms keep the dashboard fast and focused.</p>
          </div>
          <div className="badge-row">
            <span className="badge">Ready</span>
            <span className="badge badge--ghost">Synced</span>
          </div>
        </header>
        <div className="dashboard-forms__grid">
          <div className="surface surface--stack">
            <header className="surface__header">
              <h3>Birth intake</h3>
            </header>
            <BirthInputForm />
          </div>
          <div className="surface surface--stack">
            <header className="surface__header">
              <h3>Śaka calendar</h3>
            </header>
            <CalendarForm />
          </div>
        </div>
        <div className="dashboard-forms__grid two-col">
          <div className="surface surface--stack">
            <header className="surface__header">
              <h3>Matchmaking</h3>
            </header>
            <MatchmakingForm />
          </div>
          <div className="surface surface--stack">
            <header className="surface__header">
              <h3>Future directives</h3>
            </header>
            <PredictionForm
              engine="future"
              title="Instant future focus"
              description="Set a timer, send a calm directive, and keep seekers centred."
            />
          </div>
        </div>
      </section>
    </div>
  );
}
