"use client";

import Link from "next/link";
import { useState } from "react";

import MobileMenu, { NavigationLink } from "./MobileMenu";

const links: NavigationLink[] = [
  { label: "Engines", href: "#engines" },
  { label: "Inputs", href: "#inputs" },
  { label: "Outputs", href: "#outputs" },
  { label: "Workflow", href: "#workflow" },
  { label: "Contact", href: "#contact" },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-b-3xl border border-white/10 bg-slate-950/70 px-6 py-4 shadow-lg backdrop-blur-xl">
          <Link href="#top" className="group inline-flex items-center gap-3">
            <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/5">
              <span className="absolute inset-0 bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/40 to-sky-500/60 opacity-70 transition group-hover:opacity-100" />
              <span className="relative text-xs font-bold uppercase tracking-[0.3em] text-white">
                BW
              </span>
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.4em] text-white/80 transition group-hover:text-white">
              BhriguWelt
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group relative transition hover:text-white"
              >
                {link.label}
                <span className="absolute -bottom-2 left-0 h-[2px] w-0 bg-gradient-to-r from-indigo-400 via-pink-400 to-sky-400 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <button className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white/50 hover:text-white">
              Explore
            </button>
            <button className="rounded-full bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-950 transition hover:-translate-y-0.5 hover:shadow-glow">
              Launch App
            </button>
          </div>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/80 transition hover:border-white/50 hover:text-white md:hidden"
          >
            <span>Menu</span>
            <span className="relative block h-[10px] w-[18px]">
              <span className="absolute left-0 top-0 h-[2px] w-full rounded-full bg-white/80" />
              <span className="absolute left-0 top-[4px] h-[2px] w-full rounded-full bg-white/60" />
              <span className="absolute left-0 top-[8px] h-[2px] w-full rounded-full bg-white/40" />
            </span>
          </button>
        </nav>
      </header>
      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} links={links} />
    </>
  );
}
