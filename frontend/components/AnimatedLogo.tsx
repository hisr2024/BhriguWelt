'use client';

import { useEffect, useRef, useState } from 'react';

export default function AnimatedLogo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(true); // Start with fallback until Lottie loads
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  useEffect(() => {
    // Skip Lottie loading if user prefers reduced motion
    if (prefersReducedMotion) {
      setUseFallback(true);
      return;
    }

    const loadLottie = async () => {
      try {
        const lottie = (await import('lottie-web')).default;
        const response = await fetch('/assets/logo.json');

        if (!response.ok) {
          throw new Error('Lottie file not found');
        }

        const animationData = await response.json();

        if (containerRef.current) {
          lottie.loadAnimation({
            container: containerRef.current,
            animationData,
            loop: true,
            autoplay: true,
            renderer: 'svg',
          });
          setUseFallback(false);
        }
      } catch (error) {
        console.info('Lottie animation not available, using CSS fallback');
        setUseFallback(true);
      }
    };

    void loadLottie();
  }, [prefersReducedMotion]);

  // Fallback SVG with CSS animation
  if (useFallback) {
    return (
      <div className="logo-fallback" aria-label="BhriguWelt Logo">
        <svg
          className={`logo-svg ${!prefersReducedMotion ? 'logo-animated' : ''}`}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Sacred Geometry - Sri Yantra inspired */}
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4DEEEA', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#8A5CF6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#BEF264', stopOpacity: 1 }} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer circle - cosmic boundary */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Inner circle */}
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="url(#logo-gradient)"
            strokeWidth="1.5"
            opacity="0.4"
          />

          {/* Sacred triangles - upward (Shiva energy) */}
          <polygon
            points="100,30 140,90 60,90"
            fill="none"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            filter="url(#glow)"
          />

          {/* Downward triangle (Shakti energy) */}
          <polygon
            points="100,170 60,110 140,110"
            fill="none"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            filter="url(#glow)"
          />

          {/* Central hexagram */}
          <polygon
            points="100,60 130,100 100,140 70,100"
            fill="rgba(77, 238, 234, 0.1)"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            filter="url(#glow)"
          />

          {/* Om symbol center */}
          <text
            x="100"
            y="110"
            fontSize="40"
            fill="url(#logo-gradient)"
            textAnchor="middle"
            fontFamily="Noto Sans Devanagari, sans-serif"
            fontWeight="600"
            filter="url(#glow)"
          >
            ॐ
          </text>

          {/* Small decorative circles at cardinal points */}
          <circle cx="100" cy="10" r="3" fill="#4DEEEA" opacity="0.8" />
          <circle cx="190" cy="100" r="3" fill="#8A5CF6" opacity="0.8" />
          <circle cx="100" cy="190" r="3" fill="#BEF264" opacity="0.8" />
          <circle cx="10" cy="100" r="3" fill="#FACC15" opacity="0.8" />
        </svg>

        <style jsx>{`
          .logo-fallback {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo-svg {
            width: 100%;
            height: 100%;
            max-width: 120px;
            max-height: 120px;
          }

          @keyframes bhrigu-sacred-spin {
            0% {
              transform: rotate(0deg) scale(1);
              filter: drop-shadow(0 0 8px rgba(77, 238, 234, 0.6));
            }
            33% {
              transform: rotate(120deg) scale(1.03);
              filter: drop-shadow(0 0 12px rgba(138, 92, 246, 0.7));
            }
            66% {
              transform: rotate(240deg) scale(1.03);
              filter: drop-shadow(0 0 12px rgba(190, 242, 100, 0.7));
            }
            100% {
              transform: rotate(360deg) scale(1);
              filter: drop-shadow(0 0 8px rgba(77, 238, 234, 0.6));
            }
          }

          @keyframes bhrigu-pulse {
            0%,
            100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }

          .logo-animated {
            animation: bhrigu-sacred-spin 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          }

          .logo-animated circle,
          .logo-animated polygon,
          .logo-animated text {
            animation: bhrigu-pulse 3s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .logo-animated,
            .logo-animated circle,
            .logo-animated polygon,
            .logo-animated text {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // Lottie container
  return (
    <div
      ref={containerRef}
      className="logo-lottie-container"
      aria-label="BhriguWelt Animated Logo"
      style={{
        width: '100%',
        height: '100%',
        maxWidth: '120px',
        maxHeight: '120px',
      }}
    />
  );
}
