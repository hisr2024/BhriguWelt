"use client";

import Link from "next/link";

const tools = [
  { name: "Calendar", href: "/calendar" },
  { name: "Horoscope", href: "/horoscope" },
  { name: "Past Life", href: "/past-life" },
  { name: "Future", href: "/future" },
  { name: "Matchmaking", href: "/matchmaking" },
  { name: "Experience", href: "/experience" },
  { name: "Karma Reset", href: "/karma-reset" },
];

export default function AnalyticsDashboard() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Dashboard</p>
        <h1>All tools</h1>
        <p className="muted">Everything you need in one place.</p>
      </div>
      <div className="panel__content">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="card softly">
              <h3>{tool.name}</h3>
              <p className="muted">Open {tool.name}.</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
