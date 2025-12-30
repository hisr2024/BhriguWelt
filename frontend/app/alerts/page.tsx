import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Alerts | BhriguWelt",
};

export default function AlertsPage() {
  return <EnginePage slug="alerts" />;
}
