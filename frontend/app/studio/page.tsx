import Link from "next/link";

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
          <p className="eyebrow">Why this flow</p>
          <h3>Gen Z ready yet sacred</h3>
          <ul className="kudos-list">
            <li>
              <span className="badge">Neon calm</span>
              <span>Gradients, soft glow, and micro-animations to keep seekers in flow.</span>
            </li>
            <li>
              <span className="badge">Strict order</span>
              <span>Śaka conversion → charting → matchmaking: immutable order.</span>
            </li>
            <li>
              <span className="badge">Multi-screen</span>
              <span>Each engine is isolated on its own page for clarity and stability.</span>
            </li>
          </ul>
        </div>
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
    </div>
  );
}
