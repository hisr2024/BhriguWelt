'use client';

import Link from "next/link";
import HoroscopeForm from "@/components/HoroscopeForm";
import OperationalStack from "@/components/OperationalStack";
import { helperCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();
  const helperText = helperCopy.horoscope;

  return (
    <div className="horo-shell">
      <section className="panel-header" style={{ alignItems: "flex-start", gap: "16px" }}>
        <div>
          <p className="eyebrow">Holistic horoscope</p>
          <h1>{t("pages.horoscope.title", "Generate the full reading with one clean form.")}</h1>
          <p className="muted" style={{ maxWidth: "720px" }}>
            {t(
              "form.helper",
              helperText ?? "Validated birth details feed the Bhrigu analyzers, interpreters, and AI remedies in one flow.",
            )}
          </p>
        </div>
        <div className="hero-actions" style={{ gap: "12px", flexWrap: "wrap" }}>
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
          <Link href="/calendar" className="button-link">
            Refresh Śaka calendar
          </Link>
        </div>
      </section>

      <OperationalStack />

      <HoroscopeForm />
    </div>
  );
}
