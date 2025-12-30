"use client";

import { motion } from "@/lib/framer-motion";

type AnimatedLogoProps = {
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export default function AnimatedLogo({ size = "md" }: AnimatedLogoProps) {
  return (
    <div className={`relative ${sizeMap[size]} flex items-center justify-center`}>
      <motion.div
        className="absolute inset-0 rounded-full border border-neon-cyan/40 shadow-neon"
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-2 rounded-full border border-neon-purple/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-4 rounded-full bg-gradient-to-br from-neon-cyan/30 via-neon-purple/20 to-neon-pink/30 blur"
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10 flex h-2/3 w-2/3 items-center justify-center rounded-full bg-cosmic-700/80 text-lg font-semibold text-white">
        BW
      </div>
    </div>
  );
}
