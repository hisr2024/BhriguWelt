"use client";

import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { MobileMenu } from "@/components/MobileMenu";
import { Navigation } from "@/components/Navigation";
import { useSwipe } from "@/components/hooks/useSwipe";

export function AppShell({ children }: PropsWithChildren) {
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const swipeHandlers = useSwipe({
    onSwipeLeft: closeMenu,
    onSwipeRight: openMenu,
  });

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return (
    <div className="min-h-screen" {...swipeHandlers}>
      <Navigation onOpenMenu={openMenu} />
      <MobileMenu open={menuOpen} onClose={closeMenu} />
      {children}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-10 text-center text-xs text-slate-500">
        Crafted for seekers · BhriguWelt engines with offline fallback.
      </footer>
    </div>
  );
}
