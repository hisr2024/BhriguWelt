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
        const message = isDemo
          ? `Using built-in demo predictions until a backend responds (${hostText}).`
          : principleCount !== undefined
            ? `Backend ready. Principles loaded: ${principleCount}.`
            : "Backend ready.";
        if (!active) return;
        cachedHealth = { status: "ok", detail: message };
        setStatus("ok");
        setDetail(message);
      } catch (error) {
        console.warn("Backend health check failed; switching to demo mode", error);
        if (!active) return;
        const preferredHost = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const fallbackDetail =
          `Backend unreachable at ${preferredHost}. Start the API locally with "cd backend && PYTHONPATH=src python -m bhriguwelt.api" ` +
          "or set NEXT_PUBLIC_BACKEND_URL to your deployed backend. Running in demo mode until a backend responds.";
        cachedHealth = { status: "ok", detail: fallbackDetail };
        setStatus("ok");
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
      <div className={`alert-warning ${className ?? ""}`} role="alert" aria-live="assertive">
        <strong>Backend unreachable.</strong>
        <span>{detail}</span>
      </div>
    );
  }

  return (
    <p className={`microcopy ${className ?? ""}`} aria-live="polite">
      {detail}
    </p>
  );
}
