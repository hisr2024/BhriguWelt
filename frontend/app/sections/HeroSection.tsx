'use client';

import Link from "next/link";

import { heroCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";
import { KiaanLogoAnimated } from "@/components/branding/KiaanLogo";
import { MindVibeLockup } from "@/components/branding/MindVibeLogo";
import { rhythmTracks } from "./sectionData";

export function HeroSection() {
  const { t } = useI18n();
  const { heroBody } = heroCopy;

  return (
    <section className="serene-hero" id="overview">
      <div className="serene-hero__copy">
        <p className="eyebrow">MindVibe • Universal calm</p>
        <h1>{t("hero.title", "KIAAN — MindVibe Companion")}</h1>
        <p className="muted hero-lede">
          {t(
            "hero.body",
            heroBody ||
              "A premium companion that blends breath-led motion, glowing gradients, and emotionally intelligent guidance for every seeker."
          )}
        </p>
        <div className="hero-actions">
          <Link href="#birth-details" className="button-link">
            {t("hero.cta.horoscope", "Begin the calm session")}
          </Link>
          <Link href="#matchmaking" className="ghost-button">
            {t("hero.cta.matchmaking", "Explore companionship")}
          </Link>
        </div>
        <div className="subtle-pill-row">
          <span className="pill">KIAAN — MindVibe Companion</span>
          <span className="pill">Calming motion system</span>
          <span className="pill">Inclusive microcopy</span>
        </div>
        <div className="geometry-breath">
          <span className="pill ghost">MvGradient Sunrise · Ocean · Aurora</span>
          <span className="pill ghost">Feather shimmer + flute resonance</span>
          <span className="pill ghost">Triangle energy flow tabs</span>
        </div>
        <div className="hero-lockup">
          <MindVibeLockup tagline="Soft gradients, timeless calm." />
          <KiaanLogoAnimated reducedMotion={false} />
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
      </div>
    </section>
  );
}
