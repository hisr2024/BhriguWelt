import type { Metadata } from "next";

import EnginePage from "@/components/EnginePage";
import { DashboardPanel } from "@/components/EngineForms";
import { ENGINE_MAP } from "@/components/engineData";

export const metadata: Metadata = {
  title: "Analytics Dashboard | BhriguWelt",
  description:
    "Interactive analytics dashboard covering engine inputs, outputs, and real-time performance insights.",
};

export default function DashboardPage() {
  return (
    <EnginePage engine={ENGINE_MAP["dashboard"]}>
      <DashboardPanel />
    </EnginePage>
  );
}
