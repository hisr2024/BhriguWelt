'use client';

import React from "react";

type MotionComponent = React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement> & Record<string, unknown>
>;

type MotionProxy = Record<string, MotionComponent>;

type MotionProps = React.HTMLAttributes<HTMLElement> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  variants?: unknown;
  transition?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  whileInView?: unknown;
};

function createMotionComponent(tag: string): MotionComponent {
  const Component = React.forwardRef<HTMLElement, MotionProps>((props, ref) => {
    const sanitized = { ...props } as Record<string, unknown>;
    delete sanitized.initial;
    delete sanitized.animate;
    delete sanitized.exit;
    delete sanitized.variants;
    delete sanitized.transition;
    delete sanitized.whileHover;
    delete sanitized.whileTap;
    delete sanitized.whileInView;
    return React.createElement(tag, { ...sanitized, ref });
  });
  Component.displayName = `motion.${tag}`;
  return Component;
}

export const motion = new Proxy({} as MotionProxy, {
  get: (_target, key) => {
    if (typeof key !== "string") return undefined;
    return createMotionComponent(key);
  },
});

export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useReducedMotion() {
  return false;
}
