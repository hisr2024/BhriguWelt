'use client';

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const tools = [
  {
    title: "Śaka Calendar",
    description: "Convert birth details into Śaka-friendly payloads before any engine call.",
    href: "/calendar",
  },
  {
    title: "Past Lives",
    description: "Send birth inputs and receive past-life narratives directly.",
    href: "/past-life",
  },
  {
    title: "Future Directives",
    description: "Capture essentials and fetch the upcoming steps and remedies.",
    href: "/future",
  },
  {
    title: "Horoscopes",
    description: "Generate a complete reading from one clean form.",
    href: "/horoscope",
  },
  {
    title: "Matchmaking",
    description: "Enter two records, get compatibility and remedies together.",
    href: "/matchmaking",
  },
];

export default function HomePage() {
  const { t } = useI18n();
  const heroTitle = t("home.heroTitle", "Bhrigu tools, stripped to the essentials.");
  const heroDescription = t(
    "home.heroDescription",
    "Only data inputs and results remain—no ornamentation, just the flows you need.",
  );

  return (
    <div className="stack">
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">{heroTitle}</h1>
        <p className="muted" style={{ maxWidth: "720px" }}>
          {heroDescription}
        </p>
      </section>

      <section className="card-grid" aria-label="Available tools">
        {tools.map((tool) => (
          <div key={tool.title} className="card">
            <div className="section-heading">
              <p className="eyebrow">{tool.title}</p>
              <p className="muted">{tool.description}</p>
            </div>
            <Link href={tool.href} className="button-link" aria-label={`Open ${tool.title}`}>
              Open
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
