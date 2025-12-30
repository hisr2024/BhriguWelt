"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "../lib/framer-motion";
import { getFloatAnimation } from "../lib/animations";

type AnimatedLogoProps = {
  size?: "small" | "large";
};

export default function AnimatedLogo({ size = "large" }: AnimatedLogoProps) {
  const reduceMotion = useReducedMotion();
  const floatAnimation = getFloatAnimation(reduceMotion, { y: 6, rotate: 6, duration: 6.4 });

  const orbitAnimation = reduceMotion
    ? undefined
    : {
        rotate: 360,
      };

  const orbitTransition = reduceMotion
    ? undefined
    : {
        duration: 24,
        repeat: Infinity,
        ease: "linear",
      };

  const glowAnimation = reduceMotion
    ? undefined
    : {
        opacity: [0.6, 1, 0.6],
        scale: [0.96, 1.05, 0.96],
      };

  const glowTransition = reduceMotion
    ? undefined
    : {
        duration: 4.8,
        repeat: Infinity,
        ease: "easeInOut",
      };

  return (
    <div className="logo-stack" style={size === "small" ? { width: "72px" } : undefined}>
      <motion.div
        className="logo-glow"
        animate={glowAnimation}
        transition={glowTransition}
        aria-hidden="true"
      />
      <motion.div className="logo-orbit" animate={orbitAnimation} transition={orbitTransition} aria-hidden="true">
        <span className="logo-orbit__dot" />
      </motion.div>
      <motion.div
        className="logo-mark"
        animate={floatAnimation.animate}
        transition={floatAnimation.transition}
        whileHover={reduceMotion ? undefined : { scale: 1.03, rotate: 1.5 }}
      >
        <Image src="/logo.svg" alt="BhriguWelt" width={220} height={220} priority={size === "large"} />
      </motion.div>
    </div>
  );
}
