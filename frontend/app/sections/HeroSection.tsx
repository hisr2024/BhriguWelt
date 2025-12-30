'use client';

import Link from "next/link";

import { heroCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";
import { rhythmTracks } from "./sectionData";

export function HeroSection() {
  const { t } = useI18n();
  const { heroBody } = heroCopy;

  return (
    <section className="serene-hero" id="overview">
      <div className="serene-hero__copy">
        <p className="eyebrow">Bharatcentric • Minimal</p>
        <h1>{t("hero.title", "BhriguWelt, now quietly reset")}</h1>
        <p className="muted hero-lede">
          {t(
            "hero.body",
            heroBody ||
              "A soft astrology workspace to collect details, convert calendars, and share bilingual remedies without clutter."
          )}
        </p>
        <div className="hero-actions">
          <Link href="#birth-details" className="button-link">
            {t("hero.cta.horoscope", "Begin horoscope")}
          </Link>
          <Link href="#matchmaking" className="ghost-button">
            {t("hero.cta.matchmaking", "Check compatibility")}
          </Link>
        </div>
        <div className="subtle-pill-row">
          <span className="pill">Śaka friendly</span>
          <span className="pill">English + हिंदी</span>
          <span className="pill">PDF ready</span>
        </div>
        <div className="geometry-breath">
          <span className="pill ghost">Cosmic geometry kept light</span>
          <span className="pill ghost">Pastel gradients, warm + cool</span>
          <span className="pill ghost">Nature-led layouts</span>
        </div>
      </div>
      <div className="serene-hero__visuals">
        <div
          className="aether-visual"
          role="img"
          aria-label="Pastel mountains over a river at dawn with subtle geometry"
        >
          <span className="aether-aurora" aria-hidden />
          <span className="aether-sun" aria-hidden />
          <span className="aether-peak left" aria-hidden />
          <span className="aether-peak right" aria-hidden />
          <span className="aether-water" aria-hidden />
          <span className="aether-geometry" aria-hidden />
          <span className="aether-leaf" aria-hidden />
          <span className="aether-leaf delay" aria-hidden />
        </div>
        <div className="listening-card" aria-label="Soothing music">
          <p className="eyebrow">Serene music</p>
          <h3>Let the session breathe</h3>
          <p className="muted">Layer soft water, wind, chimes, and bells beneath your readings.</p>
          <div className="sound-grid" role="list">
            {rhythmTracks.map((track, index) => (
              <div key={track.src} className="audio-tile" role="listitem">
                <div>
                  <strong>{track.title}</strong>
                  <p className="microcopy">{track.description}</p>
                </div>
                <audio controls autoPlay={index === 0} loop preload="auto" aria-label={track.title}>
                  <source src={track.src} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ))}
          </div>
        </div>
        <div className="immersion-card" aria-label="Immersive constellation cues">
          <p className="eyebrow">Immersion cues</p>
          <h3>Constellations react gently</h3>
          <p className="muted">
            Subtle glows confirm chart accuracy, haptics mark milestones, and errors surface as soft, actionable prompts.
          </p>
          <ul className="immersion-list">
            <li>Cosmic progress rings show chart generation in real time.</li>
            <li>Accessibility presets keep contrast, font, and motion in balance.</li>
            <li>Micro-animations guide you without overwhelming the view.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
