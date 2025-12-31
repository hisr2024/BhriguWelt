'use client';

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="serene-hero" id="overview">
      <div className="serene-hero__copy">
        <p className="eyebrow">Animated home • Logo</p>
        <h1>BhriguWelt Studio</h1>
        <p className="muted hero-lede">Android & Graphic Designer</p>
        <div className="hero-actions">
          <Link href="/dashboard" className="button-link">
            Open Dashboard
          </Link>
        </div>
      </div>
      <div className="serene-hero__visuals">
        <div className="monogram monogram--hero" aria-hidden>
          <span className="monogram__letter">B</span>
        </div>
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
      </div>
    </section>
  );
}
