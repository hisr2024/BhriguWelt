'use client';

import { TelemetryProvider } from "@/lib/telemetry";
import { TranslationProvider } from "@/lib/i18n";
import { SakaProvider } from "@/lib/sakaContext";
import { ThemeProvider } from "@/lib/themeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ServiceWorkerManager from "@/components/ServiceWorkerManager";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <TranslationProvider>
        <TelemetryProvider>
          <ThemeProvider>
            <SakaProvider>
              <ServiceWorkerManager />
              {children}
            </SakaProvider>
          </ThemeProvider>
        </TelemetryProvider>
      </TranslationProvider>
    </ErrorBoundary>
  );
}
