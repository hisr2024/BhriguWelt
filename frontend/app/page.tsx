'use client';

import Link from "next/link";

import { HeroSection } from "./sections/HeroSection";
import { AetherBeltSection } from "./sections/AetherBeltSection";
import { JourneyRail } from "./sections/JourneyRail";
import { RitualGrid } from "./sections/RitualGrid";
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
    <div className="serene-page">
      <HeroSection />
      <AetherBeltSection />

      <section className="panel softly" aria-labelledby="hero-title">
        <div className="section-heading">
          <p className="eyebrow">{t("home.intro.tag", "Bhrigu workspace")}</p>
          <h2 id="hero-title">{heroTitle}</h2>
          <p className="muted" style={{ maxWidth: "720px" }}>
            {heroDescription}
          </p>
        </div>

        <div className="card-grid" aria-label="Available tools">
          {tools.map((tool) => (
            <article key={tool.title} className="card">
              <div className="section-heading">
                <p className="eyebrow">{tool.title}</p>
                <p className="muted">{tool.description}</p>
              </div>
              <Link href={tool.href} className="button-link" aria-label={`Open ${tool.title}`}>
                {t("home.open", "Open")}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <RitualGrid />
      <JourneyRail />
    </div>
  );
}
