'use client';

import { TelemetryProvider } from "@/lib/telemetry";
import { TranslationProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider>
      <TelemetryProvider>{children}</TelemetryProvider>
    </TranslationProvider>
  );
}
