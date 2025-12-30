"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

import PredictionForm from "@/components/PredictionForm";
import QuarterlyReviewPanel from "@/components/QuarterlyReviewPanel";
import Timeline from "@/components/Timeline";
import { DEMO_CHART, DEMO_DASHAS, journeyTimeline } from "@/app/sections/sectionData";

const KundliCharts = dynamic(() => import("@/components/KundliCharts"), {
  ssr: false,
  loading: () => <div className="surface">Drawing kundli wheel…</div>,
});

const WebXRChart = dynamic(() => import("@/components/WebXRChart"), {
  ssr: false,
  loading: () => <div className="surface">Booting immersive chart…</div>,
});

const BhriguChat = dynamic(() => import("@/components/BhriguChat"), {
  ssr: false,
  loading: () => <div className="surface">Activating Bhrigu chat…</div>,
});

const insightPills = [
  { label: "Charts", text: "Orbital view with responsive glow." },
  { label: "Dashas", text: "Layered sequences with color-coded cues." },
  { label: "Chat", text: "Conversational UI that stays ritual-aligned." },
];

export default function InsightsLab() {
  return (
    <div className="engine-lab">
      <section className="lab-hero">
        <p className="eyebrow">Step 02</p>
        <h1>Charts, chat, and dashboards</h1>
        <p style={{ maxWidth: "760px" }}>
          Neon-rich visuals, flowing charts, and zero-clutter dashboards that respect Gen Z sensibilities and Bhrigu Samhita
          order. Every module is animated yet stable.
        </p>
        <div className="action-rail">
          <Link className="button-link" href="/studio/relationships">
            Move to relationships
          </Link>
          <Link className="button-link ghost-link" href="/studio/intake">
            Revisit intake
          </Link>
        </div>
      </section>

      <section className="lab-grid">
        <article className="lab-card light">
          <div className="pill subtle">Dashboards</div>
          <h3>Quarterly focus</h3>
          <p>Micro-animations and gradient dividers deliver guidance without clutter.</p>
          <QuarterlyReviewPanel />
        </article>
        <article className="lab-card light">
          <div className="pill subtle">Timeline</div>
          <h3>Journey preview</h3>
          <Timeline events={journeyTimeline} accent="fuchsia" />
        </article>
      </section>

      <section className="lab-grid">
        <article className="lab-card light">
          <div className="pill subtle">Kundli charts</div>
          <KundliCharts rashiChart={DEMO_CHART} bhavaChart={DEMO_CHART} dashas={DEMO_DASHAS} />
          <WebXRChart rashiChart={DEMO_CHART} />
        </article>
        <article className="lab-card light">
          <div className="pill subtle">Chat</div>
          <BhriguChat />
          <div className="mini-flow" style={{ marginTop: "0.75rem" }}>
            {insightPills.map((pill) => (
              <div key={pill.label} className="mini-flow__node">
                <p className="microcopy">{pill.label}</p>
                <p className="muted">{pill.text}</p>
              </div>
            ))}
          </div>
          <div className="hero-actions" style={{ marginTop: "1rem" }}>
            <PredictionForm
              engine="horoscope"
              title="Holistic horoscope"
              description="Enter exact birth data for Bhrigu-aligned replies."
            />
          </div>
        </article>
      </section>
    </div>
  );
}
