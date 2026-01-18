'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

/**
 * Hook for triggering haptic feedback
 */
export function useHapticFeedback() {
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'vibrate' in navigator;
  }, []);

  const light = useCallback(() => {
    if (isSupported) navigator.vibrate(10);
  }, [isSupported]);

  const medium = useCallback(() => {
    if (isSupported) navigator.vibrate(20);
  }, [isSupported]);

  const heavy = useCallback(() => {
    if (isSupported) navigator.vibrate(30);
  }, [isSupported]);

  const success = useCallback(() => {
    if (isSupported) navigator.vibrate([10, 50, 10]);
  }, [isSupported]);

  const error = useCallback(() => {
    if (isSupported) navigator.vibrate([30, 50, 30, 50, 30]);
  }, [isSupported]);

  const warning = useCallback(() => {
    if (isSupported) navigator.vibrate([20, 30, 20]);
  }, [isSupported]);

  const selection = useCallback(() => {
    if (isSupported) navigator.vibrate(5);
  }, [isSupported]);

  const custom = useCallback((pattern: number | number[]) => {
    if (isSupported) navigator.vibrate(pattern);
  }, [isSupported]);

  return {
    isSupported,
    light,
    medium,
    heavy,
    success,
    error,
    warning,
    selection,
    custom,
  };
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isPWA: boolean;
  isTouchDevice: boolean;
  hasNotch: boolean;
  devicePixelRatio: number;
}

/**
 * Hook for detecting device type and capabilities
 */
export function useMobileDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isPWA: false,
    isTouchDevice: false,
    hasNotch: false,
    devicePixelRatio: 1,
  });

  useEffect(() => {
    const ua = navigator.userAgent;
    const width = window.innerWidth;

    // Device type detection
    const isMobile = width < 768 || /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = width >= 768 && width < 1024 || /iPad|Tablet|PlayBook/i.test(ua);
    const isDesktop = !isMobile && !isTablet;

    // OS detection
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    // Browser detection
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChrome = /Chrome/i.test(ua) && !/Edge/i.test(ua);
    const isFirefox = /Firefox/i.test(ua);

    // PWA detection
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Touch device detection
    const isTouchDevice = 'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    // Notch detection (iPhone X and later)
    const hasNotch = isIOS && window.screen.height >= 812 && window.devicePixelRatio >= 2;

    setDeviceInfo({
      isMobile,
      isTablet,
      isDesktop,
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isFirefox,
      isPWA,
      isTouchDevice,
      hasNotch,
      devicePixelRatio: window.devicePixelRatio || 1,
    });
  }, []);

  return deviceInfo;
}

interface ViewportSize {
  width: number;
  height: number;
  vw: number;
  vh: number;
  svh: number;
  lvh: number;
  dvh: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

/**
 * Hook for tracking viewport size (including dynamic viewport units)
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    vw: typeof window !== 'undefined' ? window.innerWidth / 100 : 0,
    vh: typeof window !== 'undefined' ? window.innerHeight / 100 : 0,
    svh: typeof window !== 'undefined' ? window.innerHeight / 100 : 0, // Approximation
    lvh: typeof window !== 'undefined' ? window.innerHeight / 100 : 0, // Approximation
    dvh: typeof window !== 'undefined' ? window.innerHeight / 100 : 0, // Approximation
    isLandscape: typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false,
    isPortrait: typeof window !== 'undefined' ? window.innerHeight >= window.innerWidth : true,
  });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Calculate viewport units
      const vw = width / 100;
      const vh = height / 100;

      // Small viewport height (without browser UI) - approximation
      const svh = vh;

      // Large viewport height (with browser UI collapsed) - approximation
      const lvh = vh * 1.1; // Rough estimate

      // Dynamic viewport height (current state)
      const dvh = vh;

      setSize({
        width,
        height,
        vw,
        vh,
        svh,
        lvh,
        dvh,
        isLandscape: width > height,
        isPortrait: height >= width,
      });
    };

    // Initial update
    updateSize();

    // Update on resize and orientation change
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    // Visual viewport for mobile address bar
    if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSize);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      if ('visualViewport' in window && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateSize);
      }
    };
  }, []);

  return size;
}

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Hook for getting safe area insets (for notched devices)
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      // Create a temporary element to measure safe area insets
      const el = document.createElement('div');
      el.style.cssText = `
        position: fixed;
        top: env(safe-area-inset-top, 0px);
        right: env(safe-area-inset-right, 0px);
        bottom: env(safe-area-inset-bottom, 0px);
        left: env(safe-area-inset-left, 0px);
        pointer-events: none;
        visibility: hidden;
      `;
      document.body.appendChild(el);

      const computed = window.getComputedStyle(el);

      setInsets({
        top: parseFloat(computed.top) || 0,
        right: parseFloat(computed.right) || 0,
        bottom: parseFloat(computed.bottom) || 0,
        left: parseFloat(computed.left) || 0,
      });

      document.body.removeChild(el);
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
}

/**
 * Hook for detecting reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * Hook for detecting network status
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<{
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      setStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      });
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}

/**
 * Hook for keyboard visibility (mobile)
 */
export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!('visualViewport' in window) || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const initialHeight = viewport.height;

    const handleResize = () => {
      const currentHeight = viewport.height;
      const heightDiff = initialHeight - currentHeight;

      // Keyboard is visible if viewport height decreased significantly
      const isVisible = heightDiff > 100;
      setIsKeyboardVisible(isVisible);
      setKeyboardHeight(isVisible ? heightDiff : 0);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}

/**
 * Hook for detecting color scheme preference
 */
export function useColorScheme(): 'light' | 'dark' {
  const [scheme, setScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setScheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return scheme;
}
