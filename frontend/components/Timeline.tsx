import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";

type TimelineEvent = {
  title: string;
  window: string;
  houseAnchor: string;
  detail: string;
  icon?: string;
};

type TimelineProps = {
  events: TimelineEvent[];
  accent?: "aqua" | "pink" | "amber";
};

export default function Timeline({ events, accent = "aqua" }: TimelineProps) {
  const accentClass = useMemo(() => `timeline timeline--${accent}`, [accent]);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const clampIndex = useCallback(
    (nextIndex: number) => {
      if (!events.length) return 0;
      return Math.min(events.length - 1, Math.max(0, nextIndex));
    },
    [events.length],
  );

  useEffect(() => {
    setActiveIndex((index) => clampIndex(index));
  }, [clampIndex]);

  const goNext = useCallback(() => {
    setActiveIndex((index) => clampIndex(index + 1));
  }, [clampIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((index) => clampIndex(index - 1));
  }, [clampIndex]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = event.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    if (Math.abs(touchDeltaX.current) > 48) {
      if (touchDeltaX.current < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  };

  return (
    <div
      className={accentClass}
      role="list"
      aria-label="Future timeline anchored to houses"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {events.map((event, index) => (
        <article
          key={event.title}
          className={`timeline__node ${index === activeIndex ? "timeline__node--active" : ""}`}
          role="listitem"
          aria-current={index === activeIndex ? "true" : undefined}
        >
          <div className="timeline__orb" aria-hidden>
            <span className="timeline__pulse" />
            <span className="timeline__icon" role="img" aria-label={event.title}>
              {event.icon || "✶"}
            </span>
          </div>
          <div className="timeline__meta">
            <p className="pill">{event.houseAnchor}</p>
            <h4>{event.title}</h4>
            <p className="muted">{event.detail}</p>
            <p className="microcopy">{event.window}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
