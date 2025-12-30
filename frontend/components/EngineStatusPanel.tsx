"use client";

import { useEffect, useState } from "react";
import { CloudOff, ServerCog, ShieldCheck } from "lucide-react";

export default function EngineStatusPanel() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Engine health</p>
          <h3 className="text-xl font-semibold text-white">Integration status</h3>
        </div>
        <ServerCog className="h-5 w-5 text-indigo-300" />
      </div>
      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            API sync
          </span>
          <span className="text-white">Active</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="inline-flex items-center gap-2">
            <ServerCog className="h-4 w-4 text-sky-300" />
            Error recovery
          </span>
          <span className="text-white">Retry-ready</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="inline-flex items-center gap-2">
            <CloudOff className={`h-4 w-4 ${online ? "text-emerald-300" : "text-rose-300"}`} />
            Offline fallback
          </span>
          <span className="text-white">{online ? "Available" : "Activated"}</span>
        </div>
      </div>
    </section>
  );
}
