import type { Metadata } from "next";

import AnalyticsDashboard from "./components/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics Dashboard | BhriguWelt",
  description: "Dashboard with every tool in one place.",
};

export default function DashboardPage() {
  return <AnalyticsDashboard />;
}
