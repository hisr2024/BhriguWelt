"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { requestTransits } from "@/lib/api";
import { loadBirthDetails, onBirthDetails } from "@/lib/birthStorage";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { deriveChartHouses } from "@/lib/houseGrid";
import type { BirthDetails, CalendarDetails, ChartHouse } from "@/types/astro";
import type { TransitDirective } from "@/components/TransitOverlayChart";

const TransitOverlayChart = dynamic(() => import("@/components/TransitOverlayChart"), {
  ssr: false,
  loading: () => (
    <div className="panel softly" role="status" aria-live="polite">
      <p className="eyebrow">Chart render</p>
      <p className="muted">Preparing the natal wheel and transit overlay…</p>
    </div>
  ),
});

type TransitResponse = {
  name?: string;
  directives?: TransitDirective[];
  interpretation?: string;
};

type TransitPayload = {
  transitDate: string;
  transitTime: string;
  timezone?: string;
};

const hasRequiredDetails = (details: BirthDetails) =>
  Boolean(details.birthDate && details.birthTime && details.birthPlace);

const formatLocalSnapshot = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    transitDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    transitTime: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
};

export default function TransitsPage() {
  const [birthDetails, setBirthDetails] = useState<BirthDetails | null>(null);
  const [transits, setTransits] = useState<TransitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored) {
      setBirthDetails({ ...DEFAULT_BIRTH_DETAILS, ...stored } as BirthDetails);
    }

    const unsubscribe = onBirthDetails((details) => {
      setBirthDetails({ ...DEFAULT_BIRTH_DETAILS, ...details } as BirthDetails);
    });

    return () => unsubscribe();
  }, []);

  const fetchTransits = useCallback(async () => {
    if (!birthDetails || !hasRequiredDetails(birthDetails)) {
      setStatus("Add birth details to sync transits in real time.");
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const snapshot = formatLocalSnapshot();
      const timezone = birthDetails.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const payload: TransitPayload = { ...snapshot, timezone };
      const response = await requestTransits(birthDetails, payload);
      setTransits(response as TransitResponse);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.warn("Unable to fetch transit directives", error);
      setStatus("Transit directives will appear once the backend responds.");
    } finally {
      setLoading(false);
    }
  }, [birthDetails]);

  useEffect(() => {
    if (!birthDetails || !hasRequiredDetails(birthDetails)) return;
    fetchTransits();
    const interval = window.setInterval(fetchTransits, 60000);
    return () => window.clearInterval(interval);
  }, [birthDetails, fetchTransits]);

  const chartDetails = useMemo<CalendarDetails | null>(() => {
    if (!birthDetails || !hasRequiredDetails(birthDetails)) return null;
    return {
      birthDate: birthDetails.birthDate,
      birthTime: birthDetails.birthTime,
      birthPlace: birthDetails.birthPlace,
    } satisfies CalendarDetails;
  }, [birthDetails]);

  const natalCharts = useMemo<{ rashi: ChartHouse[]; bhava: ChartHouse[] }>(() => {
    if (!chartDetails) return { rashi: [], bhava: [] };
    return {
      rashi: deriveChartHouses(chartDetails),
      bhava: deriveChartHouses(chartDetails, { offset: 1 }),
    };
  }, [chartDetails]);

  const directives = transits?.directives ?? [];

  return (
    <div className="stack transits-page">
      <header className="panel softly">
        <p className="eyebrow">Transits</p>
        <h1>Real-time gochar overlays for your natal wheel.</h1>
        <p className="muted">
          Live transits refresh automatically each minute, mapped onto your natal houses with directive cards for quick
          interpretation.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard" className="button-link ghost-link">
            Back to dashboard
          </Link>
          <button type="button" className="button-link" onClick={fetchTransits} disabled={loading}>
            {loading ? "Syncing…" : "Refresh transits"}
          </button>
        </div>
      </header>

      <section className="card" aria-label="Transit overlay chart">
        <div className="section-heading">
          <h2>Natal chart overlay</h2>
          <p className="muted">Active transits are injected into the natal wheel for instant house context.</p>
        </div>
        <TransitOverlayChart
          title={birthDetails?.name ? `${birthDetails.name}'s natal wheel` : "Natal wheel"}
          houses={natalCharts.rashi}
          transits={directives}
        />
        {lastUpdated ? <p className="microcopy">Last updated {lastUpdated}</p> : null}
        {status ? <p className="microcopy">{status}</p> : null}
      </section>

      <section className="card" aria-label="Transit directives">
        <div className="section-heading">
          <h2>Transit directives</h2>
          <p className="muted">Actionable cues and folio references for active gochar windows.</p>
        </div>
        {transits?.interpretation ? <p className="muted">{transits.interpretation}</p> : null}
        <div className="card-grid" role="list">
          {directives.length ? (
            directives.map((directive, index) => (
              <article key={`${directive.reference}-${index}`} className="card" role="listitem">
                <p className="eyebrow">{directive.planet || "Transit"}</p>
                <h3>{directive.influence || "Transit directive"}</h3>
                <p className="muted">Reference: {directive.reference || "Bhrigu folio"}</p>
                {typeof directive.certainty === "number" ? (
                  <p className="microcopy">Certainty {Math.round(directive.certainty * 100)}%</p>
                ) : null}
              </article>
            ))
          ) : (
            <article className="card" role="listitem">
              <p className="muted">Transit directives will populate after the first sync.</p>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}
