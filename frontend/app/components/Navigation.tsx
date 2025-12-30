"use client";

import Link from "next/link";
import { useState } from "react";

import LanguageToggle from "./LanguageToggle";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/studio/insights" },
  { label: "Horoscope", href: "/horoscope" },
  { label: "Calendar", href: "/calendar" },
  { label: "Matchmaking", href: "/matchmaking" },
];

export default function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cosmic-radial text-xl">
            ॐ
          </span>
          <span className="tracking-wide">BhriguWelt</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-200 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <LanguageToggle />
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          <LanguageToggle compact />
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-2 text-xs uppercase tracking-widest text-slate-200"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            Menu
          </button>
        </div>
      </div>
      <div
        id="mobile-menu"
        className={`border-t border-white/10 bg-slate-950/95 px-6 py-4 md:hidden ${open ? "block" : "hidden"}`}
      >
        <div className="flex flex-col gap-4 text-sm">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-200">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
