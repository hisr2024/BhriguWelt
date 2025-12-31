"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import useSWR from "@/vendor/swr";
import { useMemo } from "react";
import { fetchAnalyticsSnapshot, fetchManuscript, fetchProfileSession, requestCoreWisdom } from "@/lib/api";
import { getProfileIdentifiers } from "@/lib/profileStorage";
import type { BirthDetails, CoreWisdomPayload } from "@/types/astro";
import {
  aggregatePrincipleWeights,
  buildTransitOverlay,
  deriveKarmicMetrics,
  deriveNadiAspects,
  extractAiHighlights,
  summarizeElementBalance,
  type AnalyticsSnapshot,
  type ManuscriptPrinciple,
} from "@/lib/analytics";

const AnalyticsCharts = dynamic(() => import("@/components/AnalyticsCharts"), {
  ssr: false,
  loading: () => <div className="card">Loading charts…</div>,
});

const refreshIntervalMs = 15000;

type Props = {
  userId: string;
};

const fallbackBirthDetails: BirthDetails = {
  name: "Seeker",
  birthDate: "1995-08-18",
  birthTime: "06:30",
  birthPlace: "Jaipur, Bharat",
  timezone: "Asia/Kolkata",
  tradition: "universal",
  lunarTithi: "1",
  moonElement: "water",
  marsHouse: "1",
  saturnHouse: "7",
  venusHouse: "4",
  rahuAspectsAscendant: true,
  ketuHouse: "12",
  mercuryHouse: "3",
  jupiterHouse: "9",
  saturnRetrograde: false,
};

function mapProfileToBirthDetails(profile: Record<string, unknown> | undefined) {
  if (!profile) return fallbackBirthDetails;
  const details = {
    name: (profile.full_name as string) || fallbackBirthDetails.name,
    birthDate: (profile.date_of_birth as string) || fallbackBirthDetails.birthDate,
    birthTime: (profile.time_of_birth as string) || fallbackBirthDetails.birthTime,
    birthPlace: (profile.place_of_birth as string) || fallbackBirthDetails.birthPlace,
    timezone: (profile.timezone as string) || fallbackBirthDetails.timezone,
    tradition: (profile.tradition as string) || fallbackBirthDetails.tradition,
  };
  return { ...fallbackBirthDetails, ...details };
}

export default function AnalyticsDashboard({ userId }: Props) {
  const identifiers = useMemo(() => getProfileIdentifiers(), []);
  const profileKey = identifiers.sessionKey ? ["profile", userId, identifiers.sessionKey] : null;
  const { data: profilePayload } = useSWR(profileKey, () => fetchProfileSession(userId, identifiers.sessionKey));

  const birthDetails = useMemo(
    () => mapProfileToBirthDetails(profilePayload?.profile as Record<string, unknown> | undefined),
    [profilePayload],
  );

  const { data: coreWisdom, error: coreWisdomError, isLoading: coreWisdomLoading } = useSWR(
    ["core-wisdom", userId],
    () => requestCoreWisdom(birthDetails, ["dharma", "career", "relationships", "health"]),
    { refreshInterval: refreshIntervalMs * 2, revalidateOnFocus: true },
  );

  const {
    data: analyticsSnapshot,
    error: analyticsError,
    isLoading: analyticsLoading,
  } = useSWR<AnalyticsSnapshot>(["analytics", userId], fetchAnalyticsSnapshot, {
    refreshInterval: refreshIntervalMs,
    revalidateOnFocus: true,
  });

  const { data: manuscript } = useSWR(["manuscript"], fetchManuscript, {
    revalidateOnFocus: false,
  });

  const karmicMetrics = useMemo(
    () => deriveKarmicMetrics(coreWisdom as CoreWisdomPayload),
    [coreWisdom],
  );
  const transitOverlay = useMemo(
    () => buildTransitOverlay((coreWisdom as CoreWisdomPayload | undefined)?.rashi_chart),
    [coreWisdom],
  );
  const elementBalance = useMemo(
    () => summarizeElementBalance((coreWisdom as CoreWisdomPayload | undefined)?.rashi_chart),
    [coreWisdom],
  );
  const principleWeights = useMemo(
    () => aggregatePrincipleWeights((manuscript as { principles?: ManuscriptPrinciple[] } | undefined)?.principles),
    [manuscript],
  );
  const nadiAspects = useMemo(
    () => deriveNadiAspects((coreWisdom as CoreWisdomPayload | undefined)?.bhava_chart),
    [coreWisdom],
  );
  const aiHighlights = useMemo(
    () => extractAiHighlights(coreWisdom as CoreWisdomPayload),
    [coreWisdom],
  );

  const lastUpdated = new Date().toLocaleTimeString();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">Profile pulse</p>
          <h3>Seeker intelligence</h3>
          <p className="muted">Real-time updates every {refreshIntervalMs / 1000}s.</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Total profiles</span>
              <span className="font-semibold">{analyticsSnapshot?.profiles?.total ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sessions active (7d)</span>
              <span className="font-semibold">{analyticsSnapshot?.sessions?.active_last_7_days ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Avg turns</span>
              <span className="font-semibold">{analyticsSnapshot?.sessions?.average_turns ?? "—"}</span>
            </div>
          </div>
        </motion.div>
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">Karmic epoch</p>
          <h3>{(coreWisdom as CoreWisdomPayload | undefined)?.karmic_epoch || "Awaiting core wisdom"}</h3>
          <p className="muted">Refined via bhrigu_data principles and Nadi overlays.</p>
          <div className="mt-4 space-y-2 text-sm">
            {karmicMetrics.map((metric) => (
              <div key={metric.id}>
                <div className="flex items-center justify-between">
                  <span>{metric.label}</span>
                  <span className="font-semibold">{Math.round(metric.value * 100)}%</span>
                </div>
                <p className="text-xs text-slate-500">{metric.citation}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">Export</p>
          <h3>Shareable analytics</h3>
          <p className="muted">Download a PDF snapshot for ritual archives.</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Export to PDF
          </button>
          <p className="mt-3 text-xs text-slate-500">Last refreshed at {lastUpdated}.</p>
        </motion.div>
      </div>

      {(coreWisdomError || analyticsError) && (
        <div className="card border border-amber-500/30 bg-amber-500/10 text-sm">
          <strong className="block text-amber-800">We hit a visibility wall.</strong>
          <p className="mt-2 text-amber-900">
            {coreWisdomError?.message || analyticsError?.message || "Analytics data is temporarily unavailable."}
          </p>
          <p className="mt-1 text-xs text-amber-900/80">
            Ensure the backend is reachable and the admin token is configured for /analytics.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">AI-enhanced</p>
              <h3>Interpretation stream</h3>
              <p className="muted">AI narrative distilled from the core wisdom digest.</p>
            </div>
            {coreWisdomLoading || analyticsLoading ? <span className="text-xs text-slate-500">Syncing…</span> : null}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">{aiHighlights}</p>
        </motion.div>
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">Nadi aspects</p>
          <h3>Deterministic aspect mapping</h3>
          <p className="muted">House aspects computed via classical Nadi rules.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {nadiAspects.length ? nadiAspects.map((aspect) => <li key={aspect}>{aspect}</li>) : <li>Awaiting chart data.</li>}
          </ul>
        </motion.div>
      </div>

      <AnalyticsCharts
        karmicMetrics={karmicMetrics}
        elementBalance={elementBalance}
        transitOverlay={transitOverlay}
        principleWeights={principleWeights}
      />

      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="eyebrow">Samhita signals</p>
        <h3>Aggregate principle weights</h3>
        <p className="muted">
          Aggregated weights computed from the bhrigu_data manuscript cache to mirror karmic emphasis.
        </p>
        <div className="mt-4 space-y-3">
          {principleWeights.length ? (
            principleWeights.map((weight) => (
              <div key={weight.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="capitalize">{weight.label}</span>
                  <span className="font-semibold">{Math.round(weight.value * 100)}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-amber-400"
                    style={{ width: `${Math.round(weight.value * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{weight.citation}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Principle weights will populate once the manuscript cache loads.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
