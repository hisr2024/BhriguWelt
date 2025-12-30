'use client';

import { useEffect, useState } from "react";

import { checkBackendHealth, HealthResponse } from "@/lib/api";

let cachedHealth: { status: "ok" | "error"; detail?: string } | null = null;

interface Props {
  className?: string;
}

export default function BackendHealthNotice({ className }: Props) {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    if (cachedHealth) {
      setStatus(cachedHealth.status);
      setDetail(cachedHealth.detail ?? null);
      return;
    }

    let active = true;
    (async () => {
      try {
        const response: HealthResponse = await checkBackendHealth();
        const principleCount = response?.data?.principles_loaded;
        const hosts = response?.meta?.attempted_hosts?.filter(Boolean);
        const isDemo = response?.meta?.mode === "demo";
        const hostText = hosts?.length ? hosts.join(", ") : process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const aiProvider = response?.ai_provider_metadata?.provider;
        const aiConfigured = response?.ai_provider_metadata?.configured;
        const aiLabel = aiConfigured
          ? aiProvider === "sarvam"
            ? "AI: Sarvam connected."
            : "AI: OpenAI-compatible connected."
          : "AI: not configured.";
        const message = isDemo
          ? `Backend unreachable. Using built-in demo predictions until a backend responds (${hostText}). ${aiLabel}`
          : principleCount !== undefined
            ? `Backend ready. Principles loaded: ${principleCount}. ${aiLabel}`
            : `Backend ready. ${aiLabel}`;
        if (!active) return;
        cachedHealth = { status: "ok", detail: message };
        setStatus("ok");
        setDetail(message);
      } catch (error) {
        console.warn("Backend health check failed; switching to demo mode", error);
        if (!active) return;
        const preferredHost = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const fallbackDetail =
          `Backend unreachable at ${preferredHost}. Start the API locally with "cd backend && PYTHONPATH=\\"$(pwd)/src\\" python -m bhriguwelt.api" ` +
          "or set NEXT_PUBLIC_BACKEND_URL to your deployed backend. Running in demo mode until a backend responds.";
        cachedHealth = { status: "error", detail: fallbackDetail };
        setStatus("error");
        setDetail(fallbackDetail);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (status === "idle" || !detail) return null;

  if (status === "error") {
    return (
      <div
        className={`rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100 ${className ?? ""}`}
        role="alert"
        aria-live="assertive"
      >
        <strong className="block font-semibold">Backend unreachable.</strong>
        <span className="mt-1 block text-white/80">{detail}</span>
      </div>
    );
  }

  return (
    <p className={`text-xs text-white/60 ${className ?? ""}`} aria-live="polite">
      {detail}
    </p>
  );
}
