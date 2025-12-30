"use client";

import Link from "next/link";
import { Compass, ArrowLeft, ArrowRight } from "lucide-react";
import { engineConfigs } from "@/lib/engineConfig";

type EngineBottomNavProps = {
  currentSlug: string;
};

export default function EngineBottomNav({ currentSlug }: EngineBottomNavProps) {
  const currentIndex = engineConfigs.findIndex((engine) => engine.slug === currentSlug);
  const prev = engineConfigs[(currentIndex - 1 + engineConfigs.length) % engineConfigs.length];
  const next = engineConfigs[(currentIndex + 1) % engineConfigs.length];

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex w-[min(92vw,420px)] -translate-x-1/2 items-center justify-between rounded-full border border-white/10 bg-slate-950/90 px-4 py-3 text-xs text-slate-200 shadow-lg backdrop-blur lg:hidden">
      <Link href={`/${prev.slug}`} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        {prev.title}
      </Link>
      <Link href="/" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
        <Compass className="h-4 w-4" />
        Home
      </Link>
      <Link href={`/${next.slug}`} className="flex items-center gap-2">
        {next.title}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
