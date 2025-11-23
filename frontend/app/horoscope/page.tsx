'use client';

import Link from "next/link";
import { useState } from "react";
import HoroscopeForm from "@/components/HoroscopeForm";
import { helperCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();
  const helperText = helperCopy.horoscope;
  const [detailLevel, setDetailLevel] = useState<"beginner" | "advanced">("beginner");
  const [activeHouse, setActiveHouse] = useState(1);

  const explorerHouses = [
    { index: 1, sign: "Aries", focus: "Vitality and initiative" },
    { index: 5, sign: "Leo", focus: "Joy, children, and creative fire" },
    { index: 7, sign: "Libra", focus: "Partnership balance" },
    { index: 10, sign: "Capricorn", focus: "Career and responsibility" },
  ];

  return (
    <div className="horo-shell">
      <header className="horo-hero">
        <div className="horo-hero__copy">
          <p className="eyebrow">Minimal horoscope</p>
          <h1>{t("pages.horoscope.title", "Direct interpretations. Nothing extra.")}</h1>
          <p className="muted horo-hero__lede">{t("form.helper", helperText ?? "Only the data you enter shows up here.")}</p>
          <div className="horo-hero__pills">
            <span className="pill">Name</span>
            <span className="pill">Date</span>
            <span className="pill">Time</span>
            <span className="pill">Place</span>
          </div>
          <div className="hero-actions">
            <Link href="/" className="button-link ghost-link">
              Back
            </Link>
          </div>
        </div>
        <div className="horo-hero__steps" aria-label="Horoscope flow steps">
          <div className="step-card">
            <p className="pill">1</p>
            <h3>Enter details</h3>
          </div>
          <div className="step-card">
            <p className="pill">2</p>
            <h3>Read</h3>
          </div>
          <div className="step-card">
            <p className="pill">3</p>
            <h3>Share</h3>
          </div>
        </div>
      </header>

      <section className="horo-explorer" aria-label="Interactive chart explorer">
        <div className="horo-explorer__controls">
          <div>
            <p className="eyebrow">Detail level</p>
            <div className="chip-row" role="group" aria-label="Toggle detail level">
              <button
                type="button"
                className={detailLevel === "beginner" ? "pill active" : "pill"}
                onClick={() => setDetailLevel("beginner")}
              >
                Beginner
              </button>
              <button
                type="button"
                className={detailLevel === "advanced" ? "pill active" : "pill"}
                onClick={() => setDetailLevel("advanced")}
              >
                Advanced
              </button>
            </div>
            <p className="microcopy">
              {detailLevel === "beginner"
                ? "Bite-sized guidance with glossary tooltips and gentle sound cues."
                : "Layered interpretations with manuscript citations and house overlays."}
            </p>
          </div>
          <div className="story-chip">Tap planets or houses to see why the horoscope will mention them.</div>
        </div>

        <div className="horo-explorer__grid" role="list">
          {explorerHouses.map((house) => (
            <button
              key={house.index}
              type="button"
              className={`horo-explorer__card ${activeHouse === house.index ? "active" : ""}`}
              onClick={() => setActiveHouse(house.index)}
              role="listitem"
              aria-pressed={activeHouse === house.index}
            >
              <span className="badge">House {house.index}</span>
              <strong>{house.sign}</strong>
              <p className="muted">{house.focus}</p>
              <p className="microcopy">
                {activeHouse === house.index
                  ? "Layered interpretation unlocked—see concise and deep modes."
                  : "Tap to preview the bite-sized interpretation."}
              </p>
            </button>
          ))}
        </div>
      </section>

      <HoroscopeForm />
    </div>
  );
}
