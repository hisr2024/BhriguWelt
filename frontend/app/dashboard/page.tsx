import type { Metadata } from "next";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Dashboard | BhriguWelt",
};

export default function DashboardPage() {
  return <AnalyticsDashboard />;
}
