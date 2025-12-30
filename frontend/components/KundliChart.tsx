import React from "react";

type KundliChartProps = {
  title?: string;
  className?: string;
};

export function KundliChart({ title = "Kundli chart", className = "" }: KundliChartProps) {
  return (
    <div className={`relative w-full max-w-xs aspect-square ${className}`}>
      <svg
        className="kundli-svg h-full w-full rounded-3xl border border-slate-700/60 bg-slate-950/70 shadow-glow"
        viewBox="0 0 200 200"
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id="kundliGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="190" height="190" rx="28" fill="url(#kundliGradient)" opacity="0.15" />
        <rect x="20" y="20" width="160" height="160" rx="22" fill="none" stroke="#e2e8f0" strokeWidth="2" />
        <line x1="20" y1="20" x2="180" y2="180" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="180" y1="20" x2="20" y2="180" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="#475569" strokeWidth="1" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#475569" strokeWidth="1" />
        <circle cx="100" cy="100" r="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="100" y="106" textAnchor="middle" fontSize="12" fill="#f8fafc" fontFamily="sans-serif">
          Asc
        </text>
      </svg>
    </div>
  );
}
