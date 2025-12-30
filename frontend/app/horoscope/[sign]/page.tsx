import Link from "next/link";
import { notFound } from "next/navigation";

import { getStaticHoroscope, horoscopeSigns } from "@/lib/horoscopeStatic";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return horoscopeSigns.map((sign) => ({ sign }));
}

export default async function HoroscopeSignPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const horoscope = getStaticHoroscope(sign);

  if (!horoscope) {
    notFound();
  }

  return (
    <div className="stack">
      <header className="panel softly">
        <p className="eyebrow">Static horoscope</p>
        <h1>{horoscope.title}</h1>
        <p className="muted">{horoscope.focus}</p>
        <div className="hero-actions">
          <Link href="/horoscope" className="button-link ghost-link">
            Back to chart form
          </Link>
        </div>
      </header>

      <section className="card highlight" aria-label={`Horoscope guidance for ${horoscope.title}`}>
        <div className="section-heading">
          <h2>Guidance for today</h2>
          <p className="muted">Regenerates hourly with Next.js ISR and edge delivery.</p>
        </div>
        <div className="stack">
          <div>
            <p className="eyebrow">Mantra</p>
            <p>{horoscope.mantra}</p>
          </div>
          <div>
            <p className="eyebrow">Guidance</p>
            <p>{horoscope.guidance}</p>
          </div>
          <div>
            <p className="eyebrow">Element</p>
            <p>{horoscope.element}</p>
          </div>
          <div>
            <p className="eyebrow">Ritual</p>
            <p>{horoscope.ritual}</p>
          </div>
          <div>
            <p className="eyebrow">Lucky color</p>
            <p>{horoscope.luckyColor}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
