'use client';

import Link from "next/link";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">{t("hero.eyebrow", "Bhrigu Samhita studio")}</p>
        <h1>{t("hero.title", "Zero-fluff astrology journeys for Gen Z and every generation.")}</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          {t(
            "hero.body",
            "Launch vibrant, mobile-first flows that speak to modern seekers while honoring the exacting Śaka and Bhrigu Samhita guidance. Run it locally, ship to Vercel, or plug the API into your Android/iOS builds.",
          )}
        </p>
        <div className="hero-actions">
          <Link href="/horoscope" className="button-link">
            {t("hero.cta.horoscope", "Explore horoscope")}
          </Link>
          <Link href="/matchmaking" className="button-link" style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
            {t("hero.cta.matchmaking", "Modern matchmaking")}
          </Link>
          <span className="badge">{t("hero.badge", "Śaka-aligned • Render + Vercel ready")}</span>
        </div>
      </div>

      <section className="card-grid">
        <div className="card">
          <p className="eyebrow">Navigation</p>
          <h3>{t("home.grid.navigation.title", "Every ritual has its own page")}</h3>
          <p>{t("home.grid.navigation.body", "Jump straight to horoscope, past-life, future, matchmaking, or calendar from the navigation shell or the cards below.")}</p>
        </div>
        <div className="card">
          <p className="eyebrow">Deploy-ready</p>
          <h3>{t("home.grid.deploy.title", "Render API, Vercel UI, native next")}</h3>
          <p>{t("home.grid.deploy.body", "Point NEXT_PUBLIC_BACKEND_URL at your backend host and the same flows light up on Android and iOS.")}</p>
        </div>
        <div className="card">
          <p className="eyebrow">Accessibility</p>
          <h3>{t("home.grid.accessibility.title", "Screen-reader friendly interactions")}</h3>
          <p>{t("home.grid.accessibility.body", "High contrast, keyboard friendly nav, and ARIA-labelled forms built for Vercel previews and production.")}</p>
        </div>
      </section>

      <section className="card-grid">
        <div className="card">
          <p className="eyebrow">Gen Z polish</p>
          <h3>Bold gradients, microcopy, and haptics-ready flows.</h3>
          <p>
            Every page layers glassmorphic panels and breathing room so the same UI can live inside mobile webviews and native
            wrappers without extra design work.
          </p>
        </div>
        <div className="card">
          <p className="eyebrow">Manuscript strict</p>
          <h3>Inputs match the authentic folios.</h3>
          <p>
            Lunar tithi 1–30, the five moon elements, and house ranges are constrained and validated so predictions stay true to
            the Bhrigu Samhita canon.
          </p>
        </div>
        <div className="card">
          <p className="eyebrow">Ship it anywhere</p>
          <h3>Render backend, Vercel frontend, native clients soon.</h3>
          <p>
            Point <code>NEXT_PUBLIC_BACKEND_URL</code> at your Render or Railway host, then mirror the same calls from Kotlin,
            Swift, or React Native without rewriting payloads.
          </p>
        </div>
      </section>

      <section className="card-grid">
        <div className="card highlight">
          <p className="eyebrow">Consult now</p>
          <h3>Holistic horoscope</h3>
          <p>Blends karmic epoch, remedies, past lives, and future trajectories with one crisp submission.</p>
          <PredictionForm
            engine="horoscope"
            title={t("pages.horoscope.title", "Holistic horoscope")}
            description="Perfect for welcome screens, drop-in popups, or mobile onboarding modals."
          />
        </div>
        <div className="card">
          <p className="eyebrow">Quick conversion</p>
          <h3>Gregorian → Śaka</h3>
          <p>Anchor every prediction to the Śaka calendar in seconds with the same payload the backend expects.</p>
          <CalendarForm />
        </div>
        <div className="card">
          <p className="eyebrow">Pairing lab</p>
          <h3>Compatibility, modernized</h3>
          <p>Blend manuscript guna scores with lifestyle tags like remote-first or adventure-aligned.</p>
          <MatchmakingForm />
        </div>
      </section>

      <section className="card-grid">
        <div className="card">
          <p className="eyebrow">Past-life explorer</p>
          <h3>Trace prior eras</h3>
          <p>Surface cross-era narratives straight from the preserved folios.</p>
          <Link className="button-link" href="/past-life">
            Open past-life page
          </Link>
        </div>
        <div className="card">
          <p className="eyebrow">Future directives</p>
          <h3>Actionable steps</h3>
          <p>Chart the finance, devotion, and health moves Bhrigu prescribes for the next decade.</p>
          <Link className="button-link" href="/future">
            Plan the future
          </Link>
        </div>
        <div className="card">
          <p className="eyebrow">API first</p>
          <h3>Same JSON across web and native</h3>
          <p>Each page mirrors the backend contracts, keeping Android, iOS, and browser clients perfectly aligned.</p>
          <Link className="button-link" href="/calendar">
            View calendar helper
          </Link>
        </div>
      </section>
    </div>
  );
}
