"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { checkBackendHealth } from "@/lib/api";

const karmicEpochs = [
  {
    label: "Dharma Mandala",
    weight: 86,
    mantra: "Satya, Karuna, Viveka",
    citation: "Bhrigu Samhita: Lunar tithi 5 indicates decisive leadership.",
  },
  {
    label: "Artha Vistara",
    weight: 72,
    mantra: "Seva, Samriddhi, Daya",
    citation: "Bhrigu Samhita: Jupiter in 2nd house amplifies resources.",
  },
  {
    label: "Karma Sandhi",
    weight: 64,
    mantra: "Prarabdha, Sankalpa, Moksha",
    citation: "Nadi Jotisha: Saturn in 8th house seals karmic debts.",
  },
  {
    label: "Moksha Lotus",
    weight: 91,
    mantra: "Shanti, Prakash, Udgam",
    citation: "Nadi Jotisha: Moon in 9th house signals elevated dharma.",
  },
];

const birthChartHouses = [
  "Lagna",
  "Dhana",
  "Sahaja",
  "Sukha",
  "Putra",
  "Ari",
  "Yuvati",
  "Randhra",
  "Dharma",
  "Karma",
  "Labha",
  "Vyaya",
];

const predictionTimeline = [
  {
    era: "Now · 30 days",
    title: "Sankalpa ignition",
    insight: "Initiate a new vow; Mars aligns for decisive action.",
    citation: "Bhrigu Samhita: Mars tithi 9 favors bold beginnings.",
  },
  {
    era: "Q3 2024",
    title: "Karmic merge",
    insight: "Relationships deepen under Venus retrograde arc.",
    citation: "Nadi Jotisha: Venus retro in 7th house repeats soul contracts.",
  },
  {
    era: "Q1 2025",
    title: "Dharma ascent",
    insight: "Public recognition; Sun enters 10th with clarity.",
    citation: "Bhrigu Samhita: Sun in 10th house elevates authority.",
  },
  {
    era: "Q4 2025",
    title: "Moksha drift",
    insight: "Spiritual retreat indicated by Rahu in 12th.",
    citation: "Nadi Jotisha: Rahu in 12th invites pilgrimage and release.",
  },
];

const remedies = [
  {
    label: "Agni Japa",
    detail: "108 mantra cycle",
    icon: "🕉️",
  },
  {
    label: "Lotus Fast",
    detail: "Saturn pacifying ritual",
    icon: "🪷",
  },
  {
    label: "Copper Yantra",
    detail: "Mercury alignment",
    icon: "🔶",
  },
  {
    label: "Tulsi Bath",
    detail: "Moon purification",
    icon: "🌿",
  },
];

const insightTiles = [
  {
    title: "Precision Mapping",
    description: "Exact house placements follow Nadi rules with 0.5° tolerance.",
  },
  {
    title: "Karmic Flow",
    description: "Gradients reveal karma transfer across epochs and remedies.",
  },
  {
    title: "Manuscript Citations",
    description: "Inline citations anchor every prediction to scripture.",
  },
];

export default function AnalyticsDashboard() {
  const [healthLabel, setHealthLabel] = useState("Operational");
  const [healthTone, setHealthTone] = useState<"live" | "demo" | "offline">("demo");
  const [isHindi, setIsHindi] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadHealth = async () => {
      try {
        const health = await checkBackendHealth();
        if (!mounted) return;
        if (health.meta?.mode === "demo") {
          setHealthLabel("Operational · Demo");
          setHealthTone("demo");
          return;
        }
        if (health.status === "ok") {
          setHealthLabel("Operational");
          setHealthTone("live");
          return;
        }
        setHealthLabel("Degraded");
        setHealthTone("offline");
      } catch {
        if (!mounted) return;
        setHealthLabel("Offline");
        setHealthTone("offline");
      }
    };

    void loadHealth();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      className={`panel analytics-dashboard ${isHighContrast ? "analytics-dashboard--contrast" : ""}`}
      aria-label="Bhrigu analytics flagship dashboard"
    >
      <div className="analytics-hero">
        <div className="analytics-hero__copy">
          <p className="eyebrow">Flagship Analytics</p>
          <h1>{isHindi ? "कर्मिक विश्लेषण मंडल" : "Karmic Analytics Mandala"}</h1>
          <p className="muted">
            {isHindi
              ? "भृगु संहिता की विरासत और नाड़ी ज्योतिष की सटीकता के साथ भविष्यवाणियों का अनावरण करें।"
              : "Reveal predictions with Bhrigu Samhita lineage and Nadi Jotisha precision."}
          </p>
          <div className="analytics-hero__actions">
            <div className="subtle-pill-row" aria-live="polite">
              <span className={`pill tool-card__status tool-card__status--${healthTone}`}>
                {healthLabel}
              </span>
              <span className="pill">A/B ready · Animated mandala</span>
            </div>
            <div className="analytics-toggle-row" role="group" aria-label="Display toggles">
              <button
                type="button"
                className="analytics-toggle"
                aria-pressed={isHindi}
                onClick={() => setIsHindi((value) => !value)}
              >
                {isHindi ? "हिन्दी" : "English"}
              </button>
              <button
                type="button"
                className="analytics-toggle"
                aria-pressed={isHighContrast}
                onClick={() => setIsHighContrast((value) => !value)}
              >
                {isHighContrast ? "Standard contrast" : "High contrast"}
              </button>
            </div>
          </div>
        </div>
        <div className="analytics-hero__mandala" aria-hidden="true">
          <div className="mandala-ring mandala-ring--outer" />
          <div className="mandala-ring mandala-ring--middle" />
          <div className="mandala-ring mandala-ring--inner" />
          <div className="mandala-core">ॐ</div>
        </div>
      </div>

      <div className="analytics-insights" aria-label="Precision highlights">
        {insightTiles.map((tile) => (
          <div key={tile.title} className="analytics-insight">
            <h3>{tile.title}</h3>
            <p className="muted">{tile.description}</p>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        <article className="analytics-card" aria-label="Karmic epoch chart">
          <header className="analytics-card__header">
            <div>
              <p className="eyebrow">Karmic Epoch</p>
              <h2>{isHindi ? "कर्मिक भार" : "Karmic Weighting"}</h2>
            </div>
            <span className="pill">Mandala bars</span>
          </header>
          <div className="analytics-bars" role="list">
            {karmicEpochs.map((epoch) => (
              <div key={epoch.label} className="analytics-bar" role="listitem">
                <div className="analytics-bar__meta">
                  <div>
                    <h3>{epoch.label}</h3>
                    <p className="muted">{epoch.mantra}</p>
                  </div>
                  <span className="analytics-bar__value" aria-hidden="true">
                    {epoch.weight}%
                  </span>
                </div>
                <div
                  className="analytics-bar__track"
                  role="img"
                  aria-label={`${epoch.label} karmic weight ${epoch.weight}%`}
                >
                  <span className="analytics-bar__fill" style={{ width: `${epoch.weight}%` }} />
                </div>
                <span className="analytics-tooltip" role="note">
                  {epoch.citation}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-card analytics-card--wheel" aria-label="Nadi birth chart">
          <header className="analytics-card__header">
            <div>
              <p className="eyebrow">Birth Chart</p>
              <h2>{isHindi ? "नाड़ी ग्रह चक्र" : "Nadi Planetary Wheel"}</h2>
            </div>
            <span className="pill">Exact house placements</span>
          </header>
          <div className="birth-wheel" role="img" aria-label="Nadi style wheel with 12 houses">
            {birthChartHouses.map((house, index) => (
              <span
                key={house}
                className="birth-wheel__house"
                style={{ "--house-index": index } as CSSProperties}
              >
                {house}
              </span>
            ))}
            <div className="birth-wheel__center">
              <p className="sanskrit-cite">नाड़ी 0.5°</p>
              <span className="muted">Precision locked</span>
            </div>
          </div>
          <p className="analytics-caption">
            {isHindi
              ? "प्रत्येक भाव नाड़ी नियमों के अनुसार अंकित है।"
              : "Each house is placed per Nadi rules with manuscript-aligned degrees."}
          </p>
        </article>

        <article className="analytics-card analytics-card--timeline" aria-label="Predictions timeline">
          <header className="analytics-card__header">
            <div>
              <p className="eyebrow">Predictions Timeline</p>
              <h2>{isHindi ? "भविष्यवाणी पथ" : "Fate Trajectory"}</h2>
            </div>
            <span className="pill">Animated arcs</span>
          </header>
          <div className="timeline">
            {predictionTimeline.map((item) => (
              <div key={item.era} className="timeline-item">
                <div className="timeline-item__header">
                  <span className="timeline-item__era">{item.era}</span>
                  <span className="timeline-item__arc" aria-hidden="true" />
                </div>
                <h3>{item.title}</h3>
                <p className="muted">{item.insight}</p>
                <span className="analytics-tooltip" role="note">
                  {item.citation}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="analytics-card analytics-card--remedies" aria-label="Remedies and rituals">
          <header className="analytics-card__header">
            <div>
              <p className="eyebrow">Remedies</p>
              <h2>{isHindi ? "उपाय अनुष्ठान" : "Ritual Alignments"}</h2>
            </div>
            <span className="pill">Animated glyphs</span>
          </header>
          <div className="remedy-grid">
            {remedies.map((remedy) => (
              <div key={remedy.label} className="remedy-tile" role="group" aria-label={remedy.label}>
                <span className="remedy-icon" aria-hidden="true">
                  {remedy.icon}
                </span>
                <div>
                  <h3>{remedy.label}</h3>
                  <p className="muted">{remedy.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="analytics-caption">
            <span className="sanskrit-cite">“यथा कर्म तथा फलम्”</span>
            <span className="muted">Remedy cards animate on hover for engagement tests.</span>
          </div>
        </article>
      </div>

      <div className="analytics-validation" aria-label="UX validation tests">
        <div className="validation-card">
          <h3>{isHindi ? "उपयोगकर्ता प्रवाह परीक्षण" : "User flow simulation"}</h3>
          <p className="muted">
            {isHindi
              ? "जन्म डेटा इनपुट से अंतर्दृष्टि तक स्पष्ट मार्ग दिखाता है।"
              : "Seeker enters birth data and reaches insights with guided prompts."}
          </p>
          <span className="pill">Step-by-step clarity</span>
        </div>
        <div className="validation-card">
          <h3>{isHindi ? "ए/बी डिजाइन तुलना" : "A/B design comparison"}</h3>
          <p className="muted">
            {isHindi
              ? "स्टैटिक बनाम एनिमेटेड मंडल; लक्ष्य 90% एंगेजमेंट।"
              : "Static vs animated mandala; target 90% preference for motion."}
          </p>
          <span className="pill">Engagement benchmark</span>
        </div>
        <div className="validation-card">
          <h3>{isHindi ? "स्टाइल गाइड और आइकन" : "Style guide & iconography"}</h3>
          <p className="muted">
            {isHindi
              ? "इंटर बॉडी टेक्स्ट और नोतो सेरिफ़ उद्धरण।"
              : "Inter for body, Noto Serif for citations, SVG icon set ready."}
          </p>
          <span className="pill">Figma + Illustrator</span>
        </div>
      </div>
    </section>
  );
}
