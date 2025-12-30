"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { engineBySlug } from "@/lib/engineConfig";

export default function EngineBreadcrumbs() {
  const pathname = usePathname();
  const slug = pathname.split("/")[1];
  const engine = engineBySlug[slug];

  if (!engine) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
      <Link href="/" className="transition hover:text-white">
        Home
      </Link>
      <ChevronRight className="h-3 w-3" aria-hidden />
      <Link href="/" className="transition hover:text-white">
        Engines
      </Link>
      <ChevronRight className="h-3 w-3" aria-hidden />
      <span className="text-white">{engine.title}</span>
    </nav>
  );
}
