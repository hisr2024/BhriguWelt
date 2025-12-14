'use client';

import BackendHealthNotice from "@/components/BackendHealthNotice";

type StackItem = {
  title: string;
  description: string;
};

const stack: StackItem[] = [
  {
    title: "Core wisdom",
    description: "Bhrigu Saṁhitā folios from the repo stay loaded for every request.",
  },
  {
    title: "Analyzers & interpreters",
    description: "Horoscope, past-life, future, and matchmaking all run through the same verified engines.",
  },
  {
    title: "Sarvam AI link",
    description: "If configured on the backend, AI summaries and remedies route through Sarvam/OpenAI safely.",
  },
  {
    title: "Remedies on",
    description: "Remedy generation is always enabled alongside the detailed analyses.",
  },
];

export default function OperationalStack() {
  return (
    <section className="panel softly" aria-label="Operational readiness">
      <div className="section-heading">
        <p className="eyebrow">Operational engines</p>
        <h2>Aligned to Bhrigu data with AI support</h2>
        <p className="microcopy">Core wisdom stays loaded; Sarvam and interpreters stay linked without extra clutter.</p>
        <BackendHealthNotice className="microcopy" />
      </div>
      <div className="duo-chart-hint" role="list">
        {stack.map((item) => (
          <div key={item.title} className="duo-chart-hint__card" role="listitem">
            <span className="pill">{item.title}</span>
            <p className="microcopy">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

