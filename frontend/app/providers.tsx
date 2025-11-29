'use client';

import { TelemetryProvider } from "@/lib/telemetry";
import { TranslationProvider } from "@/lib/i18n";
import { SakaProvider } from "@/lib/sakaContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider>
      <TelemetryProvider>
        <SakaProvider>{children}</SakaProvider>
      </TelemetryProvider>
    </TranslationProvider>
  );
}
