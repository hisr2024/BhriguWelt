"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "bhriguwelt-consent";

type ConsentChoice = "accepted" | "essential";

type StoredConsent = {
  choice: ConsentChoice;
  timestamp: string;
};

const defaultConsent: StoredConsent = {
  choice: "essential",
  timestamp: new Date().toISOString(),
};

export default function GdprConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const persistConsent = (choice: ConsentChoice) => {
    const payload: StoredConsent = {
      ...defaultConsent,
      choice,
      timestamp: new Date().toISOString(),
    };
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <section className="consent-banner" role="dialog" aria-live="polite" aria-label="Privacy consent">
      <div className="consent-banner__content">
        <strong>We respect your privacy.</strong>
        <p>
          BhriguWelt uses essential cookies for login continuity and secure profile storage. You can also opt in to
          analytics so we can improve future readings and experience flows.
        </p>
      </div>
      <div className="consent-banner__actions">
        <button type="button" className="consent-button" onClick={() => persistConsent("accepted")}>Accept analytics</button>
        <button type="button" className="consent-button ghost" onClick={() => persistConsent("essential")}>Essential only</button>
      </div>
    </section>
  );
}
