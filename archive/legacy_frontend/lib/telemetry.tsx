'use client';

import { useEffect } from "react";

type TelemetryContext = Record<string, unknown>;

declare global {
  interface Window {
    Sentry?: {
      captureException: (error: unknown, context?: { extra?: TelemetryContext }) => void;
      captureMessage: (message: string, context?: { extra?: TelemetryContext }) => void;
    };
  }
}

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "production";
const TRACES_SAMPLE_RATE = Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || "0.0");
const PROFILES_SAMPLE_RATE = Number(process.env.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE || "0.0");

let bootstrapped = false;

function bootstrapClientTelemetry() {
  if (!DSN || typeof window === "undefined" || bootstrapped) return;
  bootstrapped = true;

  import("@sentry/nextjs")
    .then((module) => {
      module.init({
        dsn: DSN,
        environment: ENVIRONMENT,
        tracesSampleRate: TRACES_SAMPLE_RATE,
        profilesSampleRate: PROFILES_SAMPLE_RATE,
      });

      if (!window.Sentry) {
        window.Sentry = {
          captureException: module.captureException,
          captureMessage: module.captureMessage,
        };
      }
    })
    .catch((error) => {
      console.info("Sentry DSN set but client SDK missing; telemetry disabled", { error });
      bootstrapped = false;
    });
}

export function captureClientError(error: unknown, context?: TelemetryContext) {
  bootstrapClientTelemetry();
  if (typeof window !== "undefined" && window.Sentry?.captureException) {
    window.Sentry.captureException(error, { extra: context });
    return;
  }

  if (DSN) {
    console.warn("Sentry DSN set; install @sentry/nextjs to capture client errors", { error, context });
  }
}

export function captureClientMessage(message: string, context?: TelemetryContext) {
  bootstrapClientTelemetry();
  if (typeof window !== "undefined" && window.Sentry?.captureMessage) {
    window.Sentry.captureMessage(message, { extra: context });
    return;
  }
  if (DSN) {
    console.info("Sentry DSN set; install @sentry/nextjs to record messages", { message, context });
  }
}

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    bootstrapClientTelemetry();
  }, []);

  return <>{children}</>;
}
