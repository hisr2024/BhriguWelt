"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "@/vendor/swr";
import { useMemo, useState } from "react";
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
import { easeOut } from "@/lib/animations";

const AnalyticsCharts = dynamic(() => import("@/components/AnalyticsCharts"), {
  ssr: false,
  loading: () => (
    <div className="card">
      <motion.div
        className="flex items-center justify-center p-8"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm text-slate-500">Loading interactive charts...</p>
        </div>
      </motion.div>
    </div>
  ),
});

const refreshIntervalMs = 15000;

const ELEMENT_CONFIG = {
  fire: { icon: "🔥", label: "Fire" },
  water: { icon: "💧", label: "Water" },
  air: { icon: "🌫️", label: "Air" },
  earth: { icon: "🌍", label: "Earth" },
} as const;

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
  const [activeView, setActiveView] = useState<"overview" | "karmic" | "planetary" | "insights">("overview");
  const [showDetails, setShowDetails] = useState<string | null>(null);

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
        staggerChildren: 0.05,
        delayChildren: 0.05,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: easeOut,
      },
    },
  };

  const viewTabs = [
    { id: "overview", label: "Overview", icon: "🌟" },
    { id: "karmic", label: "Karmic Insights", icon: "🔮" },
    { id: "planetary", label: "Planetary Analysis", icon: "🪐" },
    { id: "insights", label: "AI Insights", icon: "🧠" },
  ];

  return (
    <motion.div
      className="analytics-dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div className="dashboard-header" variants={cardVariants}>
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">✨</span>
            Analytics Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Interactive insights powered by Bhrigu Samhita wisdom and astrological intelligence
          </p>
        </div>
        <motion.div
          className="refresh-indicator"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="refresh-dot"></span>
          <span className="refresh-text">Live • Updated {lastUpdated}</span>
        </motion.div>
      </motion.div>

      {/* View Tabs */}
      <motion.div className="view-tabs" variants={cardVariants}>
        {viewTabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`view-tab ${activeView === tab.id ? "active" : ""}`}
            onClick={() => setActiveView(tab.id as typeof activeView)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Error State */}
      {(coreWisdomError || analyticsError) && (
        <motion.div
          className="error-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <strong className="error-title">Connection Issue</strong>
            <p className="error-message">
              {coreWisdomError?.message || analyticsError?.message || "Analytics data is temporarily unavailable."}
            </p>
            <p className="error-hint">
              The backend service may be unreachable. Please check your connection and try again.
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Content - Overview */}
      <AnimatePresence mode="wait">
        {activeView === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Stats Grid */}
            <div className="stats-grid">
              <motion.div
                className="stat-card profile-stat"
                variants={cardVariants}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(139, 92, 246, 0.2)" }}
                onClick={() => setShowDetails(showDetails === "profiles" ? null : "profiles")}
              >
                <div className="stat-header">
                  <div className="stat-icon-wrapper">
                    <motion.div
                      className="stat-icon"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      👥
                    </motion.div>
                  </div>
                  <div className="stat-meta">
                    <p className="stat-label">Profile Analytics</p>
                    <motion.h3
                      className="stat-value"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      {analyticsSnapshot?.profiles?.total ?? "—"}
                    </motion.h3>
                    <p className="stat-caption">Total Seekers</p>
                  </div>
                </div>

                <AnimatePresence>
                  {showDetails === "profiles" && (
                    <motion.div
                      className="stat-details"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="detail-row">
                        <span>Active Sessions (7d)</span>
                        <span className="detail-value">{analyticsSnapshot?.sessions?.active_last_7_days ?? "—"}</span>
                      </div>
                      <div className="detail-row">
                        <span>Average Turns</span>
                        <span className="detail-value">{analyticsSnapshot?.sessions?.average_turns ?? "—"}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div
                className="stat-card karmic-stat"
                variants={cardVariants}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(236, 72, 153, 0.2)" }}
              >
                <div className="stat-header">
                  <div className="stat-icon-wrapper">
                    <motion.div
                      className="stat-icon"
                      animate={{
                        scale: [1, 1.1, 1],
                        filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      🔮
                    </motion.div>
                  </div>
                  <div className="stat-meta">
                    <p className="stat-label">Karmic Epoch</p>
                    <h3 className="stat-value-text">
                      {(coreWisdom as CoreWisdomPayload | undefined)?.karmic_epoch || "Calculating..."}
                    </h3>
                    <p className="stat-caption">Based on Nadi Jyotisha</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="stat-card wisdom-stat"
                variants={cardVariants}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(14, 165, 233, 0.2)" }}
              >
                <div className="stat-header">
                  <div className="stat-icon-wrapper">
                    <motion.div
                      className="stat-icon"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    >
                      📚
                    </motion.div>
                  </div>
                  <div className="stat-meta">
                    <p className="stat-label">Manuscript Principles</p>
                    <motion.h3
                      className="stat-value"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    >
                      {principleWeights.length}
                    </motion.h3>
                    <p className="stat-caption">Active Wisdom Rules</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="stat-card export-stat"
                variants={cardVariants}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(16, 185, 129, 0.2)" }}
              >
                <div className="stat-header">
                  <div className="stat-icon-wrapper">
                    <div className="stat-icon">📊</div>
                  </div>
                  <div className="stat-meta">
                    <p className="stat-label">Export Analytics</p>
                    <motion.button
                      type="button"
                      onClick={() => window.print()}
                      className="export-button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Download PDF
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Section */}
            <motion.div variants={cardVariants}>
              <AnalyticsCharts
                karmicMetrics={karmicMetrics}
                elementBalance={elementBalance}
                transitOverlay={transitOverlay}
                principleWeights={principleWeights}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Karmic Insights View */}
        {activeView === "karmic" && (
          <motion.div
            key="karmic"
            className="content-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="content-grid">
              <motion.div className="content-card karmic-metrics-card" variants={cardVariants}>
                <div className="card-header">
                  <h3 className="card-title">
                    <span className="title-icon">🔮</span>
                    Karmic Metrics
                  </h3>
                  <p className="card-subtitle">Derived from Bhrigu Samhita principles</p>
                </div>
                <div className="metrics-list">
                  {karmicMetrics.length > 0 ? (
                    karmicMetrics.map((metric, idx) => (
                      <motion.div
                        key={metric.id}
                        className="metric-item"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <div className="metric-header">
                          <span className="metric-label">{metric.label}</span>
                          <span className="metric-value">{Math.round(metric.value * 100)}%</span>
                        </div>
                        <div className="metric-bar-wrapper">
                          <motion.div
                            className="metric-bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(metric.value * 100)}%` }}
                            transition={{ delay: idx * 0.1 + 0.2, duration: 0.8 }}
                          />
                        </div>
                        <p className="metric-citation">{metric.citation}</p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🌙</div>
                      <p>Calculating karmic metrics...</p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div className="content-card element-balance-card" variants={cardVariants}>
                <div className="card-header">
                  <h3 className="card-title">
                    <span className="title-icon">⚖️</span>
                    Element Balance
                  </h3>
                  <p className="card-subtitle">Pancha Mahabhuta distribution</p>
                </div>
                <div className="element-grid">
                  {Object.entries(elementBalance).map(([key, value], idx) => {
                    const config = ELEMENT_CONFIG[key as keyof typeof ELEMENT_CONFIG];
                    if (!config) return null;
                    return (
                      <motion.div
                        key={key}
                        className="element-item"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="element-icon">{config.icon}</div>
                        <div className="element-name">{config.label}</div>
                        <div className="element-value">{value}</div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <motion.div className="content-card principle-weights-card" variants={cardVariants}>
              <div className="card-header">
                <h3 className="card-title">
                  <span className="title-icon">⚡</span>
                  Principle Weights
                </h3>
                <p className="card-subtitle">Manuscript-based karmic emphasis</p>
              </div>
              <div className="principles-grid">
                {principleWeights.length > 0 ? (
                  principleWeights.map((weight, idx) => (
                    <motion.div
                      key={weight.id}
                      className="principle-item"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                    >
                      <div className="principle-header">
                        <span className="principle-label">{weight.label}</span>
                        <span className="principle-value">{Math.round(weight.value * 100)}%</span>
                      </div>
                      <div className="principle-bar-wrapper">
                        <motion.div
                          className="principle-bar"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(weight.value * 100)}%` }}
                          transition={{ delay: idx * 0.08 + 0.3, duration: 0.8, ease: easeOut }}
                        />
                      </div>
                      <p className="principle-citation">{weight.citation}</p>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📖</div>
                    <p>Loading manuscript principles...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Planetary Analysis View */}
        {activeView === "planetary" && (
          <motion.div
            key="planetary"
            className="content-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div className="content-card nadi-aspects-card" variants={cardVariants}>
              <div className="card-header">
                <h3 className="card-title">
                  <span className="title-icon">🪐</span>
                  Nadi Aspects
                </h3>
                <p className="card-subtitle">Classical Nadi Jyotisha house aspects</p>
              </div>
              <div className="aspects-grid">
                {nadiAspects.length > 0 ? (
                  nadiAspects.map((aspect, idx) => (
                    <motion.div
                      key={idx}
                      className="aspect-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 5, backgroundColor: "rgba(139, 92, 246, 0.05)" }}
                    >
                      <span className="aspect-bullet">•</span>
                      <span className="aspect-text">{aspect}</span>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">⭐</div>
                    <p>Calculating planetary aspects...</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div className="content-card transit-overlay-card" variants={cardVariants}>
              <div className="card-header">
                <h3 className="card-title">
                  <span className="title-icon">🌙</span>
                  Transit Overlays
                </h3>
                <p className="card-subtitle">Current planetary transits and their effects</p>
              </div>
              <div className="transit-content">
                {transitOverlay.positions.length > 0 ? (
                  <div className="transit-grid">
                    {transitOverlay.positions.map((transit, idx) => (
                      <motion.div
                        key={idx}
                        className="transit-item"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="transit-label">{transit.planet}</div>
                        <div className="transit-value">{transit.degree}°</div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🌠</div>
                    <p>Loading transit data...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* AI Insights View */}
        {activeView === "insights" && (
          <motion.div
            key="insights"
            className="content-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div className="content-card ai-insights-card" variants={cardVariants}>
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <span className="title-icon">🧠</span>
                    AI-Powered Interpretations
                  </h3>
                  <p className="card-subtitle">Synthesized wisdom from your astrological data</p>
                </div>
                {(coreWisdomLoading || analyticsLoading) && (
                  <motion.span
                    className="loading-badge"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Syncing...
                  </motion.span>
                )}
              </div>
              <motion.div
                className="ai-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {aiHighlights ? (
                  <p className="ai-text">{aiHighlights}</p>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">✨</div>
                    <p>Generating AI insights from your chart...</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .analytics-dashboard {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem;
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
        }

        /* Header */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .header-content {
          flex: 1;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .title-icon {
          font-size: 2.5rem;
          filter: drop-shadow(0 4px 8px rgba(139, 92, 246, 0.3));
        }

        .dashboard-subtitle {
          color: #64748b;
          font-size: 1.1rem;
        }

        .refresh-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
          border-radius: 9999px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .refresh-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .refresh-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }

        /* View Tabs */
        .view-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 0.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          flex-wrap: wrap;
        }

        .view-tab {
          flex: 1;
          min-width: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-tab:hover {
          background: rgba(139, 92, 246, 0.05);
          color: #8B5CF6;
        }

        .view-tab.active {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          color: white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .tab-icon {
          font-size: 1.5rem;
        }

        /* Error Banner */
        .error-banner {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(251, 146, 60, 0.1));
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
        }

        .error-icon {
          font-size: 2rem;
        }

        .error-title {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
          color: #991b1b;
          margin-bottom: 0.5rem;
        }

        .error-message {
          color: #dc2626;
          margin-bottom: 0.25rem;
        }

        .error-hint {
          font-size: 0.875rem;
          color: #9a3412;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .profile-stat {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(167, 139, 250, 0.05));
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .karmic-stat {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(251, 113, 133, 0.05));
          border: 1px solid rgba(236, 72, 153, 0.2);
        }

        .wisdom-stat {
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.05), rgba(6, 182, 212, 0.05));
          border: 1px solid rgba(14, 165, 233, 0.2);
        }

        .export-stat {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .stat-header {
          display: flex;
          align-items: flex-start;
          gap: 1.5rem;
        }

        .stat-icon-wrapper {
          flex-shrink: 0;
        }

        .stat-icon {
          font-size: 3rem;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
        }

        .stat-meta {
          flex: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 3rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-value-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
          margin-bottom: 0.25rem;
        }

        .stat-caption {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .stat-details {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(139, 92, 246, 0.2);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          font-size: 0.875rem;
        }

        .detail-value {
          font-weight: 700;
          color: #8B5CF6;
        }

        .export-button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #16a34a, #10b981);
          color: white;
          border: none;
          border-radius: 9999px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        /* Content Grid */
        .content-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .content-card {
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .card-header {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: #64748b;
        }

        .loading-badge {
          padding: 0.5rem 1rem;
          background: rgba(139, 92, 246, 0.1);
          color: #8B5CF6;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Metrics */
        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .metric-item {
          padding: 1rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.03), rgba(236, 72, 153, 0.03));
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.1);
          transition: all 0.3s ease;
        }

        .metric-item:hover {
          border-color: rgba(139, 92, 246, 0.3);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .metric-label {
          font-weight: 600;
          color: #1e293b;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .metric-bar-wrapper {
          height: 8px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .metric-bar {
          height: 100%;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border-radius: 9999px;
        }

        .metric-citation {
          font-size: 0.75rem;
          color: #64748b;
          font-style: italic;
        }

        /* Elements */
        .element-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
        }

        .element-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.1);
          text-align: center;
          transition: all 0.3s ease;
        }

        .element-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .element-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 0.25rem;
        }

        .element-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #8B5CF6;
        }

        /* Principles */
        .principles-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .principle-item {
          padding: 1rem;
          background: linear-gradient(135deg, rgba(14, 165, 233, 0.03), rgba(6, 182, 212, 0.03));
          border-radius: 12px;
          border: 1px solid rgba(14, 165, 233, 0.1);
        }

        .principle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .principle-label {
          font-weight: 600;
          color: #1e293b;
          text-transform: capitalize;
        }

        .principle-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0ea5e9;
        }

        .principle-bar-wrapper {
          height: 6px;
          background: #e0f2fe;
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .principle-bar {
          height: 100%;
          background: linear-gradient(135deg, #0ea5e9, #06b6d4);
          border-radius: 9999px;
        }

        .principle-citation {
          font-size: 0.75rem;
          color: #64748b;
          font-style: italic;
        }

        /* Aspects */
        .aspects-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .aspect-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(139, 92, 246, 0.03);
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .aspect-bullet {
          color: #8B5CF6;
          font-size: 1.5rem;
        }

        .aspect-text {
          flex: 1;
          color: #334155;
          line-height: 1.5;
        }

        /* Transit */
        .transit-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .transit-item {
          padding: 1rem;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(251, 113, 133, 0.05));
          border-radius: 12px;
          border: 1px solid rgba(236, 72, 153, 0.1);
          text-align: center;
        }

        .transit-label {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .transit-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #EC4899;
        }

        /* AI Insights */
        .ai-content {
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.03), rgba(236, 72, 153, 0.03));
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.1);
        }

        .ai-text {
          font-size: 1.1rem;
          line-height: 1.8;
          color: #334155;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
          color: #94a3b8;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .analytics-dashboard {
            padding: 1rem;
          }

          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            padding: 1.5rem;
          }

          .dashboard-title {
            font-size: 1.75rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .content-grid {
            grid-template-columns: 1fr;
          }

          .view-tabs {
            overflow-x: auto;
          }

          .view-tab {
            flex: none;
          }
        }
      `}</style>
    </motion.div>
  );
}
