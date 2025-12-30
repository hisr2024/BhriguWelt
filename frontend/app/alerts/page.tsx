"use client";

import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function AlertsPage() {
  return <EnginePage config={engineBySlug["alerts"]} />;
}
