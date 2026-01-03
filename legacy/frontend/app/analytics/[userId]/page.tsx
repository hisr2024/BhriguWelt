import AnalyticsDashboard from "@/components/AnalyticsDashboard";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AnalyticsUserPage({ params }: PageProps) {
  const { userId } = await params;
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Analytics</p>
        <h1>Seeker analytics</h1>
        <p className="muted">
          Precision analytics drawn from Bhrigu/Nadi principles, real-time feedback, and AI-enhanced interpretation.
        </p>
      </div>
      <AnalyticsDashboard userId={userId} />
    </section>
  );
}
