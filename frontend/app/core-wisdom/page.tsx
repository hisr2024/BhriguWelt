"use client";

import EnginePage from "@/components/EnginePage";
import { engineBySlug } from "@/lib/engineConfig";

export default function CoreWisdomPage() {
  return <EnginePage config={engineBySlug["core-wisdom"]} />;
}
