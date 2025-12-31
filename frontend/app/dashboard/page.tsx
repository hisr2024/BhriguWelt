import type { Metadata } from "next";

import AnalyticsDashboard from "./components/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics Dashboard | BhriguWelt",
  description:
    "Interactive analytics dashboard covering engine inputs, outputs, and real-time performance insights.",
};

export default function DashboardPage() {
  return <AnalyticsDashboard />;
}
