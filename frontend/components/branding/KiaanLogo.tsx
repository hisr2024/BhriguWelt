import React from "react";

type LogoProps = {
  compact?: boolean;
  reducedMotion?: boolean;
};

export function KiaanLogoStatic({ compact }: LogoProps) {
  return (
    <div className={`kiaan-logo ${compact ? "compact" : ""}`} role="img" aria-label="KIAAN — MindVibe Companion logo">
      <span className="kiaan-logo__wordmark">KIAAN</span>
      <span className="kiaan-logo__subtitle">MindVibe Companion</span>
    </div>
  );
}

export function KiaanLogoAnimated({ compact, reducedMotion }: LogoProps) {
  if (reducedMotion) {
    return <KiaanLogoStatic compact={compact} />;
  }

  return (
    <div className={`kiaan-logo kiaan-logo--animated ${compact ? "compact" : ""}`} role="img" aria-label="Animated KIAAN logo">
      <div className="kiaan-logo__flute" aria-hidden>
        <span className="kiaan-logo__shimmer" />
        <span className="kiaan-logo__shimmer tail" />
      </div>
      <div className="kiaan-logo__feather" aria-hidden>
        <span className="kiaan-feather__stem" />
        <span className="kiaan-feather__eye" />
        <span className="kiaan-feather__aura" />
      </div>
      <div className="kiaan-logo__ripple" aria-hidden>
        <span className="kiaan-ripple__ring" />
        <span className="kiaan-ripple__ring delay" />
      </div>
      <span className="kiaan-logo__wordmark">KIAAN</span>
      <span className="kiaan-logo__subtitle">MindVibe Companion</span>
    </div>
  );
}
