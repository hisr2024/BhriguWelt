'use client';

import { useRef } from 'react';

type AccordionProps = {
  children: React.ReactNode;
  className?: string;
};

const NAV_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'] as const;

type NavKey = (typeof NAV_KEYS)[number];

export const Accordion = ({ children, className }: AccordionProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!NAV_KEYS.includes(event.key as NavKey)) {
      return;
    }

    const triggers = Array.from(
      containerRef.current?.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger="true"]') ?? []
    );

    if (triggers.length === 0) {
      return;
    }

    const activeElement = document.activeElement as HTMLButtonElement | null;
    const currentIndex = activeElement ? triggers.indexOf(activeElement) : -1;

    if (currentIndex === -1) {
      return;
    }

    event.preventDefault();

    const focusTrigger = (nextIndex: number) => {
      triggers[nextIndex]?.focus();
    };

    switch (event.key) {
      case 'ArrowDown':
        focusTrigger((currentIndex + 1) % triggers.length);
        break;
      case 'ArrowUp':
        focusTrigger((currentIndex - 1 + triggers.length) % triggers.length);
        break;
      case 'Home':
        focusTrigger(0);
        break;
      case 'End':
        focusTrigger(triggers.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
};
