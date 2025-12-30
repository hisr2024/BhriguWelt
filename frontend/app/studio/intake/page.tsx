import Link from "next/link";

import BirthInputForm from "@/components/BirthInputForm";
import CalendarForm from "@/components/CalendarForm";
import Timeline from "@/components/Timeline";
import { journeyTimeline } from "@/app/sections/sectionData";

const intakeBeats = [
  { label: "Śaka lock", text: "Conversion happens first—no prediction without it." },
  { label: "Geo clarity", text: "IST pinned with subtle reminders and airy spacing." },
  { label: "Ready state", text: "Outputs open only after both forms validate." },
];

export default function IntakePage() {
  return (
    <div className="engine-lab">
      <section className="lab-hero">
        <p className="eyebrow">Step 01</p>
        <h1>Intake & Śaka conversion</h1>
        <p style={{ maxWidth: "760px" }}>
          Gen Z-friendly forms, soft motion, and ritual discipline keep the birth intel crisp. This is the only doorway before
          dashboards, chats, or matchmaking engines activate.
        </p>
        <div className="action-rail">
          <Link className="button-link" href="/studio/insights">
            Forward to charts
          </Link>
          <Link className="button-link ghost-link" href="/studio">
            Back to hub
          </Link>
        </div>
      </section>

      <section className="lab-grid">
        <article className="lab-card light">
          <div className="pill subtle">Śaka conversion</div>
          <h3>Gregorian → Śaka</h3>
          <p>Convert to Samhita-ready payloads with IST locked in.</p>
          <CalendarForm />
        </article>
        <article className="lab-card light">
          <div className="pill subtle">Birth intel</div>
          <h3>Calm intake</h3>
          <p>Minimal fields, warm glow, and instant validation for seekers.</p>
          <BirthInputForm />
        </article>
      </section>

      <section className="flowchart-grid">
        <div className="flowchart-panel">
          <p className="eyebrow">Guardrails</p>
          <div className="mini-flow">
            {intakeBeats.map((beat) => (
              <div key={beat.label} className="mini-flow__node">
                <p className="microcopy">{beat.label}</p>
                <p className="muted">{beat.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flowchart-panel">
          <p className="eyebrow">Preview</p>
          <h3>Journey timeline</h3>
          <Timeline events={journeyTimeline} accent="aqua" />
        </div>
      </section>
    </div>
  );
}
