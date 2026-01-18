'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

type ScrollDirection = 'up' | 'down' | null;

interface ScrollDirectionOptions {
  threshold?: number;
  initialDirection?: ScrollDirection;
}

/**
 * Hook to detect scroll direction
 */
export function useScrollDirection(options: ScrollDirectionOptions = {}) {
  const { threshold = 10, initialDirection = null } = options;

  const [direction, setDirection] = useState<ScrollDirection>(initialDirection);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;

      // Update top/bottom status
      setIsAtTop(currentScrollY <= 0);
      setIsAtBottom(currentScrollY >= maxScrollY - 10);

      // Determine direction
      if (Math.abs(currentScrollY - lastScrollY.current) < threshold) {
        return;
      }

      const newDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
      setDirection(newDirection);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return { direction, isAtTop, isAtBottom };
}

interface ScrollPosition {
  x: number;
  y: number;
  xProgress: number;
  yProgress: number;
}

/**
 * Hook to track scroll position
 */
export function useScrollPosition() {
  const [position, setPosition] = useState<ScrollPosition>({
    x: 0,
    y: 0,
    xProgress: 0,
    yProgress: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      const x = window.scrollX;
      const y = window.scrollY;
      const maxX = document.documentElement.scrollWidth - window.innerWidth;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;

      setPosition({
        x,
        y,
        xProgress: maxX > 0 ? x / maxX : 0,
        yProgress: maxY > 0 ? y / maxY : 0,
      });
    };

    handleScroll(); // Initial position
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return position;
}

interface InfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  threshold?: number;
  hasMore?: boolean;
  rootMargin?: string;
}

/**
 * Hook for implementing infinite scroll
 */
export function useInfiniteScroll<T extends HTMLElement>(options: InfiniteScrollOptions) {
  const { onLoadMore, threshold = 200, hasMore = true, rootMargin = '100px' } = options;

  const ref = useRef<T>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      await onLoadMore();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more'));
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [onLoadMore, hasMore]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Use Intersection Observer for the sentinel element approach
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadMore();
        }
      },
      {
        rootMargin,
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, hasMore, rootMargin]);

  // Fallback scroll-based detection
  useEffect(() => {
    const handleScroll = () => {
      if (loadingRef.current || !hasMore) return;

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loadMore, threshold, hasMore]);

  return { ref, isLoading, error, loadMore };
}

interface ScrollToOptions {
  behavior?: ScrollBehavior;
  offset?: number;
}

/**
 * Hook for smooth scrolling utilities
 */
export function useScrollTo() {
  const scrollToTop = useCallback((options: ScrollToOptions = {}) => {
    const { behavior = 'smooth', offset = 0 } = options;
    window.scrollTo({ top: offset, behavior });
  }, []);

  const scrollToBottom = useCallback((options: ScrollToOptions = {}) => {
    const { behavior = 'smooth', offset = 0 } = options;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: maxScroll - offset, behavior });
  }, []);

  const scrollToElement = useCallback(
    (element: HTMLElement | string, options: ScrollToOptions = {}) => {
      const { behavior = 'smooth', offset = 0 } = options;
      const el = typeof element === 'string' ? document.querySelector(element) : element;

      if (el) {
        const rect = el.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top - offset;
        window.scrollTo({ top: absoluteTop, behavior });
      }
    },
    []
  );

  const scrollToY = useCallback((y: number, options: ScrollToOptions = {}) => {
    const { behavior = 'smooth' } = options;
    window.scrollTo({ top: y, behavior });
  }, []);

  return { scrollToTop, scrollToBottom, scrollToElement, scrollToY };
}

interface ScrollLockOptions {
  allowScroll?: boolean;
}

/**
 * Hook to lock/unlock body scroll (useful for modals)
 */
export function useScrollLock(options: ScrollLockOptions = {}) {
  const { allowScroll = false } = options;

  useEffect(() => {
    if (!allowScroll) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [allowScroll]);
}

/**
 * Hook to detect when element is in viewport
 */
export function useInView<T extends HTMLElement>(options: IntersectionObserverInit = {}) {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasBeenInView(true);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref, isInView, hasBeenInView };
}
