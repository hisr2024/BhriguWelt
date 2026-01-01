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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div 
          className="card analytics-stat-card profile-card" 
          variants={cardVariants}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
        >
          <div className="stat-icon">👥</div>
          <p className="eyebrow">Profile pulse</p>
          <h3>Seeker intelligence</h3>
          <p className="muted">Real-time updates every {refreshIntervalMs / 1000}s.</p>
          <motion.div 
            className="mt-4 space-y-2 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="flex items-center justify-between stat-row"
              whileHover={{ x: 5 }}
            >
              <span>Total profiles</span>
              <motion.span 
                className="font-semibold stat-value"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                {analyticsSnapshot?.profiles?.total ?? "—"}
              </motion.span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-between stat-row"
              whileHover={{ x: 5 }}
            >
              <span>Sessions active (7d)</span>
              <motion.span 
                className="font-semibold stat-value"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                {analyticsSnapshot?.sessions?.active_last_7_days ?? "—"}
              </motion.span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-between stat-row"
              whileHover={{ x: 5 }}
            >
              <span>Avg turns</span>
              <motion.span 
                className="font-semibold stat-value"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                {analyticsSnapshot?.sessions?.average_turns ?? "—"}
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="card analytics-stat-card karmic-card" 
          variants={cardVariants}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
        >
          <div className="stat-icon">🔮</div>
          <p className="eyebrow">Karmic epoch</p>
          <h3>{(coreWisdom as CoreWisdomPayload | undefined)?.karmic_epoch || "Awaiting core wisdom"}</h3>
          <p className="muted">Refined via bhrigu_data principles and Nadi overlays.</p>
          <motion.div 
            className="mt-4 space-y-2 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {karmicMetrics.map((metric, idx) => (
              <motion.div 
                key={metric.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <span>{metric.label}</span>
                  <span className="font-semibold">{Math.round(metric.value * 100)}%</span>
                </div>
                <p className="text-xs text-slate-500">{metric.citation}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="card analytics-stat-card export-card" 
          variants={cardVariants}
          whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
        >
          <div className="stat-icon">📊</div>
          <p className="eyebrow">Export</p>
          <h3>Shareable analytics</h3>
          <p className="muted">Download a PDF snapshot for ritual archives.</p>
          <motion.button
            type="button"
            onClick={() => window.print()}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Export to PDF
          </motion.button>
          <motion.p 
            className="mt-3 text-xs text-slate-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Last refreshed at {lastUpdated}.
          </motion.p>
        </motion.div>
      </div>

      {(coreWisdomError || analyticsError) && (
        <motion.div 
          className="card border border-amber-500/30 bg-amber-500/10 text-sm"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" }}
        >
          <strong className="block text-amber-800">We hit a visibility wall.</strong>
          <p className="mt-2 text-amber-900">
            {coreWisdomError?.message || analyticsError?.message || "Analytics data is temporarily unavailable."}
          </p>
          <p className="mt-1 text-xs text-amber-900/80">
            Ensure the backend is reachable and the admin token is configured for /analytics.
          </p>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <motion.div className="card interpretation-card" variants={cardVariants}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">AI-enhanced</p>
              <h3>Interpretation stream</h3>
              <p className="muted">AI narrative distilled from the core wisdom digest.</p>
            </div>
            {coreWisdomLoading || analyticsLoading ? (
              <motion.span 
                className="text-xs text-slate-500"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Syncing…
              </motion.span>
            ) : null}
          </div>
          <motion.p 
            className="mt-4 text-sm leading-relaxed text-slate-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {aiHighlights}
          </motion.p>
        </motion.div>
        
        <motion.div className="card aspects-card" variants={cardVariants}>
          <p className="eyebrow">Nadi aspects</p>
          <h3>Deterministic aspect mapping</h3>
          <p className="muted">House aspects computed via classical Nadi rules.</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {nadiAspects.length ? (
              nadiAspects.map((aspect, idx) => (
                <motion.li 
                  key={aspect}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                >
                  {aspect}
                </motion.li>
              ))
            ) : (
              <li>Awaiting chart data.</li>
            )}
          </ul>
        </motion.div>
      </div>

      <AnalyticsCharts
        karmicMetrics={karmicMetrics}
        elementBalance={elementBalance}
        transitOverlay={transitOverlay}
        principleWeights={principleWeights}
      />

      <motion.div className="card weights-card" variants={cardVariants}>
        <p className="eyebrow">Samhita signals</p>
        <h3>Aggregate principle weights</h3>
        <p className="muted">
          Aggregated weights computed from the bhrigu_data manuscript cache to mirror karmic emphasis.
        </p>
        <div className="mt-4 space-y-3">
          {principleWeights.length ? (
            principleWeights.map((weight, idx) => (
              <motion.div 
                key={weight.id} 
                className="text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <span className="capitalize">{weight.label}</span>
                  <span className="font-semibold">{Math.round(weight.value * 100)}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    className="h-2 rounded-full bg-amber-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(weight.value * 100)}%` }}
                    transition={{ delay: 0.8 + idx * 0.1, duration: 0.8 }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{weight.citation}</p>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Principle weights will populate once the manuscript cache loads.</p>
          )}
        </div>
      </motion.div>

      <style jsx>{`
        .analytics-stat-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(14, 165, 233, 0.05));
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .profile-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(167, 139, 250, 0.08));
        }

        .karmic-card {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(251, 113, 133, 0.08));
        }

        .export-card {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(6, 182, 212, 0.08));
        }

        .stat-icon {
          font-size: 2.5rem;
          position: absolute;
          top: 1rem;
          right: 1rem;
          opacity: 0.15;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }

        .stat-row {
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(139, 92, 246, 0.1);
          transition: all 0.2s ease;
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-value {
          color: #8B5CF6;
          font-size: 1.1rem;
        }

        .interpretation-card,
        .aspects-card,
        .weights-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9));
          border: 1px solid rgba(139, 92, 246, 0.15);
        }
      `}</style>
    </motion.div>
  );
}
