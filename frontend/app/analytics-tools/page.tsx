import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { getProfileIdentifiers } from "@/lib/profileStorage";

export default function AnalyticsToolsPage() {
  const identifiers = getProfileIdentifiers();
  const userId = identifiers.userId || "guest";

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Analytics Tools</p>
        <h1>Analytics Dashboard</h1>
        <p className="muted">
          Comprehensive analytics drawn from Bhrigu and Nadi principles with real-time feedback,
          AI-enhanced interpretation, and karmic insights.
        </p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured Analytics</p>
        <h2>Karmic Metrics & Insights</h2>
        <p className="muted">
          Track your karmic resonance, elemental balance, transit overlays, and Bhrigu Samhita principle weights.
        </p>
      </div>
      <AnalyticsDashboard userId={userId} />
    </section>
  );
}
