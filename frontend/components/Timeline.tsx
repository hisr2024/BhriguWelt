import React, { useMemo, useRef, useState } from "react";

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const houses = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const activeHouses = useMemo(() => {
    return new Set(
      events
        .map((event) => {
          if (event.houseIndex) return event.houseIndex;
          const match = event.houseAnchor.match(/(\d+)/);
          return match ? Number(match[1]) : undefined;
        })
        .filter(Boolean) as number[],
    );
  }, [events]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setDragging(true);
    dragStartX.current = event.clientX;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !scrollRef.current) return;
    event.preventDefault();
    const delta = event.clientX - dragStartX.current;
    scrollRef.current.scrollLeft = dragScrollLeft.current - delta;
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    setDragging(false);
    if (scrollRef.current.hasPointerCapture(event.pointerId)) {
      scrollRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const parseHouseIndex = (event: TimelineEvent) => {
    if (event.houseIndex) return event.houseIndex;
    const match = event.houseAnchor.match(/(\d+)/);
    return match ? Number(match[1]) : undefined;
  };

  return (
    <div className="timeline-shell">
      <div className="timeline__house-band" aria-label="Twelve-house anchors with overlay links">
        {houses.map((house) => (
          <div key={house} className={`timeline__house ${activeHouses.has(house) ? "active" : ""}`}>
            <span className="timeline__house-index">House {house}</span>
            <span className="timeline__house-rail" />
          </div>
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
              <div className="timeline__orb" aria-hidden>
                <span className="timeline__pulse" />
                <span className="timeline__icon" role="img" aria-label={event.title}>
                  {event.icon || event.planet || "✶"}
                </span>
                {event.planet && <span className="timeline__planet">{event.planet}</span>}
              </div>

              <div className="timeline__linkage" aria-hidden>
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
