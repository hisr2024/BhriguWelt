"use client";

import Link from "next/link";
import { navigationLinks } from "@/components/Navigation";
import { Button } from "@/components/ui/Button";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-slate-950/80 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-slate-800 bg-slate-950/95 px-5 py-6 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Navigate</span>
          <Button variant="ghost" onClick={onClose} aria-label="Close menu">
            ✕
          </Button>
        </div>
        <nav className="mt-6 flex flex-col gap-4 text-base font-semibold text-slate-200">
          {navigationLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={onClose} className="rounded-xl px-3 py-2 hover:bg-slate-900">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
          Swipe left or tap outside to close.
        </div>
      </aside>
    </div>
  );
}
