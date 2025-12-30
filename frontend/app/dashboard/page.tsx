import type { Metadata } from "next";

import AnalyticsDashboard from "./components/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics Dashboard | BhriguWelt",
  description:
    "Interactive analytics dashboard covering engine inputs, outputs, and real-time performance insights.",
};

export default function DashboardPage() {
  return <AnalyticsDashboard />;
import EnginePage from "@/components/EnginePage";
import { DashboardPanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export default function DashboardPage() {
  return (
    <EnginePage engine={ENGINE_MAP["dashboard"]}>
      <DashboardPanel />
    </EnginePage>
  );
}
