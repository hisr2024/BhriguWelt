"use client";

import { useRef } from "react";

type SwipeHandlers = {
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onTouchEnd: () => void;
};

type SwipeCallbacks = {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
};

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 }: SwipeCallbacks): SwipeHandlers {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    active.current = true;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (!active.current || startX.current === null || startY.current === null) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (Math.abs(deltaX) < threshold) return;
    active.current = false;
    if (deltaX > 0) {
      onSwipeRight?.();
    } else {
      onSwipeLeft?.();
    }
  };

  const onTouchEnd = () => {
    active.current = false;
    startX.current = null;
    startY.current = null;
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}
