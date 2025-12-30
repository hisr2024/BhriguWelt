'use client';

import React from "react";

type MotionComponent = React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement> & Record<string, unknown>
>;

type MotionProxy = Record<string, MotionComponent>;

function createMotionComponent(tag: string): MotionComponent {
  const Component = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & Record<string, unknown>>(
    (props, ref) => React.createElement(tag, { ...props, ref }),
  );
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
