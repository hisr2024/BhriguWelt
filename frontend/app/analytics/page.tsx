import type { Metadata } from "next";
import EnginePage from "@/components/EnginePage";

export const metadata: Metadata = {
  title: "Analytics | BhriguWelt",
};

export default function AnalyticsPage() {
  return <EnginePage slug="analytics" />;
}
