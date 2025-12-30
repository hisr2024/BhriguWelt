export default function KundliChart({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`kundli-svg ${className}`}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Kundli chart"
    >
      <rect x="5" y="5" width="190" height="190" rx="18" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M5 5 L195 195" stroke="currentColor" strokeWidth="1.5" />
      <path d="M195 5 L5 195" stroke="currentColor" strokeWidth="1.5" />
      <path d="M100 5 L100 195" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path d="M5 100 L195 100" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="100" cy="100" r="28" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
