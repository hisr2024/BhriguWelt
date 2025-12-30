"use client";

import Link from "next/link";
import { useEffect } from "react";

export type NavigationLink = {
  label: string;
  href: string;
};

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  links: NavigationLink[];
};

export default function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute right-0 top-0 flex h-full w-4/5 max-w-sm flex-col gap-6 bg-slate-950/95 px-6 pb-10 pt-24 shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-6 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80 transition hover:border-white/50 hover:text-white"
        >
          Close
        </button>
        <div className="flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={onClose}
              className="group text-lg font-semibold text-white/80 transition hover:text-white"
            >
              <span className="block rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition group-hover:-translate-y-0.5 group-hover:border-white/40 group-hover:bg-white/10">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Swipe-ready navigation
          </p>
          <p className="mt-2 text-sm text-white/70">
            Scroll horizontally on each section to explore engines and outputs.
          </p>
        </div>
      </div>
    </div>
  );
}
