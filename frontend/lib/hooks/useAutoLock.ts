/**
 * Auto-lock functionality for security
 * Automatically locks the app after inactivity
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';

interface AutoLockOptions {
  enabled: boolean;
  timeoutSeconds: number;
  onLock: () => void;
}

/**
 * Hook for auto-lock functionality
 * Tracks user activity and locks after inactivity timeout
 */
export function useAutoLock({ enabled, timeoutSeconds, onLock }: AutoLockOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't set new timeout if disabled
    if (!enabled) {
      return;
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onLock();
    }, timeoutSeconds * 1000);
  }, [enabled, timeoutSeconds, onLock]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Start timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Handle visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - start countdown
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, timeoutSeconds * 1000 - elapsed);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(onLock, remaining);
      } else {
        // Tab visible - reset timer
        resetTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, resetTimer, onLock, timeoutSeconds]);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current,
  };
}

/**
 * Hook for app lock on tab switch/minimize
 * Immediately locks when app goes to background
 */
export function useLockOnBackground(onLock: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Lock immediately when tab hidden
        onLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onLock, enabled]);
}

/**
 * Hook for detecting when app goes offline
 */
export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Get remaining time until auto-lock
 */
export function useTimeUntilLock(
  lastActivity: number,
  timeoutSeconds: number
): number {
  const [remainingSeconds, setRemainingSeconds] = useState(timeoutSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivity) / 1000);
      const remaining = Math.max(0, timeoutSeconds - elapsed);
      setRemainingSeconds(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, timeoutSeconds]);

  return remainingSeconds;
}

// Import useState for useOfflineDetection
import { useState } from 'react';
