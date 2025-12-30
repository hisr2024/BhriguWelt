"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

type TooltipProps = {
  content: string;
  children?: ReactNode;
};

export default function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="relative inline-flex items-center gap-1">
      <span
        className="group inline-flex items-center"
        tabIndex={children ? undefined : 0}
        aria-label={children ? undefined : content}
      >
        {children ? children : <Info className="h-4 w-4 text-slate-400 transition group-hover:text-white" />}
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-3 w-48 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs text-slate-200 opacity-0 shadow-xl transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {content}
        </span>
      </span>
    </span>
  );
}
