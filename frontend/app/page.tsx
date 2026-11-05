import Link from 'next/link';
import {
  ArrowIcon, ChartIcon, DiamondChartEmblem, FlameIcon, HourglassIcon, UnionIcon, WheelIcon,
} from '@/components/nadi/icons';

const OFFERINGS = [
  { icon: WheelIcon, title: 'Karmic journey', text: "Your soul's purpose, the lessons of this birth and the karma you carry, read from the 9th, 10th and 12th houses." },
  { icon: HourglassIcon, title: 'Life events, with dates', text: 'Marriage, career turns, relocation and health windows timed by Vimshottari dasha and slow-planet transits.' },
  { icon: FlameIcon, title: 'Classical remedies', text: 'Mantras, charity and observances tied to the specific placements that need support, never generic advice.' },
  { icon: UnionIcon, title: 'Compatibility', text: 'Ashtakoot guna milan on 36 points, with Mangal dosha checks and what the score means for your match.' },
];

const STEPS = [
  { n: 'I', title: 'Enter your birth details', text: 'Date, exact time and place. They stay encrypted on your device behind your passcode.' },
  { n: 'II', title: 'Your chart is computed', text: 'Swiss Ephemeris positions with Lahiri ayanamsa, then Bhrigu Samhita and Nadi rules applied to your placements.' },
  { n: 'III', title: 'Read it your way', text: 'Plain language with dates and actions, or the astrologer view with every yoga, dasha and source rule.' },
];

export default function LandingPage() {
  return (
    <div className="relative">
      <header>
        <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex h-11 items-center font-display text-xl uppercase tracking-[0.08em] text-gold-200">BhriguWelt</Link>
          <Link href="/setup-passcode" className="flex h-11 items-center px-2 text-sm text-ivory-2 hover:text-ivory">
            Open the app
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-16 pt-10 text-center md:pt-16">
        <DiamondChartEmblem size={150} className="mb-8" />
        <p className="nadi-eyebrow">Bhrigu Samhita · Nadi Jyotisha</p>
        <h1 className="mt-4 text-[2.6rem] leading-[1.05] text-ivory md:text-6xl">
          The leaf that was
          <br />
          <em className="text-gold-200">written for you</em>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory-2 md:text-lg">
          Karmic readings drawn from your exact birth chart and the classical rules of the rishis. Private by design.
        </p>
        <Link href="/setup-passcode" className="nadi-btn mt-8 w-full max-w-xs text-base">
          Begin your reading <ArrowIcon size={18} />
        </Link>
        <p className="mt-3 text-xs text-ivory-muted">Swiss Ephemeris precision · encrypted on your device</p>
      </section>

      <section aria-labelledby="receive" className="mx-auto max-w-5xl px-5 py-12">
        <div className="nadi-rule mb-8"><span className="nadi-eyebrow">What you receive</span></div>
        <h2 id="receive" className="sr-only">What you receive</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {OFFERINGS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="nadi-card flex gap-4">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-[color:var(--line)] bg-[rgba(212,175,95,0.04)] text-gold-400">
                <Icon size={22} />
              </span>
              <div>
                <h3 className="text-xl text-ivory">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ivory-2">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-5xl px-5 py-12">
        <div className="nadi-rule mb-8"><span className="nadi-eyebrow">How it works</span></div>
        <h2 id="how" className="sr-only">How it works</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="text-center md:text-left">
              <span className="font-display text-3xl text-gold-300">{s.n}</span>
              <h3 className="mt-2 text-xl text-ivory">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ivory-2">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="privacy" className="mx-auto max-w-3xl px-5 py-12">
        <div className="nadi-leaf text-center">
          <p className="nadi-eyebrow !text-[0.62rem]">Private by design</p>
          <h2 id="privacy" className="mt-2 text-2xl text-ivory">No account. Your chart stays yours.</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ivory-2">
            Profiles and saved readings are encrypted in your browser with your passcode. Birth details leave your device
            only to compute your chart and reading, and are never written to our logs.
          </p>
        </div>
      </section>

      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 pb-20 pt-6 text-center">
        <ChartIcon size={28} className="text-gold-400" />
        <h2 className="mt-3 text-3xl text-ivory">Begin with your birth chart</h2>
        <Link href="/setup-passcode" className="nadi-btn mt-6 w-full max-w-xs">
          Begin your reading <ArrowIcon size={18} />
        </Link>
      </section>

      <footer className="border-t border-[color:var(--line)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-ivory-muted sm:flex-row">
          <span>© {new Date().getFullYear()} BhriguWelt · Readings are for reflection, not medical, legal or financial advice.</span>
          <nav aria-label="Legal" className="flex gap-1">
            <Link href="/privacy" className="flex h-11 items-center px-2 hover:text-ivory">Privacy</Link>
            <Link href="/terms" className="flex h-11 items-center px-2 hover:text-ivory">Terms</Link>
            <Link href="/impressum" className="flex h-11 items-center px-2 hover:text-ivory">Impressum</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
