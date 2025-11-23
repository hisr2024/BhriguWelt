'use client';

import Link from "next/link";
import HoroscopeForm from "@/components/HoroscopeForm";
import { helperCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();
  const helperText = helperCopy.horoscope;

  return (
    <div className="horo-shell">
      <header className="horo-hero">
        <div className="horo-hero__copy">
          <p className="eyebrow">Holistic horoscope • Ready for everyone</p>
          <h1>{t("pages.horoscope.title", "Fresh, calm horoscope journey.")}</h1>
          <p className="muted horo-hero__lede">
            {t(
              "form.helper",
              helperText ??
                "Bring only a name, date of birth, time of birth, and place of birth. The rest of the flow is distraction-free so the reading stays human and clear."
            )}
          </p>
          <div className="horo-hero__pills">
            <span className="pill">Name</span>
            <span className="pill">Date</span>
            <span className="pill">Time</span>
            <span className="pill">Place</span>
          </div>
          <div className="hero-actions">
            <Link href="/" className="button-link ghost-link">
              Back to studio hub
            </Link>
          </div>
        </div>
        <div className="horo-hero__steps" aria-label="Horoscope flow steps">
          <div className="step-card">
            <p className="pill">Step 1</p>
            <h3>Enter the essentials</h3>
            <p className="muted">A single, friendly form keeps the four inputs together for quick handover.</p>
          </div>
          <div className="step-card">
            <p className="pill">Step 2</p>
            <h3>View the reading</h3>
            <p className="muted">The interpretation opens wide with generous spacing and bilingual guidance.</p>
          </div>
          <div className="step-card">
            <p className="pill">Step 3</p>
            <h3>Share or save</h3>
            <p className="muted">Send to chat or download a clean PDF from the same screen.</p>
          </div>
        </div>
      </header>

      <HoroscopeForm />
    </div>
  );
}
