import Link from "next/link";

import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import QuarterlyReviewPanel from "@/components/QuarterlyReviewPanel";

const harmonyNotes = [
  { label: "Dual consent", text: "Both profiles log in before compatibility renders." },
  { label: "Śaka guard", text: "Matchmaking runs only after intake and conversion." },
  { label: "Flow", text: "Soft neon gradients and floating glyphs keep the page alive." },
];

export default function RelationshipsLab() {
  return (
    <div className="engine-lab">
      <section className="lab-hero">
        <p className="eyebrow">Step 03</p>
        <h1>Relationship & compatibility lab</h1>
        <p style={{ maxWidth: "760px" }}>
          Dedicated canvas for kundali matchmaking, harmony rituals, and future prep. Gen Z energy without breaking Bhrigu
          Samhita sequencing.
        </p>
        <div className="action-rail">
          <Link className="button-link" href="/studio">
            Back to studio hub
          </Link>
          <Link className="button-link ghost-link" href="/studio/intake">
            Re-run intake
          </Link>
        </div>
      </section>

      <section className="lab-grid">
        <article className="lab-card light">
          <div className="pill subtle">Matchmaking</div>
          <h3>Dual profile alignment</h3>
          <p>Balanced forms, floating score glyphs, and real-time cues to keep both seekers in sync.</p>
          <MatchmakingForm />
        </article>
        <article className="lab-card light">
          <div className="pill subtle">Harmony timeline</div>
          <h3>Quarterly rituals</h3>
          <QuarterlyReviewPanel />
          <div className="mini-flow" style={{ marginTop: "0.75rem" }}>
            {harmonyNotes.map((note) => (
              <div key={note.label} className="mini-flow__node">
                <p className="microcopy">{note.label}</p>
                <p className="muted">{note.text}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="lab-grid">
        <article className="lab-card light">
          <div className="pill subtle">Future pulse</div>
          <p className="microcopy">Carry the couple into future directives once harmony is set.</p>
          <PredictionForm
            engine="future"
            title="Shared future directive"
            description="Use after both charts are verified and Śaka-ready."
          />
        </article>
      </section>
    </div>
  );
}
