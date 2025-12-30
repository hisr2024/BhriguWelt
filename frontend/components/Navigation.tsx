import Link from "next/link";

import AnimatedLogo from "@/components/AnimatedLogo";
import { ENGINES } from "@/components/engineData";

export default function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-cosmic-900/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-4">
          <AnimatedLogo size="sm" />
          <div>
            <p className="text-lg font-semibold">BhriguWelt</p>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Cosmic Studio</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          {ENGINES.slice(0, 6).map((engine) => (
            <Link key={engine.slug} href={`/${engine.slug}`} className="hover:text-white">
              {engine.title.split(" ")[0]}
            </Link>
          ))}
          <Link href="/analytics" className="hover:text-white">
            Analytics
          </Link>
        </nav>
        <Link
          href="/horoscope"
          className="rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-5 py-2 text-sm font-semibold text-white shadow-neon transition hover:bg-neon-cyan/20"
        >
          Start Reading
        </Link>
      </div>
    </header>
  );
}
