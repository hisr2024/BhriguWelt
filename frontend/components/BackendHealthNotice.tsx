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
        const message =
          principleCount !== undefined
            ? `Backend ready. Principles loaded: ${principleCount}.`
            : "Backend ready.";
        if (!active) return;
        cachedHealth = { status: "ok", detail: message };
        setStatus("ok");
        setDetail(message);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Unable to reach the API.";
        const warning =
          `Cannot reach the Bhrigu backend at ${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/health. ` +
          "Live predictions may fall back to demo responses until the server is reachable.";
        const message = `${warning} ${reason}`;
        if (!active) return;
        cachedHealth = { status: "error", detail: message };
        setStatus("error");
        setDetail(message);
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
