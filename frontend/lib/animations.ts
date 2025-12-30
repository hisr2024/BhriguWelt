"use client";

import type { Easing, Transition, Variants } from "framer-motion";

export const easeOut: Easing = [0, 0, 0.58, 1];
export const easeInOut: Easing = [0.42, 0, 0.58, 1];
export const easeStandard: Easing = [0.2, 0.65, 0.3, 0.9];

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -16, filter: "blur(6px)" },
};

export const pageTransition: Transition = {
  duration: 0.55,
  ease: easeInOut,
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easeOut },
  },
};

export const staggerChildren: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

type FloatOptions = {
  y?: number;
  rotate?: number;
  duration?: number;
  delay?: number;
};

export function getFloatAnimation(reduceMotion: boolean, options: FloatOptions = {}) {
  if (reduceMotion) return { animate: undefined, transition: undefined };

  const { y = 4, rotate = 3, duration = 5.2, delay = 0 } = options;

  return {
    animate: {
      y: [0, -y, 0],
      rotate: [0, -rotate, 0],
      boxShadow: [
        "0 0 0 rgba(129,140,248,0)",
        "0 0 18px rgba(129,140,248,0.28)",
        "0 0 0 rgba(129,140,248,0)",
      ],
    },
    transition: {
      duration,
      ease: easeInOut,
      repeat: Infinity,
      delay,
    },
  };
}

type ButtonMotionOptions = {
  lift?: number;
  scale?: number;
};

export function getButtonMotion(reduceMotion: boolean, options: ButtonMotionOptions = {}) {
  const { lift = 2, scale = 1.02 } = options;
  if (reduceMotion) {
    return {
      whileHover: undefined,
      whileTap: { scale: 0.98 },
    };
  }

  return {
    whileHover: {
      y: -lift,
      scale,
      boxShadow: "0 16px 30px rgba(15,23,42,0.35)",
    },
    whileTap: { scale: 0.98 },
  };
}
