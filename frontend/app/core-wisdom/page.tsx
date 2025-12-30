"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import { requestCoreWisdom } from "@/lib/api";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { loadBirthDetails } from "@/lib/birthStorage";
import type { BirthDetails, ChartHouse, CoreWisdomPayload, DashaPeriod } from "@/types/astro";

const KundliCharts = dynamic(() => import("@/components/KundliCharts"), {
  ssr: false,
  loading: () => (
    <div className="panel softly core-wisdom-chart__loading" role="status" aria-live="polite">
      <p className="eyebrow">Charts loading</p>
      <p className="muted">Preparing the rashi and bhava wheels for the core wisdom digest.</p>
    </div>
  ),
});

const WebXRChart = dynamic(() => import("@/components/WebXRChart"), {
  ssr: false,
});

const SECTION_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8"];

const hasRequiredDetails = (details: BirthDetails) =>
  Boolean(details.birthDate && details.birthTime && details.birthPlace);

const splitSectionText = (value: string, index: number) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      title: `Section ${index + 1}`,
      body: "Awaiting core wisdom content.",
    };
  }
  const dividerIndex = trimmed.indexOf(":");
  if (dividerIndex === -1) {
    return { title: `Section ${index + 1}`, body: trimmed };
  }
  return {
    title: trimmed.slice(0, dividerIndex).trim(),
    body: trimmed.slice(dividerIndex + 1).trim(),
  };
};

const formatChartList = (label: string, chart?: ChartHouse[]) => {
  if (!chart?.length) return "";
  const lines = chart.map((house) => {
    const occupants = house.occupants?.length ? house.occupants.join(", ") : "—";
    const notes = house.bhrigu_notes?.length ? ` — ${house.bhrigu_notes.join("; ")}` : "";
    return `- House ${house.index} (${house.sign}): ${occupants}${notes}`;
  });
  return [`### ${label}`, ...lines, ""].join("\n");
};

const formatDashas = (dashas?: DashaPeriod[]) => {
  if (!dashas?.length) return "";
  const lines = dashas.map((dasha) => `- ${dasha.lord}: ${dasha.start} → ${dasha.end} (${dasha.anchor_rule})`);
  return [`### Dashas`, ...lines, ""].join("\n");
};

const formatRemedies = (payload?: CoreWisdomPayload) => {
  const remedies = payload?.remedies ?? [];
  if (!remedies.length) return "";
  const lines = remedies.map((remedy) => {
    const label = remedy.sutra_reference || remedy.id || "Remedy";
    const description = remedy.description || remedy.interpretation || "";
    return `- ${label}${description ? `: ${description}` : ""}`;
  });
  return ["## Remedies", ...lines, ""].join("\n");
};

const buildMarkdown = (payload: CoreWisdomPayload, sections: { title: string; body: string }[]) => {
  const lines: string[] = ["# Bhrigu Core Wisdom Digest", ""];
  if (payload.karmic_epoch) {
    lines.push("## Karmic epoch", payload.karmic_epoch, "");
  }
  sections.forEach((section) => {
    lines.push(`## ${section.title}`, section.body, "");
  });
  lines.push("## Charts", "");
  lines.push(formatChartList("Rāśi chart", payload.rashi_chart));
  lines.push(formatChartList("Bhava chart", payload.bhava_chart));
  lines.push(formatDashas(payload.dashas));
  lines.push(formatRemedies(payload));
  return lines.filter(Boolean).join("\n").trim();
};

export default function CoreWisdomPage() {
  const [birthDetails, setBirthDetails] = useState<BirthDetails | null>(null);
  const [payload, setPayload] = useState<CoreWisdomPayload | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sections = useMemo(() => {
    const source = payload?.sections ?? {};
    return SECTION_ORDER.map((key, index) => splitSectionText(source[key] ?? "", index));
  }, [payload?.sections]);

  const canFetch = useMemo(() => (birthDetails ? hasRequiredDetails(birthDetails) : false), [birthDetails]);

  const fetchWisdom = useCallback(async () => {
    if (!birthDetails || !hasRequiredDetails(birthDetails)) {
      setStatus("Add birth details first so the core wisdom can render.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const data = (await requestCoreWisdom(birthDetails)) as CoreWisdomPayload;
      setPayload(data);
      if (!data.sections) {
        setStatus("Core wisdom sections will appear once the backend returns the full digest.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach core wisdom service.";
      setStatus(message);
    } finally {
      setLoading(false);
    }
  }, [birthDetails]);

  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored) {
      setBirthDetails({ ...DEFAULT_BIRTH_DETAILS, ...stored });
      return;
    }
    setBirthDetails({ ...DEFAULT_BIRTH_DETAILS });
    setStatus("Add your birth details to unlock the core wisdom digest.");
  }, []);

  useEffect(() => {
    if (!birthDetails || !hasRequiredDetails(birthDetails)) return;
    void fetchWisdom();
  }, [birthDetails, fetchWisdom]);

  const handleExport = () => {
    if (!payload) return;
    const markdown = buildMarkdown(payload, sections);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bhrigu-core-wisdom.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="core-wisdom-shell">
      <header className="panel softly core-wisdom-hero">
        <p className="eyebrow">Core wisdom</p>
        <h1>Eight-section Bhrigu digest</h1>
        <p className="muted">
          The core wisdom deck condenses the Bhrigu Samhita flow into eight clear sections with charts and export-ready copy.
        </p>
        <div className="core-wisdom-actions">
          <button className="button-link" type="button" onClick={fetchWisdom} disabled={!canFetch || loading}>
            {loading ? "Refreshing…" : "Refresh core wisdom"}
          </button>
          <button className="button-link ghost-link" type="button" onClick={handleExport} disabled={!payload}>
            Export markdown
          </button>
          <Link className="ghost-link" href="/studio/intake">
            Update birth details
          </Link>
        </div>
        {status ? <p className="muted core-wisdom-status">{status}</p> : null}
      </header>

      <section className="core-wisdom-meta">
        <div className="panel softly">
          <p className="eyebrow">Snapshot</p>
          <h2>Reading context</h2>
          <div className="core-wisdom-meta__grid">
            <div>
              <p className="microcopy">Seeker</p>
              <p>{birthDetails?.name || "Seeker"}</p>
            </div>
            <div>
              <p className="microcopy">Birth details</p>
              <p>
                {birthDetails?.birthDate && birthDetails?.birthTime
                  ? `${birthDetails.birthDate} • ${birthDetails.birthTime}`
                  : "Awaiting"}
              </p>
              <p className="muted">{birthDetails?.birthPlace || "Add place of birth"}</p>
            </div>
            <div>
              <p className="microcopy">Karmic epoch</p>
              <p>{payload?.karmic_epoch || "Pending"}</p>
            </div>
          </div>
        </div>
        <div className="panel softly">
          <p className="eyebrow">Remedy focus</p>
          <h2>Immediate guidance</h2>
          {payload?.remedies?.length ? (
            <ul className="soft-list">
              {payload.remedies.slice(0, 4).map((remedy, index) => (
                <li key={`${remedy.id || remedy.sutra_reference || "remedy"}-${index}`}>
                  {remedy.description || remedy.interpretation || remedy.sutra_reference || "Remedy guidance"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Remedies will appear once the digest is loaded.</p>
          )}
        </div>
      </section>

      <section className="core-wisdom-grid" aria-label="Core wisdom sections">
        {sections.map((section, index) => (
          <article key={`${section.title}-${index}`} className="wisdom-card core-wisdom-card">
            <span className="wisdom-card__halo" aria-hidden />
            <p className="eyebrow">Section {index + 1}</p>
            <h3>{section.title}</h3>
            <p className="core-wisdom-card__body">{section.body}</p>
            <span className="wisdom-card__accent">Digest {index + 1} / 8</span>
          </article>
        ))}
      </section>

      <section className="core-wisdom-charts" aria-label="Core wisdom charts">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Charts</p>
            <h2>Rāśi + Bhava overview</h2>
            <p className="muted">Interactive charts anchor each section with the same chart data used in other engines.</p>
          </div>
          <span className="badge">Live</span>
        </header>
        <KundliCharts
          rashiChart={payload?.rashi_chart ?? []}
          bhavaChart={payload?.bhava_chart ?? []}
          dashas={payload?.dashas ?? []}
        />
        <WebXRChart rashiChart={payload?.rashi_chart ?? []} />
      </section>
    </div>
  );
}
