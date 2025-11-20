'use client';

import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";

export default function HomePage() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1rem 4rem" }}>
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ letterSpacing: "0.2em", textTransform: "uppercase", color: "#6366f1", fontWeight: 700 }}>
          Bhrigu Samhita Digital Studio
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", marginBottom: "1rem" }}>
          Web & mobile experiences sourced exclusively from the Bhrigu Samhita manuscripts
        </h1>
        <p style={{ maxWidth: "720px", margin: "0 auto", color: "#475569" }}>
          Launch professional astrology journeys across desktop, mobile web, and native platforms with a verified backend
          (Render-ready) and Next.js frontend (Vercel-ready). Every response includes Śaka calendar alignment so onboarding
          flows never leave the Samhita guardrails.
        </p>
      </header>
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <PredictionForm
          engine="horoscope"
          title="Holistic horoscope"
          description="Blend karmic epoch, remedies, past lives, and future trajectories for a single seeker."
        />
        <PredictionForm
          engine="past-life"
          title="Past-life excavation"
          description="Surface cross-era narratives cited from the preserved folios to explain present karmic lessons."
        />
        <PredictionForm
          engine="future"
          title="Future directives"
          description="Chart actionable, manuscript-backed steps for finance, service, devotion, and health." />
        <MatchmakingForm />
        <CalendarForm />
      </div>
    </div>
  );
}
