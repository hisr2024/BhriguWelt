"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getVarshaphal } from "@/lib/api";

const REMEDY_FALLBACK_URL = "/calendar";

type VarshaphalRemedy = {
  title: string;
  description: string;
  action_label?: string;
  action_url?: string;
};

type VarshaphalMonth = {
  month: string;
  title: string;
  forecast: string;
  confidence?: number;
  highlights?: string[];
  remedies?: VarshaphalRemedy[];
};

type VarshaphalTimelineEvent = {
  label: string;
  window: string;
  highlight: string;
  confidence?: number;
};

type VarshaphalOverview = {
  theme?: string;
  focus?: string;
  summary?: string;
  confidence?: number;
};

type VarshaphalResponse = {
  year?: number;
  years?: number[];
  overview?: VarshaphalOverview;
  timeline?: VarshaphalTimelineEvent[];
  months?: VarshaphalMonth[];
  updated_at?: string;
};

export default function VarshaphalPage() {
  const [payload, setPayload] = useState<VarshaphalResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getVarshaphal(selectedYear)
      .then((data) => {
        if (!mounted) return;
        const response = data as VarshaphalResponse;
        setPayload(response);
        if (selectedYear === undefined && response.year) {
          setSelectedYear(response.year);
        }
        setStatus(null);
      })
      .catch(() => {
        if (mounted) {
          setStatus("Varshaphal insights will appear once the backend responds.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedYear]);

  const years = useMemo(() => {
    if (payload?.years?.length) return payload.years;
    if (payload?.year) return [payload.year];
    return [] as number[];
  }, [payload?.year, payload?.years]);

  const overviewConfidence = Math.round((payload?.overview?.confidence ?? 0) * 100);

  return (
    <div className="stack varshaphal-page">
      <header className="panel softly varshaphal-hero">
        <div>
          <p className="eyebrow">Varshaphal</p>
          <h1>Annual solar return with monthly pulse cards.</h1>
          <p className="muted">
            Track the year&apos;s rhythm, review confidence meters, and schedule remedies with a clean timeline view.
          </p>
        </div>
        <div className="varshaphal-hero__actions">
          <label className="varshaphal-year" htmlFor="varshaphal-year">
            <span className="microcopy">Select year</span>
            <select
              id="varshaphal-year"
              value={selectedYear ?? ""}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {years.length ? (
                years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              ) : (
                <option value="">Loading…</option>
              )}
            </select>
          </label>
          <div className="varshaphal-hero__links">
            <Link href="/dashboard" className="button-link ghost-link">
              Back to dashboard
            </Link>
            <Link href="/calendar" className="button-link">
              Schedule remedies
            </Link>
          </div>
        </div>
      </header>

      <section className="card highlight varshaphal-overview" aria-label="Varshaphal overview">
        <div className="section-heading">
          <h2>Year overview</h2>
          <p className="muted">Theme, focus, and confidence guidance for the solar return.</p>
        </div>
        <div className="varshaphal-overview__grid">
          <div>
            <p className="pill">Theme</p>
            <h3>{payload?.overview?.theme ?? "Centered renewal"}</h3>
            <p className="muted">{payload?.overview?.summary ?? "Stabilize core intentions and honor seasonal cycles."}</p>
          </div>
          <div>
            <p className="pill subtle">Primary focus</p>
            <h4>{payload?.overview?.focus ?? "Career and family balance"}</h4>
            <p className="microcopy">Review this focus during each monthly checkpoint.</p>
          </div>
          <div className="varshaphal-meter">
            <div className="varshaphal-meter__label">
              <span>Overall confidence</span>
              <span>{overviewConfidence}%</span>
            </div>
            <div className="varshaphal-meter__track" aria-hidden="true">
              <span style={{ width: `${overviewConfidence}%` }} />
            </div>
          </div>
        </div>
        {payload?.updated_at ? <p className="microcopy">Last updated {payload.updated_at}</p> : null}
        {loading ? <p className="microcopy">Syncing varshaphal insights…</p> : null}
        {status ? <p className="microcopy">{status}</p> : null}
      </section>

      <section className="varshaphal-timeline card" aria-label="Varshaphal timeline">
        <div className="section-heading">
          <h2>Year timeline</h2>
          <p className="muted">Quarterly inflection points and confidence levels.</p>
        </div>
        <div className="varshaphal-timeline__rail">
          {(payload?.timeline ?? []).map((item, index) => {
            const confidence = Math.round((item.confidence ?? 0) * 100);
            return (
              <article key={`${item.label}-${index}`} className="varshaphal-timeline__card">
                <span className="pill">{item.window}</span>
                <h3>{item.label}</h3>
                <p className="muted">{item.highlight}</p>
                <div className="varshaphal-meter">
                  <div className="varshaphal-meter__label">
                    <span>Confidence</span>
                    <span>{confidence}%</span>
                  </div>
                  <div className="varshaphal-meter__track" aria-hidden="true">
                    <span style={{ width: `${confidence}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="varshaphal-months" aria-label="Varshaphal monthly cards">
        <div className="section-heading">
          <h2>Monthly forecast cards</h2>
          <p className="muted">Detailed reading, highlights, and recommended remedial actions.</p>
        </div>
        <div className="varshaphal-months__grid">
          {(payload?.months ?? []).map((month) => {
            const confidence = Math.round((month.confidence ?? 0) * 100);
            return (
              <article key={month.month} className="card varshaphal-month">
                <header className="varshaphal-month__header">
                  <div>
                    <p className="pill">{month.month}</p>
                    <h3>{month.title}</h3>
                  </div>
                  <div className="varshaphal-meter">
                    <div className="varshaphal-meter__label">
                      <span>Confidence</span>
                      <span>{confidence}%</span>
                    </div>
                    <div className="varshaphal-meter__track" aria-hidden="true">
                      <span style={{ width: `${confidence}%` }} />
                    </div>
                  </div>
                </header>
                <p className="muted">{month.forecast}</p>
                {month.highlights?.length ? (
                  <ul className="varshaphal-month__highlights">
                    {month.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                ) : null}
                {month.remedies?.length ? (
                  <div className="varshaphal-remedies">
                    <p className="microcopy">Remedial focus</p>
                    {month.remedies.map((remedy) => (
                      <div key={remedy.title} className="varshaphal-remedy">
                        <div>
                          <h4>{remedy.title}</h4>
                          <p className="microcopy">{remedy.description}</p>
                        </div>
                        <Link
                          href={remedy.action_url ?? REMEDY_FALLBACK_URL}
                          className="button-link ghost-link"
                        >
                          {remedy.action_label ?? "Start remedy"}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
