'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
}

/**
 * Hook for detecting swipe gestures on an element
 */
export function useSwipeGesture<T extends HTMLElement>(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    preventScroll = false,
  } = options;

  const ref = useRef<T>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
      startTime.current = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScroll) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startPos.current.x;
      const deltaY = touch.clientY - startPos.current.y;
      const deltaTime = Date.now() - startTime.current;
      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine if horizontal or vertical swipe
      if (absX > absY) {
        // Horizontal swipe
        if (absX > threshold || velocityX > velocityThreshold) {
          if (deltaX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (absY > threshold || velocityY > velocityThreshold) {
          if (deltaY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, velocityThreshold, preventScroll]);

  return ref;
}

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullProgress: number;
}

/**
 * Hook for implementing pull-to-refresh functionality
 */
export function usePullToRefresh<T extends HTMLElement>(options: PullToRefreshOptions) {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options;

  const ref = useRef<T>(null);
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullProgress: 0,
  });

  const startY = useRef(0);
  const currentY = useRef(0);

  const handleRefresh = useCallback(async () => {
    setState(prev => ({ ...prev, isRefreshing: true, pullProgress: 1 }));

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([15, 50, 15]);
    }

    try {
      await onRefresh();
    } finally {
      setState({ isPulling: false, isRefreshing: false, pullProgress: 0 });
    }
  }, [onRefresh]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only activate if scrolled to top
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        setState(prev => ({ ...prev, isPulling: true }));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!state.isPulling || state.isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      if (deltaY > 0 && element.scrollTop === 0) {
        e.preventDefault();
        const progress = Math.min(deltaY / (threshold * resistance), 1);
        setState(prev => ({ ...prev, pullProgress: progress }));
      }
    };

    const handleTouchEnd = () => {
      if (state.isRefreshing) return;

      if (state.pullProgress >= 1) {
        handleRefresh();
      } else {
        setState({ isPulling: false, isRefreshing: false, pullProgress: 0 });
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [state.isPulling, state.isRefreshing, state.pullProgress, threshold, resistance, handleRefresh]);

  return { ref, ...state };
}

interface LongPressOptions {
  delay?: number;
  onLongPress: () => void;
  onLongPressEnd?: () => void;
  hapticFeedback?: boolean;
}

/**
 * Hook for detecting long press gestures
 */
export function useLongPress<T extends HTMLElement>(options: LongPressOptions) {
  const { delay = 500, onLongPress, onLongPressEnd, hapticFeedback = true } = options;

  const ref = useRef<T>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isLongPressing = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleStart = () => {
      timeoutRef.current = setTimeout(() => {
        isLongPressing.current = true;
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(20);
        }
        onLongPress();
      }, delay);
    };

    const handleEnd = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (isLongPressing.current) {
        onLongPressEnd?.();
        isLongPressing.current = false;
      }
    };

    const handleMove = () => {
      // Cancel long press if user moves
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    element.addEventListener('touchstart', handleStart, { passive: true });
    element.addEventListener('touchend', handleEnd, { passive: true });
    element.addEventListener('touchmove', handleMove, { passive: true });
    element.addEventListener('touchcancel', handleEnd, { passive: true });
    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mouseup', handleEnd);
    element.addEventListener('mouseleave', handleEnd);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('touchmove', handleMove);
      element.removeEventListener('touchcancel', handleEnd);
      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('mouseup', handleEnd);
      element.removeEventListener('mouseleave', handleEnd);
    };
  }, [delay, onLongPress, onLongPressEnd, hapticFeedback]);

  return ref;
}

interface DoubleTapOptions {
  delay?: number;
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  hapticFeedback?: boolean;
}

/**
 * Hook for detecting double tap gestures
 */
export function useDoubleTap<T extends HTMLElement>(options: DoubleTapOptions) {
  const { delay = 300, onDoubleTap, onSingleTap, hapticFeedback = true } = options;

  const ref = useRef<T>(null);
  const lastTap = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTap = () => {
      const now = Date.now();
      const timeDiff = now - lastTap.current;

      if (timeDiff < delay && timeDiff > 0) {
        // Double tap detected
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }
        onDoubleTap();
      } else {
        // Single tap - wait to see if it becomes double tap
        timeoutRef.current = setTimeout(() => {
          onSingleTap?.();
        }, delay);
      }

      lastTap.current = now;
    };

    element.addEventListener('touchend', handleTap, { passive: true });
    element.addEventListener('click', handleTap);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      element.removeEventListener('touchend', handleTap);
      element.removeEventListener('click', handleTap);
    };
  }, [delay, onDoubleTap, onSingleTap, hapticFeedback]);

  return ref;
}

interface PinchZoomState {
  scale: number;
  origin: { x: number; y: number };
}

interface PinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  onZoomChange?: (state: PinchZoomState) => void;
}

/**
 * Hook for pinch-to-zoom functionality
 */
export function usePinchZoom<T extends HTMLElement>(options: PinchZoomOptions = {}) {
  const { minScale = 1, maxScale = 3, onZoomChange } = options;

  const ref = useRef<T>(null);
  const [state, setState] = useState<PinchZoomState>({
    scale: 1,
    origin: { x: 0, y: 0 },
  });

  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touches: TouchList) => {
      if (touches.length < 2) return { x: 0, y: 0 };
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDistance.current = getDistance(e.touches);
        initialScale.current = state.scale;

        const center = getCenter(e.touches);
        const rect = element.getBoundingClientRect();
        setState(prev => ({
          ...prev,
          origin: {
            x: center.x - rect.left,
            y: center.y - rect.top,
          },
        }));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current > 0) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const scale = Math.min(
          maxScale,
          Math.max(minScale, (currentDistance / initialDistance.current) * initialScale.current)
        );

        const newState = { ...state, scale };
        setState(newState);
        onZoomChange?.(newState);
      }
    };

    const handleTouchEnd = () => {
      initialDistance.current = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [state, minScale, maxScale, onZoomChange]);

  const reset = useCallback(() => {
    setState({ scale: 1, origin: { x: 0, y: 0 } });
  }, []);

  return { ref, ...state, reset };
}
