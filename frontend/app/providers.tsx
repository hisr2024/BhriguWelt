'use client';

import { TelemetryProvider } from "@/lib/telemetry";
import { TranslationProvider } from "@/lib/i18n";
import { SakaProvider } from "@/lib/sakaContext";
import { ThemeProvider } from "@/lib/themeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider>
      <TelemetryProvider>
        <ThemeProvider>
          <SakaProvider>{children}</SakaProvider>
        </ThemeProvider>
      </TelemetryProvider>
    </TranslationProvider>
  );
}
