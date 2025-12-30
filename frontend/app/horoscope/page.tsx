'use client';

import Link from "next/link";
import { motion, useReducedMotion } from "@/lib/framer-motion";
import HoroscopeForm from "@/components/HoroscopeForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import { horoscopeSigns } from "@/lib/horoscopeStatic";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" };

  return (
    <div className="stack">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="panel softly"
      >
        <p className="eyebrow">Horoscope</p>
        <h1>{t("pages.horoscope.title", "Clean form. Complete reading.")}</h1>
        <p className="muted">
          {t(
            "form.helper",
            "Provide the essentials and receive the full horoscope output in one step.",
          )}
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transition, delay: 0.08 }}
        className="card highlight"
        aria-label="Horoscope form"
      >
        <div className="section-heading">
          <h2>Data input</h2>
          <p className="muted">All required fields are here. Submit to view the reading.</p>
        </div>
        <ErrorBoundary>
          <HoroscopeForm />
        </ErrorBoundary>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transition, delay: 0.16 }}
        className="card"
        aria-label="Static horoscopes"
      >
        <div className="section-heading">
          <h2>Static horoscopes</h2>
          <p className="muted">Cached hourly with ISR, delivered at the edge.</p>
        </div>
        <div className="alignment-tags">
          {horoscopeSigns.map((sign) => (
            <Link key={sign} href={`/horoscope/${sign}`} className="tag-chip">
              {sign}
            </Link>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
