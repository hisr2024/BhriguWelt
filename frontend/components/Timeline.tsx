import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, TouchEvent } from "react";

type TimelineEvent = {
  title: string;
  window: string;
  houseAnchor: string;
  detail: string;
  icon?: string;
  planet?: string;
  progress?: number;
  progressLabel?: string;
  houseIndex?: number;
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const [dragging, setDragging] = useState(false);

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

  const parseHouseIndex = (event: TimelineEvent) => {
    if (event.houseIndex) return event.houseIndex;
    const match = event.houseAnchor.match(/(\d+)/);
    return match ? Number(match[1]) : undefined;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setDragging(true);
    dragStartX.current = event.clientX;
    scrollStartX.current = scrollRef.current.scrollLeft;
    scrollRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !scrollRef.current) return;
    const delta = event.clientX - dragStartX.current;
    scrollRef.current.scrollLeft = scrollStartX.current - delta;
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (scrollRef.current?.hasPointerCapture(event.pointerId)) {
      scrollRef.current.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  };

  return (
    <div className="timeline-shell">
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
            <div className="timeline__orb" aria-hidden="true">
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

      <div
        className={`${accentClass} ${dragging ? "timeline--dragging" : ""}`}
        role="list"
        aria-label="Future timeline anchored to houses"
        ref={scrollRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
      >
        {events.map((event) => {
          const houseNumber = parseHouseIndex(event);
          const progressPercent =
            typeof event.progress === "number"
              ? Math.min(100, Math.max(0, Math.round(event.progress)))
              : undefined;

          return (
            <article key={event.title} className="timeline__node" role="listitem">
              <div className="timeline__orb" aria-hidden="true">
                <span className="timeline__pulse" />
                <span className="timeline__icon" role="img" aria-label={event.title}>
                  {event.icon || event.planet || "✶"}
                </span>
                {event.planet && <span className="timeline__planet">{event.planet}</span>}
              </div>

              <div className="timeline__linkage" aria-hidden="true">
                <span className="timeline__link-line" />
                <span className="timeline__link-node" />
                {houseNumber ? <span className="timeline__link-label">House {houseNumber}</span> : null}
              </div>

              <div className="timeline__meta">
                <p className="pill">{event.houseAnchor}</p>
                <h4>{event.title}</h4>
                <p className="muted">{event.detail}</p>
                <p className="microcopy">{event.window}</p>

                {progressPercent !== undefined ? (
                  <div className="timeline__progress" aria-label={`Progress for ${event.title}`}>
                    <div className="timeline__progress-bar" style={{ width: `${progressPercent}%` }} />
                    <div className="timeline__progress-label">
                      <span>{event.progressLabel || "Karmic resolution"}</span>
                      <span>{progressPercent}%</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
