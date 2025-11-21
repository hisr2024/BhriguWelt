'use client';

import Link from "next/link";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import { heroCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();
  const { heroBody, navigationBody, deployBody, accessibilityBody } = heroCopy;

  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">{t("hero.eyebrow", "Bhrigu Samhita studio")}</p>
        <h1>{t("hero.title", "Bhrigu astrology that speaks clearly to every age.")}</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          {t("hero.body", heroBody)}
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
          <p>{t("home.grid.navigation.body", navigationBody)}</p>
        </div>
        <div className="card">
          <p className="eyebrow">Deploy-ready</p>
          <h3>{t("home.grid.deploy.title", "Render API, Vercel UI, native next")}</h3>
          <p>{t("home.grid.deploy.body", deployBody)}</p>
        </div>
        <div className="card">
          <p className="eyebrow">Accessibility</p>
          <h3>{t("home.grid.accessibility.title", "Screen-reader friendly interactions")}</h3>
          <p>{t("home.grid.accessibility.body", accessibilityBody)}</p>
        </div>
      </section>

      <section className="card-grid">
        <div className="card">
          <p className="eyebrow">Modern yet timeless</p>
          <h3>Bold gradients with the calm of ancient counsel.</h3>
          <p>
            Every page layers glassmorphic panels and breathing room so elders, seekers, and youth all feel welcomed. Typography
            and spacing keep the focus on the guidance, not on JSON payloads.
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
          <p className="eyebrow">Shareable stories</p>
          <h3>Plain English and Hindi, ready for other languages.</h3>
          <p>
            Point <code>NEXT_PUBLIC_BACKEND_URL</code> at your Render or Railway host and share the same interpretations across
            chat, mobile, or web—no restructuring or JSON parsing required.
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
          <p>Surface cross-era narratives straight from the preserved folios in flowing prose.</p>
          <Link className="button-link" href="/past-life">
            Open past-life page
          </Link>
        </div>
        <div className="card">
          <p className="eyebrow">Future directives</p>
          <h3>Actionable steps</h3>
          <p>Chart the finance, devotion, and health moves Bhrigu prescribes for the next decade—written as guidance, not code.</p>
          <Link className="button-link" href="/future">
            Plan the future
          </Link>
        </div>
        <div className="card">
          <p className="eyebrow">Wisdom first</p>
          <h3>Readable insights across web and native</h3>
          <p>Each page mirrors the backend contracts yet presents results as human stories so Android, iOS, and browser clients stay aligned without exposing raw payloads.</p>
          <Link className="button-link" href="/calendar">
            View calendar helper
          </Link>
        </div>
      </section>
    </div>
  );
}
