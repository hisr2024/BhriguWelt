import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Talk to an astrologer — coming soon',
  description: 'Verified Vedic astrologers on BhriguWelt, who read your computed chart before they answer.',
};

const POINTS = [
  ['Verified astrologers', 'Every astrologer is checked with a test reading by our Chief Advisor before joining.'],
  ['They see your chart first', 'With your permission, the astrologer sees your computed chart, current periods and reading, so you never have to explain your birth details.'],
  ['Fair to astrologers', 'Astrologers keep most of what you pay. BhriguWelt keeps a small share to run the service.'],
  ['Honest guidance', 'No fear-selling and no pressure to buy remedies.'],
];

export default function AstrologersPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-12 pt-6 md:pt-10">
      <Link href="/bhrigu-predictions" className="flex h-11 w-fit items-center text-sm text-ivory-2">← Readings</Link>
      <p className="nadi-eyebrow mt-2">Coming soon</p>
      <h1 className="mt-1 text-3xl text-ivory md:text-4xl">Talk to an astrologer</h1>
      <p className="mt-3 text-ivory-2">
        Soon you will be able to ask a real Vedic astrologer about your chart, right here in BhriguWelt.
      </p>
      <ul className="mt-6 space-y-3">
        {POINTS.map(([title, text]) => (
          <li key={title} className="nadi-card !p-4">
            <p className="font-display text-lg text-ivory">{title}</p>
            <p className="mt-1 text-sm text-ivory-2">{text}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ivory-muted">
        Until then, every reading in the app is computed from your exact birth chart.
      </p>
      <Link href="/bhrigu-predictions" className="nadi-btn mt-4">Choose a reading</Link>
    </div>
  );
}
