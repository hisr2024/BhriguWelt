"use client";

import { useMemo, useState } from "react";
import { ZoomIn } from "lucide-react";

const baseSignals = [65, 78, 52, 88, 71, 94, 60];

type EngineZoomChartProps = {
  accent: string;
};

export default function EngineZoomChart({ accent }: EngineZoomChartProps) {
  const [zoom, setZoom] = useState(1);

  const signals = useMemo(() => baseSignals.map((value) => Math.min(100, Math.round(value * zoom))), [zoom]);

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Interactive chart</p>
          <h4 className="text-lg font-semibold text-white">Zoomable signal map</h4>
        </div>
        <ZoomIn className="h-5 w-5 text-indigo-300" />
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-300">
        <span>Zoom</span>
        <input
          type="range"
          min="0.7"
          max="1.4"
          step="0.05"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="flex-1 accent-indigo-400"
          aria-label="Zoom signal chart"
        />
        <span className="w-10 text-right text-white">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2">
        {signals.map((value, index) => (
          <div key={`signal-${index}`} className="flex flex-col items-center gap-2">
            <div className="h-24 w-full rounded-full bg-white/5">
              <div
                className={`w-full rounded-full bg-gradient-to-t ${accent}`}
                style={{ height: `${value}%` }}
              />
            </div>
            <span className="text-[0.65rem] text-slate-400">S{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
