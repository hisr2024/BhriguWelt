import { useMemo } from "react";

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

  return (
    <div className={accentClass} role="list" aria-label="Future timeline anchored to houses">
      {events.map((event) => (
        <article key={event.title} className="timeline__node" role="listitem">
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
