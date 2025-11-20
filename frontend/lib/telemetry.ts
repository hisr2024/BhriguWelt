'use client';

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

export function captureClientError(error: unknown, context?: TelemetryContext) {
  if (!DSN) return;
  if (typeof window !== "undefined" && window.Sentry?.captureException) {
    window.Sentry.captureException(error, { extra: context });
    return;
  }

  // Fallback: surface intent to the console so teams know to wire @sentry/nextjs
  // when network access is available in CI/CD.
  // eslint-disable-next-line no-console
  console.warn("Sentry DSN set; install @sentry/nextjs to capture client errors", { error, context });
}

export function captureClientMessage(message: string, context?: TelemetryContext) {
  if (!DSN) return;
  if (typeof window !== "undefined" && window.Sentry?.captureMessage) {
    window.Sentry.captureMessage(message, { extra: context });
    return;
  }
  // eslint-disable-next-line no-console
  console.info("Sentry DSN set; install @sentry/nextjs to record messages", { message, context });
}
