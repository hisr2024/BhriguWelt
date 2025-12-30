import Link from "next/link";

import EngineCoverage from "@/components/EngineCoverage";

const labs = [
  {
    title: "Intake & Śaka sync",
    description: "Capture birth intel with calm forms and convert to Śaka before any engine call.",
    href: "/studio/intake",
    badge: "Step 01",
  },
  {
    title: "Charts & chat",
    description: "Flowcharts, neon charts, and Bhrigu chat live in a focused insight deck.",
    href: "/studio/insights",
    badge: "Step 02",
  },
  {
    title: "Relationships",
    description: "Matchmaking lab with compatibility wheels, ritual guidance, and shared timelines.",
    href: "/studio/relationships",
    badge: "Step 03",
  },
];

const rituals = [
  { label: "Compliance", copy: "Every surface honors Bhrigu Samhita sequencing." },
  { label: "Flow", copy: "Soft gradients and kinetic glows keep Gen Z engaged." },
  { label: "Clarity", copy: "Engines are isolated by page to avoid overwhelm." },
];

export default function StudioPage() {
  return (
    <div className="engine-lab">
      <section className="lab-hero">
        <p className="eyebrow">Multi-page command center</p>
        <h1>Bhrigu studio hub</h1>
        <p style={{ maxWidth: "760px" }}>
          Engines leave the homepage and land in ritual-correct labs. Glide between intake, animated charts, and compatibility
          canvases without breaking the Bhrigu Samhita flow.
        </p>
        <div className="action-rail">
          <Link className="button-link" href="/studio/intake">
            Begin with intake
          </Link>
          <Link className="button-link ghost-link" href="/experience">
            Motion showcase
          </Link>
        </div>
      </section>

      <section className="lab-grid">
        {labs.map((lab) => (
          <article key={lab.title} className="lab-card">
            <div className="pill subtle">{lab.badge}</div>
            <h3>{lab.title}</h3>
            <p>{lab.description}</p>
            <Link className="neo-card__cta" href={lab.href}>
              Enter →
            </Link>
          </article>
        ))}
      </section>

      <section className="flowchart-grid">
        <div className="flowchart-panel">
          <p className="eyebrow">Samhita guardrails</p>
          <div className="mini-flow">
            {rituals.map((ritual) => (
              <div key={ritual.label} className="mini-flow__node">
                <p className="microcopy">{ritual.label}</p>
                <p className="muted">{ritual.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EngineCoverage />
    </div>
  );
}
