'use client';

import Link from "next/link";

import { ritualCards } from "./sectionData";

export function RitualGrid() {
  return (
    <section className="card-grid" aria-label="Core rituals">
      {ritualCards.map((card) => (
        <article className="card" key={card.title}>
          <p className="eyebrow">Ritual</p>
          <h3>{card.title}</h3>
          <p className="muted">{card.body}</p>
          <Link href={card.href} className="ghost-link">
            {card.action}
          </Link>
        </article>
      ))}
    </section>
  );
}
