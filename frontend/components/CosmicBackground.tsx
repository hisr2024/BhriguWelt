"use client";

import { motion } from "framer-motion";

const particles = [
  { x: 8, y: 22, size: 2, delay: 0 },
  { x: 16, y: 72, size: 1, delay: 0.4 },
  { x: 28, y: 32, size: 1, delay: 0.8 },
  { x: 36, y: 62, size: 2, delay: 0.2 },
  { x: 44, y: 18, size: 1, delay: 0.6 },
  { x: 52, y: 44, size: 1, delay: 0.1 },
  { x: 62, y: 14, size: 2, delay: 0.5 },
  { x: 68, y: 72, size: 1, delay: 0.3 },
  { x: 74, y: 34, size: 1, delay: 0.9 },
  { x: 82, y: 58, size: 2, delay: 0.7 },
  { x: 90, y: 20, size: 1, delay: 0.2 },
  { x: 12, y: 48, size: 1, delay: 0.7 },
  { x: 22, y: 12, size: 1, delay: 0.3 },
  { x: 32, y: 88, size: 2, delay: 0.5 },
  { x: 48, y: 74, size: 1, delay: 0.1 },
  { x: 58, y: 26, size: 2, delay: 0.6 },
  { x: 70, y: 82, size: 1, delay: 0.4 },
  { x: 86, y: 70, size: 2, delay: 0.8 },
];

export default function CosmicBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute inset-0 bg-cosmic-radial" />
      <div className="absolute -top-20 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cosmic-glow blur-3xl" />
      <div className="absolute inset-0">
        {particles.map((particle, index) => (
          <span
            key={`particle-${index}`}
            className="cosmic-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size + 1}px`,
              height: `${particle.size + 1}px`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>
      <motion.div
        className="absolute right-10 top-16 h-32 w-32 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-10 left-12 h-48 w-48 rounded-full border border-indigo-400/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
