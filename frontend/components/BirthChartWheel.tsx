'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent, TouchEvent } from 'react';

interface PlanetPlacement {
  sign: string;
  degree: number;
  longitude: number;
}

interface BirthChartWheelProps {
  planets: Record<string, PlanetPlacement>;
  size?: number;
  simplified?: boolean;
}

const zodiacSigns = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const planetColors: Record<string, string> = {
  sun: '#fbbf24',
  moon: '#e2e8f0',
  mercury: '#a78bfa',
  venus: '#f472b6',
  mars: '#f87171',
  jupiter: '#f59e0b',
  saturn: '#94a3b8',
  uranus: '#22d3ee',
  neptune: '#60a5fa',
  pluto: '#c084fc',
  rahu: '#8b5cf6',
  ketu: '#22c55e',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function BirthChartWheel({ planets, size = 280, simplified = true }: BirthChartWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const pointerState = useRef<{ lastX?: number; lastY?: number; lastDistance?: number } | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener?.('change', handler);
    return () => mediaQuery.removeEventListener?.('change', handler);
  }, []);

  const planetEntries = useMemo(() => {
    return Object.entries(planets || {}).map(([key, value]) => ({
      key,
      ...value,
    }));
  }, [planets]);

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerState.current = { lastX: event.clientX, lastY: event.clientY };
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!pointerState.current) return;
    const dx = event.clientX - (pointerState.current.lastX ?? event.clientX);
    setRotation((prev) => prev + dx * 0.4);
    pointerState.current.lastX = event.clientX;
    pointerState.current.lastY = event.clientY;
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    pointerState.current = null;
  };

  const handleTouchMove = (event: TouchEvent<SVGSVGElement>) => {
    if (event.touches.length === 2) {
      const [a, b] = event.touches;
      const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pointerState.current?.lastDistance) {
        const delta = distance - pointerState.current.lastDistance;
        setScale((prev) => clamp(prev + delta / 300, 0.8, 1.6));
      }
      pointerState.current = { ...pointerState.current, lastDistance: distance };
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between text-sm text-white/70">
        <span>Rotate: drag</span>
        <span>Zoom: pinch</span>
      </div>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="touch-none select-none rounded-full border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchMove={handleTouchMove}
        role="img"
        aria-label="Natal chart wheel"
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          transition: reducedMotion ? 'none' : 'transform 200ms ease-out',
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 60}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
          fill="transparent"
        />

        {zodiacSigns.map((sign, index) => {
          const angle = (index * 30 - 90) * (Math.PI / 180);
          const x = size / 2 + (size / 2 - 25) * Math.cos(angle);
          const y = size / 2 + (size / 2 - 25) * Math.sin(angle);
          return (
            <text
              key={sign}
              x={x}
              y={y}
              fill="rgba(255,255,255,0.8)"
              fontSize={simplified ? 10 : 12}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {simplified ? sign.slice(0, 3) : sign}
            </text>
          );
        })}

        {planetEntries.map((planet) => {
          const angle = (planet.longitude - 90) * (Math.PI / 180);
          const radius = size / 2 - 80;
          const x = size / 2 + radius * Math.cos(angle);
          const y = size / 2 + radius * Math.sin(angle);
          return (
            <g key={planet.key}>
              <circle
                cx={x}
                cy={y}
                r={10}
                fill={planetColors[planet.key] || '#f8fafc'}
              />
              <text
                x={x}
                y={y + 20}
                fontSize={9}
                fill="rgba(255,255,255,0.8)"
                textAnchor="middle"
              >
                {planet.key.slice(0, 2).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-2 text-xs text-white/60">
        <span className="rounded-full border border-white/10 px-3 py-1">Pinch to zoom</span>
        <span className="rounded-full border border-white/10 px-3 py-1">Drag to rotate</span>
      </div>
    </div>
  );
}
