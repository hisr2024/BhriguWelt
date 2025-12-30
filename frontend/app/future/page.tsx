"use client";

import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function FuturePage() {
  return <EnginePage config={engineBySlug["future"]} />;
}
