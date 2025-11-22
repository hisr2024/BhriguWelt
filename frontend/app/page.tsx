'use client';

import Link from "next/link";
import CalendarForm from "@/components/CalendarForm";
import MatchmakingForm from "@/components/MatchmakingForm";
import PredictionForm from "@/components/PredictionForm";
import QuarterlyReviewPanel from "@/components/QuarterlyReviewPanel";
import { heroCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();
  const { heroBody, navigationBody, deployBody, accessibilityBody } = heroCopy;

  return (
    <div className="cosmic-shell stack">
      <section className="hero cosmic-panel">
        <div className="hero-columns">
          <div className="hero-copy">
            <p className="eyebrow">{t("hero.eyebrow", "Bhrigu Samhita studio")}</p>
            <h1>{t("hero.title", "Bhrigu astrology that speaks clearly to every age.")}</h1>
            <p className="muted hero-lede">{t("hero.body", heroBody)}</p>
            <div className="promise-chips" aria-label="Highlights of the experience">
              <span className="chip">Futuristic calm</span>
              <span className="chip">Śaka aligned</span>
              <span className="chip">Screen-reader ready</span>
              <span className="chip">Human narratives</span>
            </div>
            <div className="hero-actions">
              <Link href="/horoscope" className="button-link">
                {t("hero.cta.horoscope", "Explore horoscope")}
              </Link>
              <Link href="/matchmaking" className="ghost-button">
                {t("hero.cta.matchmaking", "Modern matchmaking")}
              </Link>
              <span className="badge">{t("hero.badge", "Śaka-aligned • Render + Vercel ready")}</span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="orbital">
              <span className="orb" />
              <span className="orb orb-secondary" />
              <span className="orb orb-tertiary" />
            </div>
            <div className="yantra-card">
              <p className="eyebrow">Cosmic timeline</p>
              <div className="yantra-grid">
                <div className="yantra-dot" />
                <div className="yantra-dot" />
                <div className="yantra-dot" />
                <div className="yantra-dot" />
                <div className="yantra-dot" />
                <div className="yantra-dot" />
              </div>
              <p className="muted">Destiny threads woven from past, present, and yet-to-arrive paths.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="card-grid">
        <div className="card luminous">
          <p className="eyebrow">Navigation</p>
          <h3>{t("home.grid.navigation.title", "Every ritual has its own page")}</h3>
          <p>{t("home.grid.navigation.body", navigationBody)}</p>
        </div>
        <div className="card luminous">
          <p className="eyebrow">Deploy-ready</p>
          <h3>{t("home.grid.deploy.title", "Render API, Vercel UI, native next")}</h3>
          <p>{t("home.grid.deploy.body", deployBody)}</p>
        </div>
        <div className="card luminous">
          <p className="eyebrow">Accessibility</p>
          <h3>{t("home.grid.accessibility.title", "Screen-reader friendly interactions")}</h3>
          <p>{t("home.grid.accessibility.body", accessibilityBody)}</p>
        </div>
      </section>

      <section className="cosmic-panel journey">
        <div className="section-heading">
          <p className="eyebrow">Designed for every seeker</p>
          <h2>Futuristic serenity, Bharat soul</h2>
          <p>
            Modern gradients, yantra geometry, and warm tones keep Gen Z inspired while elders enjoy clarity and steady rhythm.
            Each surface uses wide tap targets, WCAG contrast, and gentle animations to welcome every hand and eye.
          </p>
        </div>
        <div className="journey-grid">
          <div className="card">
            <h3>Soft cosmic gradients</h3>
            <p>
              Aurora veils, soft neon, and translucent glass panels guide focus without overwhelming. Micro-interactions lift
              buttons and cards with a clean glow that still feels serene.
            </p>
          </div>
          <div className="card">
            <h3>Folios, not clichés</h3>
            <p>
              Symbols draw from mandala symmetry and Bhrigu-inspired yantras instead of clipart. Inputs map to authentic tithis,
              houses, and elements so destiny stays grounded.
            </p>
          </div>
          <div className="card">
            <h3>Story-first layout</h3>
            <p>
              Hierarchy uses bold headings, calm body text, and space for breath. Elders can glide across sections while younger
              users enjoy immersive, emoji-free precision.
            </p>
          </div>
        </div>
      </section>

      <section className="card-grid insight-lab">
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

      <QuarterlyReviewPanel />

      <section className="card-grid pathways">
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
          <p>
            Chart the finance, devotion, and health moves Bhrigu prescribes for the next decade—written as guidance, not code.
          </p>
          <Link className="button-link" href="/future">
            Plan the future
          </Link>
        </div>
        <div className="card">
          <p className="eyebrow">Wisdom first</p>
          <h3>Readable insights across web and native</h3>
          <p>
            Each page mirrors the backend contracts yet presents results as human stories so Android, iOS, and browser clients
            stay aligned without exposing raw payloads.
          </p>
          <Link className="button-link" href="/calendar">
            View calendar helper
          </Link>
        </div>
      </section>
    </div>
  );
}
