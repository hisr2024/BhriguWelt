"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center text-slate-200">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-300">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Something went wrong.</h1>
        <p className="text-sm text-slate-400">Refresh the view or return to the dashboard.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-slate-200"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
