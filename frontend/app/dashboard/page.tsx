import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Dashboard | BhriguWelt",
};

export default function DashboardPage() {
  return <EnginePage slug="dashboard" />;
}
