import Link from "next/link";

import { EngineMeta } from "@/components/engineData";

export default function EngineCard({ engine }: { engine: EngineMeta }) {
  return (
    <Link
      href={`/${engine.slug}`}
      className="glass-panel glow-ring flex h-full flex-col justify-between gap-6 p-6 transition hover:-translate-y-1"
    >
      <div>
        <div className={`mb-4 h-2 w-16 rounded-full bg-gradient-to-r ${engine.accent}`} />
        <h3 className="text-xl font-semibold">{engine.title}</h3>
        <p className="mt-3 text-sm text-white/70">{engine.description}</p>
      </div>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
        <span>{engine.highlight}</span>
        <span className="text-neon-cyan">↗</span>
      </div>
    </Link>
  );
}
