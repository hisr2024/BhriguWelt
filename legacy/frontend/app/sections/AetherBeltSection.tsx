'use client';

export function AetherBeltSection() {
  return (
    <section className="aether-belt softly" aria-label="Calm visual system">
      <div className="aether-belt__copy">
        <p className="eyebrow">Nature as the altar</p>
        <h2>Minimal, modern, timeless</h2>
        <p className="muted">
          Warm dawn light, gentle rivers, and geometric halos keep the interface sacred yet functional.
          Smooth transitions and high-contrast typography stay readable at every step.
        </p>
        <div className="aether-points">
          <div>
            <strong>Subtle cosmic geometry</strong>
            <p className="microcopy">Fine-line yantra hints and harmonic symmetry embedded as soft overlays.</p>
          </div>
          <div>
            <strong>Pastel gradients</strong>
            <p className="microcopy">Dawn-to-dusk hues balance cool mists and warm sand for clarity.</p>
          </div>
          <div>
            <strong>Fluid motion</strong>
            <p className="microcopy">Leaves and ripples drift slowly to signal calm without clutter.</p>
          </div>
        </div>
      </div>
      <div className="aether-belt__scene" aria-hidden>
        <div className="aether-belt__panel">
          <div className="aether-visual small">
            <span className="aether-aurora" aria-hidden />
            <span className="aether-sun" aria-hidden />
            <span className="aether-peak left" aria-hidden />
            <span className="aether-peak right" aria-hidden />
            <span className="aether-water" aria-hidden />
            <span className="aether-geometry" aria-hidden />
            <span className="aether-leaf" aria-hidden />
          </div>
          <div className="aether-belt__legend">
            <span className="pill">Mountains</span>
            <span className="pill">River</span>
            <span className="pill">Sky gradient</span>
            <span className="pill">Yantra grid</span>
          </div>
        </div>
        <div className="aether-belt__scene-card">
          <p className="eyebrow">Always-on clarity</p>
          <p className="muted">Balanced weight across headings, body copy, and microcopy.</p>
          <div className="scene-badges">
            <span className="pill">Serene</span>
            <span className="pill">Devotional</span>
            <span className="pill">Data-backed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
